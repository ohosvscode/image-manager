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
  startDownload(signal?: AbortSignal): Promise<void>
  checkChecksum(signal?: AbortSignal): Promise<boolean>
  extract(signal?: AbortSignal): Promise<void>
  clean(): Promise<void>
  getImage(): T
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
    const transformProgress = this.createProgressTransformer()
    const response = await axios.get<Stream.Readable>(this.url, {
      responseType: 'stream',
      onDownloadProgress: progress => this.emit('download-progress', transformProgress(progress)),
      signal,
    })
    if (!fs.existsSync(cachePath))
      fs.mkdirSync(cachePath, { recursive: true })
    response.data.pipe(fs.createWriteStream(this.getCacheFsPath()))
    await new Promise<void>((resolve, reject) => response.data.on('end', resolve).on('error', reject))
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

  async extract(signal?: AbortSignal): Promise<void> {
    const { fs } = this.image.getImageManager().getOptions()
    const cacheFsPath = this.getCacheFsPath()
    const stream = fs.createReadStream(cacheFsPath, { signal })
    const progressStream = progress({ length: fs.statSync(cacheFsPath).size })
    const extractStream = unzipper.Extract({ path: this.image.getFsPath() })
    progressStream.on('progress', progress => this.emitter.emit('extract-progress', progress))
    stream.pipe(progressStream).pipe(extractStream)
    await extractStream.promise()
  }

  async clean(): Promise<void> {
    const { fs } = this.image.getImageManager().getOptions()
    const cacheFsPath = this.getCacheFsPath()
    if (fs.existsSync(cacheFsPath))
      fs.rmSync(cacheFsPath, { recursive: true })
  }

  private createProgressTransformer(): (progress: AxiosProgressEvent) => ImageDownloadProgressEvent {
    let previousPercentage = 0
    const bytesPerKB = 1024
    const bytesPerMB = bytesPerKB * 1024

    return (progress) => {
      const total = progress.total ?? 0
      const loaded = progress.loaded ?? 0
      const percentage = total > 0 ? (loaded / total) * 100 : 0
      const increment = Math.max(0, percentage - previousPercentage)
      previousPercentage = percentage

      const rate = progress.rate ?? 0
      const unit: 'KB' | 'MB' = rate >= bytesPerMB ? 'MB' : 'KB'
      const network = unit === 'MB' ? rate / bytesPerMB : rate / bytesPerKB

      return {
        ...progress,
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
