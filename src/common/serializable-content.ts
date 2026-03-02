import type { ImageManager } from '../image-manager'
import type { BaseSerializable, Serializable } from '../types'

export interface SerializableContent<T extends SerializableContent.Content = SerializableContent.Content> extends Serializable<SerializableContent.Serializable> {
  getImageManager(): ImageManager
  getContent(): T
}

export namespace SerializableContent {
  export type Content = Record<PropertyKey, any> | Content[]
  export interface Serializable extends Omit<BaseSerializable<SerializableContent>, 'imageManager'> {}
}

export abstract class SerializableContentImpl<T extends SerializableContent.Content> implements SerializableContent<T> {
  constructor(
    protected readonly imageManager: ImageManager,
    protected readonly content: T,
  ) {}

  getImageManager(): ImageManager {
    return this.imageManager
  }

  getContent(): T {
    return this.content
  }

  toJSON(): SerializableContent.Serializable {
    return {
      content: this.getContent(),
    }
  }
}
