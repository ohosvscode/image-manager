import type { AxiosProgressEvent } from 'axios'
import type { Emitter, EventHandlerMap, Handler } from 'mitt'
import type Stream from 'node:stream'
import type { BaseImage } from './images/image'
import type { LocalImageImpl } from './images/local-image'
import type { RemoteImageImpl } from './images/remote-image'
import axios from 'axios'
import mitt from 'mitt'
import progress from 'progress-stream'
import unzipper from 'unzipper'

export interface ImageDownloadProgressEvent extends AxiosProgressEvent {
  /**
   * The network speed of the download.
   */
  network: number
  /**
   * The unit of the network speed.
   */
  unit: 'KB' | 'MB'
  /**
   * The increment of the {@linkcode ImageDownloadProgressEvent.percentage}.
   */
  increment: number
}

export interface ExtractProgressEvent extends progress.Progress {}

// eslint-disable-next-line ts/consistent-type-definitions
export type ImageDownloadEventMap = {
  'download-progress': ImageDownloadProgressEvent
  'extract-progress': ExtractProgressEvent
}

export interface ImageDownloader<T extends BaseImage> extends Emitter<ImageDownloadEventMap> {
  /**
   * Start downloading the image.
   *
   * @param signal - The abort signal.
   */
  startDownload(signal?: AbortSignal): Promise<void>
  /**
   * Check the checksum of the image.
   *
   * @param signal - The abort signal.
   */
  checkChecksum(signal?: AbortSignal): Promise<boolean>
  /**
   * Extract the image.
   *
   * @param signal - The abort signal.
   * @param symlinkOpenHarmonySdk - If true, symlink the OpenHarmony SDK to the image. Default is `true`.
   */
  extract(signal?: AbortSignal, symlinkOpenHarmonySdk?: boolean): Promise<void>
  /**
   * Clean the cache of the image.
   */
  clean(): Promise<void>
  /**
   * Get the image.
   */
  getImage(): T
  /**
   * Get the URL of the image.
   */
  getUrl(): string
}

class ImageDownloaderImpl<T extends LocalImageImpl | RemoteImageImpl> implements ImageDownloader<T> {
  emitter = mitt<ImageDownloadEventMap>()
  all: EventHandlerMap<ImageDownloadEventMap> = this.emitter.all

  on(type: string, handler: unknown): void {
    this.emitter.on(type as keyof ImageDownloadEventMap, handler as Handler<ImageDownloadEventMap[keyof ImageDownloadEventMap]>)
  }

  off(type: unknown, handler?: unknown): void {
    this.emitter.off(type as keyof ImageDownloadEventMap, handler as Handler<ImageDownloadEventMap[keyof ImageDownloadEventMap]>)
  }

  emit(type: unknown, event?: unknown): void {
    this.emitter.emit(type as keyof ImageDownloadEventMap, event as ImageDownloadEventMap[keyof ImageDownloadEventMap])
  }

  constructor(
    private readonly image: T,
    private readonly url: string,
  ) {}

  getImage(): T {
    return this.image
  }

  getUrl(): string {
    return this.url
  }

  getCacheFsPath(): string {
    const { path, cachePath } = this.image.getImageManager().getOptions()
    return path.resolve(cachePath, path.basename(this.url))
  }

  async startDownload(signal?: AbortSignal): Promise<void> {
    const { fs, cachePath } = this.image.getImageManager().getOptions()
    const cacheFsPath = this.getCacheFsPath()
    if (!fs.existsSync(cachePath))
      fs.mkdirSync(cachePath, { recursive: true })
    const startByte = fs.existsSync(cacheFsPath) ? fs.statSync(cacheFsPath).size : 0
    const transformProgress = this.createProgressTransformer(startByte)
    const response = await axios.get<Stream.Readable>(this.url, {
      headers: startByte > 0 ? { Range: `bytes=${startByte}-` } : {},
      responseType: 'stream',
      validateStatus: status => (status === 200 || status === 206),
      onDownloadProgress: progress => this.emit('download-progress', transformProgress(progress)),
      signal,
    })
    const isPartialContent = response.status === 206
    const writeStart = (startByte > 0 && isPartialContent) ? startByte : 0
    const writeFlags = writeStart > 0 ? 'a' : 'w'
    if (startByte > 0 && !isPartialContent) {
      fs.rmSync(cacheFsPath, { force: true })
    }
    const writeStream = fs.createWriteStream(cacheFsPath, {
      flags: writeFlags,
      start: writeStart,
    })
    response.data.pipe(writeStream)
    await new Promise<void>((resolve, reject) => {
      let settled = false
      const onError = (err: Error) => {
        if (settled)
          return
        settled = true
        response.data.destroy()
        writeStream.destroy()
        reject(err)
      }
      const onFinish = () => {
        if (settled)
          return
        settled = true
        resolve()
      }
      response.data.on('error', onError)
      writeStream.on('error', onError)
      response.data.on('end', () => writeStream.end())
      writeStream.on('finish', onFinish)
    })
  }

  async checkChecksum(signal?: AbortSignal): Promise<boolean> {
    const { crypto, fs } = this.image.getImageManager().getOptions()
    const checksum = this.image.getChecksum()
    const hash = crypto.createHash('sha256', { signal })
    const stream = fs.createReadStream(this.getCacheFsPath(), { signal })
    stream.on('data', (chunk: Uint8Array) => hash.update(chunk))
    await new Promise<void>((resolve, reject) => stream.on('end', resolve).on('error', reject))
    const calculatedChecksum = hash.digest('hex')
    return calculatedChecksum === checksum
  }

  async extract(signal?: AbortSignal, symlinkOpenHarmonySdk: boolean = true): Promise<void> {
    const { fs, path, imageBasePath, sdkPath } = this.image.getImageManager().getOptions()
    const cacheFsPath = this.getCacheFsPath()
    const stream = fs.createReadStream(cacheFsPath, { signal })
    const progressStream = progress({ length: fs.statSync(cacheFsPath).size })
    const extractStream = unzipper.Extract({ path: this.image.getFsPath() })
    progressStream.on('progress', progress => this.emitter.emit('extract-progress', progress))
    stream.pipe(progressStream).pipe(extractStream)
    await extractStream.promise()
    if (symlinkOpenHarmonySdk) {
      const symlinkSdkPath = path.resolve(imageBasePath, 'default', 'openharmony')
      if (!fs.existsSync(path.dirname(symlinkSdkPath)))
        fs.mkdirSync(path.dirname(symlinkSdkPath), { recursive: true })
      if (!fs.existsSync(symlinkSdkPath))
        fs.symlinkSync(sdkPath, symlinkSdkPath)
    }
  }

  async clean(): Promise<void> {
    const { fs } = this.image.getImageManager().getOptions()
    const cacheFsPath = this.getCacheFsPath()
    if (fs.existsSync(cacheFsPath))
      fs.rmSync(cacheFsPath, { recursive: true })
  }

  private createProgressTransformer(startByte: number): (progress: AxiosProgressEvent) => ImageDownloadProgressEvent {
    let previousPercentage = 0
    const bytesPerKB = 1024
    const bytesPerMB = bytesPerKB * 1024

    return (progress) => {
      const rangeTotal = progress.total ?? 0
      const rangeLoaded = progress.loaded ?? 0
      const total = startByte + rangeTotal
      const loaded = startByte + rangeLoaded
      const percentage = total > 0 ? (loaded / total) * 100 : 0
      const increment = Math.max(0, percentage - previousPercentage)
      previousPercentage = percentage

      const rate = progress.rate ?? 0
      const unit: 'KB' | 'MB' = rate >= bytesPerMB ? 'MB' : 'KB'
      const network = unit === 'MB' ? rate / bytesPerMB : rate / bytesPerKB

      return {
        ...progress,
        total,
        loaded,
        network,
        unit,
        increment,
      }
    }
  }
}

export function createImageDownloader<T extends LocalImageImpl | RemoteImageImpl>(image: T, url: string): ImageDownloader<T> {
  return new ImageDownloaderImpl<T>(image, url)
}
