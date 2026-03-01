import type { SerializableFile } from '../../common/serializable-file'
import type { Device } from '../../devices'
import type { BaseSerializable, Serializable } from '../../types'
import type { ProductConfigFile } from '../product'
import INI from 'ini'
import { SerializableFileImpl } from '../../common/serializable-file'

export interface NamedIniFile<
  ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
  ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
> extends Serializable<NamedIniFile.Serializable>, Omit<SerializableFile, 'toJSON'> {
  getDevice(): Device<ProductDeviceType, ProductName>
  getFileUri(): import('vscode-uri').URI
}

export namespace NamedIniFile {
  export type Content = Record<string, string>
  export interface Serializable<
    ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
  > extends Omit<BaseSerializable<NamedIniFile<ProductDeviceType, ProductName>>, 'device'> {}

  export function is(value: unknown): value is NamedIniFile {
    return value instanceof NamedIniFileImpl
  }
}

export class NamedIniFileImpl<
  ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
  ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
> extends SerializableFileImpl<NamedIniFile.Content> implements NamedIniFile<ProductDeviceType, ProductName> {
  constructor(
    private readonly device: Device<ProductDeviceType, ProductName>,
    private readonly namedIniFilePath: import('vscode-uri').URI,
    protected readonly content: NamedIniFile.Content,
  ) {
    super(device.getImageManager(), content)
  }

  getDevice(): Device<ProductDeviceType, ProductName> {
    return this.device
  }

  static getFileUri<
    ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
  >(
    device: Device<ProductDeviceType, ProductName>,
  ): import('vscode-uri').URI {
    const { deployedPath, adapter: { join } } = device.getImageManager().getOptions()
    return join(deployedPath, `${device.getListsFileItem().getContent().name}.ini`)
  }

  getFileUri(): import('vscode-uri').URI {
    return this.namedIniFilePath
  }

  static async safeReadAndParse(device: Device): Promise<NamedIniFile.Content | undefined> {
    try {
      const { adapter: { fs } } = device.getImageManager().getOptions()
      const namedIniFileUri = this.getFileUri(device)
      const namedIniFileContent = await fs.readFile(namedIniFileUri).then(
        buffer => buffer.toString(),
        () => void 0,
      )
      if (!namedIniFileContent?.length) return
      return INI.parse(namedIniFileContent)
    }
    catch {}
  }

  async serialize(): Promise<string> {
    return INI.stringify(this.getContent())
  }

  async write(): Promise<void> {
    const { deployedPath, adapter: { join } } = this.getImageManager().getOptions()
    return this.writeToFileSystem(join(deployedPath, `${this.getDevice().getListsFileItem().getContent().name}.ini`))
  }

  toJSON(): NamedIniFile.Serializable {
    return {
      imageManager: this.getImageManager().toJSON(),
      content: this.getContent(),
      fileUri: this.getFileUri().toJSON(),
    }
  }
}
