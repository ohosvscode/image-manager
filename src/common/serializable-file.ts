import type { ImageManager } from '../image-manager'
import type { BaseSerializable, Serializable } from '../types'
import type { SerializableContent } from './serializable-content'
import { SerializableContentImpl } from './serializable-content'

export interface SerializableFile extends Serializable<SerializableFile.Serializable>, SerializableContent<SerializableFile.Content> {
  getImageManager(): ImageManager
  /** Serialize the serializable file to a string. */
  serialize(): Promise<string>
  /** Write the serialized content to the file system. */
  write(): Promise<void>
}

export namespace SerializableFile {
  export type Content = SerializableContent.Content
  export interface Serializable extends Omit<BaseSerializable<SerializableFile>, 'imageManager'> {}
}

export abstract class SerializableFileImpl<Content extends SerializableFile.Content> extends SerializableContentImpl<Content> implements SerializableFile {
  constructor(
    protected readonly imageManager: ImageManager,
    protected content: Content,
  ) {
    super(imageManager, content)
  }

  getImageManager(): ImageManager {
    return this.imageManager
  }

  abstract serialize(): Promise<string>
  abstract write(): Promise<void>

  async writeToFileSystem(uri: import('vscode-uri').URI): Promise<void> {
    const { adapter: { fs, dirname } } = this.imageManager.getOptions()
    const directoryUri = dirname(uri)
    if (!await fs.exists(directoryUri)) await fs.createDirectory(directoryUri)
    const serializedContent = await this.serialize()
    const encodedContent = new TextEncoder().encode(serializedContent)
    await fs.writeFile(uri, encodedContent)
  }

  toJSON(): SerializableFile.Serializable {
    return {
      content: this.getContent(),
    }
  }
}
