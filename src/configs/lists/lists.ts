import type { SerializableFile } from '../../common/serializable-file'
import type { BaseSerializable, Serializable } from '../../types'
import type { ListsFileItem } from './item'
import { SerializableFileImpl } from '../../common/serializable-file'
import { ListsFileItemImpl } from './item'

export interface ListsFile extends Serializable<ListsFile.Serializable>, Omit<SerializableFile, 'toJSON'> {
  getListsFileItems(): ListsFileItem[]
  addListsFileItem(listsFileItem: ListsFileItem.Content): ListsFileItem
  deleteListsFileItem(listsFileItem: ListsFileItem): this
}

export namespace ListsFile {
  export type Content = ListsFileItem.Content[]
  export interface Serializable extends BaseSerializable<ListsFile> {}

  export function is(value: unknown): value is ListsFile {
    return value instanceof ListsFileImpl
  }
}

export class ListsFileImpl extends SerializableFileImpl<ListsFile.Content> implements ListsFile {
  private _isChanged = false

  getListsFileItems(): ListsFileItem[] {
    return this.getContent().map(item => new ListsFileItemImpl(this, item))
  }

  private removeDuplicateListFileItems(listsFileItems: ListsFileItem.Content[]): void {
    this.content = listsFileItems.filter((item, index, self) => index === self.findIndex(t => t.uuid === item.uuid))
      .filter((item, index, self) => index === self.findIndex(t => t.name === item.name))
  }

  addListsFileItem(listsFileItem: ListsFileItem.Content): ListsFileItem {
    this.removeDuplicateListFileItems(this.content)
    this.content.push(listsFileItem)
    this._isChanged = true
    return new ListsFileItemImpl(this, listsFileItem)
  }

  get isChanged(): boolean {
    return this._isChanged
  }

  deleteListsFileItem(listsFileItem: ListsFileItem): this {
    const index = this.content.findIndex(item => item.uuid === listsFileItem.getContent().uuid)
    if (index === -1) return this
    this.content.splice(index, 1)
    this._isChanged = true
    return this
  }

  async serialize(): Promise<string> {
    return JSON.stringify(this.getContent(), null, 2)
  }

  async write(): Promise<void> {
    if (!this.isChanged) return
    await this.writeToFileSystem(this.getImageManager().getListsFilePath())
    this._isChanged = false
  }

  toJSON(): ListsFile.Serializable {
    return {
      imageManager: this.getImageManager().toJSON(),
      content: this.getContent(),
      listsFileItems: this.getListsFileItems().map(item => item.toJSON()),
    }
  }
}
