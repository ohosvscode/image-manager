import type { SerializableFile } from '../../common/serializable-file'
import type { Device } from '../../devices'
import type { BaseSerializable, Serializable } from '../../types'
import type { ProductConfigFile } from '../product'
import INI from 'ini'
import { SerializableFileImpl } from '../../common/serializable-file'

export interface ConfigIniFile<
  ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
  ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
> extends Serializable<ConfigIniFile.Serializable>, Omit<SerializableFile, 'toJSON'> {
  getDevice(): Device<ProductDeviceType, ProductName>
  getFileUri(): import('vscode-uri').URI
}

export namespace ConfigIniFile {
  export type Content = Record<string, string | undefined>
  export type GenericContent<
    ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
  > = Content & { productModel: ProductName }

  export interface Serializable<
    ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
  > extends Omit<BaseSerializable<ConfigIniFile<ProductDeviceType, ProductName>>, 'device'> {}

  export function is(value: unknown): value is ConfigIniFile {
    return value instanceof ConfigIniFileImpl
  }
}

export class ConfigIniFileImpl<
  ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
  ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
> extends SerializableFileImpl<ConfigIniFile.GenericContent<ProductDeviceType, ProductName>> implements ConfigIniFile<ProductDeviceType, ProductName> {
  constructor(
    private readonly device: Device<ProductDeviceType, ProductName>,
    private readonly configIniFilePath: import('vscode-uri').URI,
    protected readonly content: ConfigIniFile.GenericContent<ProductDeviceType, ProductName>,
  ) {
    super(device.getImageManager(), content)
  }

  getDevice(): Device<ProductDeviceType, ProductName> {
    return this.device
  }

  static getFileUri<ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType, ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name']>(device: Device<ProductDeviceType, ProductName>,
  ): import('vscode-uri').URI {
    const { deployedPath, adapter: { join } } = device.getImageManager().getOptions()
    return join(deployedPath, device.getListsFileItem().getContent().name, 'config.ini')
  }

  static async safeReadAndParse<ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType, ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name']>(device: Device<ProductDeviceType, ProductName>): Promise<ConfigIniFile.GenericContent<ProductDeviceType, ProductName> | undefined> {
    const { adapter: { fs } } = device.getImageManager().getOptions()

    try {
      const configIniFileContent = await fs.readFile(this.getFileUri(device)).then(
        buffer => buffer.toString(),
        () => void 0,
      )
      if (!configIniFileContent?.length) return
      return INI.parse(configIniFileContent) as ConfigIniFile.GenericContent<ProductDeviceType, ProductName>
    }
    catch {}
  }

  getFileUri(): import('vscode-uri').URI {
    return this.configIniFilePath
  }

  async serialize(): Promise<string> {
    return INI.stringify(
      Object.fromEntries(
        Object.entries(this.getContent()).filter(([key, value]) => {
          return value !== undefined && key.length > 0
        }),
      ),
    )
  }

  async write(): Promise<void> {
    return this.writeToFileSystem(this.getFileUri())
  }

  toJSON(): ConfigIniFile.Serializable {
    return {
      ...super.toJSON(),
      fileUri: this.getFileUri().toJSON(),
    }
  }
}
