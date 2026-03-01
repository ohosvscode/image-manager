import type { AxiosResponse } from 'axios'
import type { Hash } from 'node:crypto'
import type { Readable } from 'node:stream'
import type { Event } from './event-emitter'
import type { RemoteImage } from './images'
import { WriteableFlags } from 'vscode-fs'
import { EventEmitter } from './event-emitter'

export interface ImageDownloader {
  getRemoteImage(): RemoteImage
  getUrl(): string
  getCacheUri(): import('vscode-uri').URI
  startDownload(): Promise<void>
  checkChecksum(): Promise<boolean>
  extract(): Promise<void>
  onDownloadProgress: Event<ImageDownloader.DownloadProgress>
  onExtractProgress: Event<ImageDownloader.ExtractProgress>
  onChecksumProgress: Event<ImageDownloader.ChecksumProgress>
}

export namespace ImageDownloader {
  export type ProgressType = 'download' | 'extract'

  export interface BaseProgress {
    /** Relative progress increment since last report, 0~100. */
    increment: number
    /** Cureent progress, 0~100. */
    progress: number
  }

  export interface DownloadProgress extends BaseProgress {
    progressType: 'download'
    /** Current network speed. */
    network: number
    /** Current network speed unit, 'KB' or 'MB'. */
    unit: 'KB' | 'MB'
    /**
     * When true, indicates resume from a previous session. Consumer should set
     * accumulated progress to this event's `progress` instead of adding `increment`.
     */
    reset?: boolean
  }

  export interface ExtractProgress extends BaseProgress {
    progressType: 'extract'
  }

  export interface ChecksumProgress extends BaseProgress {
    progressType: 'checksum'
  }
}

export class ImageDownloaderImpl implements ImageDownloader {
  constructor(
    private readonly remoteImage: RemoteImage,
    private readonly url: string,
    private readonly abortController = new AbortController(),
  ) {}

  private readonly downloadProgressEmitter = new EventEmitter<ImageDownloader.DownloadProgress>()
  private readonly extractProgressEmitter = new EventEmitter<ImageDownloader.ExtractProgress>()
  private readonly checksumProgressEmitter = new EventEmitter<ImageDownloader.ChecksumProgress>()

  onDownloadProgress: Event<ImageDownloader.DownloadProgress> = this.downloadProgressEmitter.event
  onExtractProgress: Event<ImageDownloader.ExtractProgress> = this.extractProgressEmitter.event
  onChecksumProgress: Event<ImageDownloader.ChecksumProgress> = this.checksumProgressEmitter.event

  getRemoteImage(): RemoteImage {
    return this.remoteImage
  }

  getUrl(): string {
    return this.url
  }

  getCacheUri(): import('vscode-uri').URI {
    const { cachePath, adapter: { URI, join, basename } } = this.remoteImage.getImageManager().getOptions()
    return join(cachePath, basename(URI.parse(this.url)))
  }

  private async makeRequest(startByte: number = 0, retried416 = false): Promise<AxiosResponse<Readable>> {
    const { adapter: { fs, axios, isAxiosError } } = this.remoteImage.getImageManager().getOptions()
    const cacheUri = this.getCacheUri()

    try {
      return await axios.get<Readable>(this.url, {
        headers: startByte > 0 ? { Range: `bytes=${startByte}-` } : {},
        responseType: 'stream',
        validateStatus: status => (status === 200 || status === 206),
        signal: this.abortController.signal,
      })
    }
    catch (err) {
      if (isAxiosError(err) && err.response?.status === 416 && !retried416) {
        if (await fs.exists(cacheUri)) await fs.delete(cacheUri, { recursive: true })
        return this.makeRequest(startByte, true)
      }
      throw err
    }
  }

  /** 获取文件总大小。206 时从 Content-Range 取 total，200 时从 Content-Length 取。 */
  private parseTotalBytes(response: AxiosResponse<Readable>): number | null {
    const contentRange = response.headers['content-range']
    if (contentRange) {
      const match = contentRange.match(/bytes \d+-\d+\/(\d+)/)
      if (match) return Number.parseInt(match[1], 10)
    }
    const contentLength = response.headers['content-length']
    if (contentLength) return Number.parseInt(contentLength, 10)
    return null
  }

  private createDownloadProgressTransformer(startByte: number, totalBytes: number | null): TransformStream<Uint8Array, Uint8Array> {
    let receivedBytes = startByte
    let lastReportedBytes = startByte
    let lastReportedProgress = totalBytes != null && totalBytes > 0
      ? Math.round((startByte / totalBytes) * 10000) / 100
      : 0
    let lastReportTime = performance.now()
    const reportThreshold = 64 * 1024 // 每 64KB 上报一次，确保 progress 有可见变化

    const report = () => {
      const now = performance.now()
      const bytesSinceLastReport = receivedBytes - lastReportedBytes
      const timeDeltaSec = (now - lastReportTime) / 1000
      lastReportedBytes = receivedBytes
      lastReportTime = now

      const progress = totalBytes != null && totalBytes > 0
        ? Math.min(100, Math.round((receivedBytes / totalBytes) * 10000) / 100)
        : 0
      const increment = Math.round((progress - lastReportedProgress) * 100) / 100
      lastReportedProgress = progress

      // 实时速度：bytesSinceLastReport / timeDeltaSec，单位 KB/s 或 MB/s
      const speedKBps = timeDeltaSec > 0 && bytesSinceLastReport > 0
        ? (bytesSinceLastReport / 1024) / timeDeltaSec
        : 0
      const unit: 'KB' | 'MB' = speedKBps >= 1024 ? 'MB' : 'KB'
      const network = unit === 'MB' ? speedKBps / 1024 : speedKBps

      const roundedProgress = Math.round(progress * 100) / 100
      const clampedIncrement = Math.max(0, Math.min(100, increment))
      if (clampedIncrement > 0) {
        this.downloadProgressEmitter.fire({
          progressType: 'download',
          increment: clampedIncrement,
          progress: roundedProgress,
          network: Math.round(network * 100) / 100,
          unit,
        })
      }
    }

    return new TransformStream({
      transform: (chunk, controller) => {
        receivedBytes += chunk.length
        controller.enqueue(chunk)
        if (receivedBytes - lastReportedBytes >= reportThreshold) report()
      },
      flush: () => {
        if (receivedBytes !== lastReportedBytes) report()
      },
    })
  }

  async startDownload(retried416: boolean = false): Promise<void> {
    const { adapter: { fs, toWeb, dirname } } = this.remoteImage.getImageManager().getOptions()
    const cacheUri = this.getCacheUri()
    if (!await fs.exists(dirname(cacheUri))) await fs.createDirectory(dirname(cacheUri))
    const startByte = await fs.stat(cacheUri).then(
      stat => stat.size ?? 0,
      () => 0,
    )
    const response = await this.makeRequest(startByte, retried416)
    const totalBytes = this.parseTotalBytes(response)

    // Emit reset event on resume so consumer can sync accumulated progress
    if (startByte > 0 && totalBytes != null && totalBytes > 0) {
      const startProgress = Math.round((startByte / totalBytes) * 10000) / 100
      this.downloadProgressEmitter.fire({
        progressType: 'download',
        increment: 0,
        progress: Math.min(100, startProgress),
        network: 0,
        unit: 'KB',
        reset: true,
      })
    }

    const writableStream = await fs.createWritableStream(
      cacheUri,
      startByte > 0 ? { flags: WriteableFlags.Append } : undefined,
    )
    const webReadable = toWeb(response.data) as ReadableStream<Uint8Array>
    const progressTransform = this.createDownloadProgressTransformer(startByte, totalBytes)
    await webReadable.pipeThrough(progressTransform).pipeTo(writableStream)
  }

  private createChecksumProgressTransformer(totalBytes: number, hash: Hash): TransformStream<Uint8Array, Uint8Array> {
    let readBytes = 0
    let lastReportedBytes = 0
    let lastReportedProgress = 0
    const reportThreshold = 64 * 1024

    const report = () => {
      const progress = totalBytes > 0 ? Math.min(100, Math.round((readBytes / totalBytes) * 10000) / 100) : 0
      const increment = Math.round((progress - lastReportedProgress) * 100) / 100
      lastReportedBytes = readBytes
      lastReportedProgress = progress
      const clampedIncrement = Math.max(0, Math.min(100, increment))
      if (clampedIncrement > 0) {
        this.checksumProgressEmitter.fire({
          progressType: 'checksum',
          increment: clampedIncrement,
          progress: Math.round(progress * 100) / 100,
        })
      }
    }

    return new TransformStream({
      transform: (chunk, controller) => {
        const chunkLength = chunk ? (chunk.byteLength ?? chunk.length ?? 0) : 0
        if (chunk) hash.update(chunk)
        readBytes += chunkLength
        controller.enqueue(chunk)
        if (readBytes - lastReportedBytes >= reportThreshold) report()
      },
      flush: () => {
        if (readBytes !== lastReportedBytes) report()
      },
    })
  }

  async checkChecksum(): Promise<boolean> {
    const { adapter: { fs, crypto } } = this.remoteImage.getImageManager().getOptions()
    const cacheUri = this.getCacheUri()
    const totalBytes = await fs.stat(cacheUri).then(stat => stat.size ?? 0, () => 0)
    const readableStream = await fs.createReadableStream(cacheUri)
    const hash = crypto.createHash('sha256')
    const progressTransform = this.createChecksumProgressTransformer(totalBytes, hash)
    await readableStream.pipeThrough(progressTransform).pipeTo(new WritableStream(), { signal: this.abortController.signal })
    const checksum = hash.digest('hex')
    return checksum === this.getRemoteImage().getRemoteImageSDK().archive?.complete?.checksum
  }

  async extract(): Promise<void> {
    const { adapter: { fs, unzipper, fromWeb } } = this.remoteImage.getImageManager().getOptions()
    const cacheUri = this.getCacheUri()
    const totalBytes = await fs.stat(cacheUri).then(stat => stat.size ?? 0, () => 0)

    const extract = unzipper.Extract({ path: this.getRemoteImage().getFullPath().fsPath })
    const webReadable = await fs.createReadableStream(cacheUri)

    let readBytes = 0
    let lastReportedBytes = 0
    let lastReportedProgress = 0
    const reportThreshold = 64 * 1024

    // 使用 Web TransformStream：复制 chunk 避免 buffer 复用，纯 Uint8Array 无 Buffer/Transform 依赖
    const copyAndProgressTransform = new TransformStream<Uint8Array, Uint8Array>({
      transform: (chunk, controller) => {
        const chunkLength = chunk?.length ?? 0
        if (chunkLength <= 0) return
        readBytes += chunkLength
        if (readBytes - lastReportedBytes >= reportThreshold) {
          const progress = totalBytes > 0 ? Math.min(100, Math.round((readBytes / totalBytes) * 10000) / 100) : 0
          const increment = Math.round((progress - lastReportedProgress) * 100) / 100
          lastReportedBytes = readBytes
          lastReportedProgress = progress
          const clampedIncrement = Math.max(0, Math.min(100, increment))
          if (clampedIncrement > 0) {
            this.extractProgressEmitter.fire({
              progressType: 'extract',
              increment: clampedIncrement,
              progress: Math.round(progress * 100) / 100,
            })
          }
        }
        controller.enqueue(chunk.slice(0))
      },
      flush: () => {
        if (readBytes !== lastReportedBytes) {
          const increment = Math.round((100 - lastReportedProgress) * 100) / 100
          const clampedIncrement = Math.max(0, Math.min(100, increment))
          if (clampedIncrement > 0) {
            this.extractProgressEmitter.fire({
              progressType: 'extract',
              increment: clampedIncrement,
              progress: 100,
            })
          }
        }
      },
    })

    const readable = fromWeb(
      webReadable.pipeThrough(copyAndProgressTransform) as import('node:stream/web').ReadableStream,
    ) as Readable

    const abortHandler = () => readable.destroy(new DOMException('Aborted', 'AbortError'))
    this.abortController.signal.addEventListener('abort', abortHandler)

    readable.pipe(extract)
    await extract.promise().finally(() => this.abortController.signal.removeEventListener('abort', abortHandler))
  }
}
