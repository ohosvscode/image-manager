import type { EmulatorFile, ProductConfigFile } from '../configs'
import type { Device } from '../devices/device'
import type { ImageManager } from '../image-manager'
import type { ScreenPreset } from '../screens/screen-preset'
import type { BaseSerializable, DeepPartial, Serializable } from '../types'
import type { BaseImage } from './base-image'
import type { Image } from './image'
import { ConfigIniFileImpl } from '../configs/config-ini/config-ini'
import { EmulatorFoldItem } from '../configs/emulator/emulator-fold-item'
import { EmulatorTripleFoldItem } from '../configs/emulator/emulator-triplefold-item'
import { NamedIniFileImpl } from '../configs/named-ini/named-ini'
import { DeviceImpl } from '../devices/device'
import { ScreenPresetImpl } from '../screens/screen-preset'
import { BaseImageImpl } from './base-image'

export interface LocalImage extends Serializable<LocalImage.Serializable>, Omit<BaseImage, 'toJSON'> {
  readonly imageType: 'local'
  /**
   * Get the SDK package file.
   *
   * @returns The SDK package file.
   */
  getSdkPkgFile(): LocalImage.OptionalSdkPkgFile

  /**
   * Create a device from the local image.
   *
   * @param options - The options to create the device.
   */
  createDevice<
    ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
  >(options: LocalImage.CreateDeviceOptions<ProductDeviceType, ProductName>): Promise<Device<ProductDeviceType, ProductName>>
}

export namespace LocalImage {
  export interface Serializable extends BaseImage.Serializable, BaseSerializable<LocalImage> {}

  export interface SdkPkgFile {
    /**
     * The SDK package file data.
     */
    readonly data: SdkPkgFile.Data
  }

  export namespace SdkPkgFile {
    export interface Data {
      /** @example '13' */
      readonly apiVersion: string
      /** @example 'System-image-foldable' */
      readonly displayName: string
      /** @example 'system-image,HarmonyOS-5.0.1,foldable_arm' */
      readonly path: string
      /** @example '5.0.1' */
      readonly platformVersion: string
      /** @example 'Release' */
      readonly releaseType: string
      /** @example '5.0.0.112' */
      readonly version: string
      /** @example 'HarmonyOS 5.0.0.112(SP2)' */
      readonly guestVersion: string
      /** @example 'Release' */
      readonly stage: string
    }
  }

  export type OptionalSdkPkgFile = DeepPartial<SdkPkgFile>

  export interface InfoFile {
    /** @example '21' */
    apiVersion: string
    /** @example 'arm' */
    abi: string
    /** @example '6.0.0.112' */
    version: string
  }

  export interface CreateDeviceOptions<
    ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
  > {
    /**
     * The name of the device.
     *
     * @example 'Huawei_Wearable'
     */
    readonly name: string
    /**
     * The CPU number.
     *
     * @example 4
     */
    readonly cpuNumber: number
    /**
     * The memory RAM size. (in MB)
     *
     * @example 4096
     */
    readonly memoryRamSize: number
    /**
     * The data disk size. (in MB)
     *
     * @example 6144
     */
    readonly dataDiskSize: number
    /**
     * The screen.
     */
    readonly screen: ScreenPreset.Options<ProductDeviceType, ProductName>
    /**
     * The vendor country.
     *
     * @example 'CN'
     */
    readonly vendorCountry?: string
    /**
     * @default true
     */
    readonly isPublic?: boolean
  }

  export function is(value: unknown): value is LocalImage {
    return value instanceof LocalImageImpl
  }
}

export class LocalImageImpl extends BaseImageImpl implements LocalImage {
  readonly imageType = 'local'

  constructor(
    protected readonly imageManager: ImageManager,
    private readonly sdkPkgFile: LocalImage.OptionalSdkPkgFile,
    private readonly infoFile: LocalImage.InfoFile,
  ) {
    super({
      imageManager,
      apiVersion: Number.parseInt(sdkPkgFile?.data?.apiVersion ?? '0'),
      relativePath: sdkPkgFile?.data?.path?.split(',').join('/') as Image.RelativePath,
    })
  }

  getSdkPkgFile(): LocalImage.OptionalSdkPkgFile {
    return this.sdkPkgFile
  }

  getFullDeviceType(): EmulatorFile.FullDeviceTypeWithString {
    const name = this.getSdkPkgFile().data?.displayName?.split('-')
    return name?.[name.length - 1] as EmulatorFile.FullDeviceTypeWithString
  }

  async createDevice<
    ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
  >(options: LocalImage.CreateDeviceOptions<ProductDeviceType, ProductName>,
  ): Promise<Device<ProductDeviceType, ProductName>> {
    const { deployedPath, imageBasePath, configPath, logPath, adapter: { join } } = this.getImageManager().getOptions()

    const screen = new ScreenPresetImpl(options.screen)
    const emulatorDeviceItem = screen.getEmulatorDeviceItem()
    const productConfigItem = screen.getProductConfigItem()
    const listsFile = await this.getImageManager().readListsFile()
    const uuid = crypto.randomUUID()
    const deviceFolderPath = join(deployedPath, options.name)

    const listFileItem = listsFile.addListsFileItem({
      uuid,
      'name': options.name,
      'apiVersion': this.getApiVersion().toString(),
      'cpuNumber': options.cpuNumber.toString(),
      'path': deviceFolderPath.fsPath,
      'memoryRamSize': options.memoryRamSize.toString(),
      'dataDiskSize': options.dataDiskSize.toString(),
      'version': this.getSdkPkgFile().data?.version ?? '',
      'imageDir': this.getRelativePath(),
      'showVersion': this.getSdkPkgFile().data?.guestVersion ?? '',
      'harmonyos.sdk.path': imageBasePath.fsPath,
      'harmonyos.config.path': configPath.fsPath,
      'harmonyos.log.path': logPath.fsPath,
      'hw.apiName': this.getSdkPkgFile().data?.platformVersion ?? '',
      'abi': this.infoFile.abi,
      'harmonyOSVersion': `${this.getSdkPkgFile().data?.guestVersion?.split(' ')[0]}-${this.getSdkPkgFile().data?.platformVersion}`,
      'guestVersion': this.getSdkPkgFile().data?.guestVersion ?? '',
      'diagonalSize': emulatorDeviceItem.getContent().diagonalSize.toString(),
      'density': emulatorDeviceItem.getContent().density.toString(),
      'resolutionWidth': emulatorDeviceItem.getContent().resolutionWidth.toString(),
      'resolutionHeight': emulatorDeviceItem.getContent().resolutionHeight.toString(),
      'coverResolutionWidth': EmulatorFoldItem.is(emulatorDeviceItem)
        ? emulatorDeviceItem.getContent().coverResolutionWidth.toString()
        : undefined,
      'coverResolutionHeight': EmulatorFoldItem.is(emulatorDeviceItem)
        ? emulatorDeviceItem.getContent().coverResolutionHeight.toString()
        : undefined,
      'coverDiagonalSize': EmulatorFoldItem.is(emulatorDeviceItem)
        ? emulatorDeviceItem.getContent().coverDiagonalSize.toString()
        : undefined,
      'type': emulatorDeviceItem.getContent().deviceType,
      'devModel': productConfigItem.getDevModel(),
      'model': productConfigItem.getContent().name,
    })

    const device = new DeviceImpl<ProductDeviceType, ProductName>({
      imageManager: this.getImageManager(),
      listsFile,
      listFileItem,
      screen,
    })

    const deviceIniUri = ConfigIniFileImpl.getFileUri<ProductDeviceType, ProductName>(device)
    const deviceIniFile = new ConfigIniFileImpl<ProductDeviceType, ProductName>(device, deviceIniUri, {
      'name': listFileItem.getContent().name,
      'deviceType': listFileItem.getContent().type,
      'deviceModel': listFileItem.getContent().devModel,
      'productModel': listFileItem.getContent().model as ProductName,
      'vendorCountry': options.vendorCountry ?? 'CN',
      'uuid': listFileItem.getContent().uuid,
      'configPath': listFileItem.getContent()['harmonyos.config.path'],
      'logPath': listFileItem.getContent()['harmonyos.log.path'],
      'sdkPath': listFileItem.getContent()['harmonyos.sdk.path'],
      'imageSubPath': listFileItem.getContent().imageDir,
      'instancePath': listFileItem.getContent().path,
      'os.osVersion': `${this.getSdkPkgFile().data?.guestVersion?.split(' ')[0]} ${this.getSdkPkgFile().data?.platformVersion}(${this.getApiVersion()})`,
      'os.apiVersion': this.getApiVersion().toString(),
      'os.softwareVersion': this.getSdkPkgFile().data?.version ?? '',
      'os.isPublic': (options.isPublic ?? true) ? 'true' : 'false',
      'hw.cpu.arch': listFileItem.getContent().abi,
      'hw.cpu.ncore': listFileItem.getContent().cpuNumber,
      'hw.lcd.density': emulatorDeviceItem.getContent().density.toFixed(),
      'hw.lcd.single.diagonalSize': EmulatorTripleFoldItem.is(emulatorDeviceItem)
        ? emulatorDeviceItem.getContent().singleDiagonalSize.toString()
        : undefined,
      'hw.lcd.single.height': EmulatorTripleFoldItem.is(emulatorDeviceItem)
        ? emulatorDeviceItem.getContent().singleResolutionHeight.toString()
        : undefined,
      'hw.lcd.single.width': EmulatorTripleFoldItem.is(emulatorDeviceItem)
        ? emulatorDeviceItem.getContent().singleResolutionWidth.toString()
        : undefined,
      'hw.lcd.double.diagonalSize': EmulatorTripleFoldItem.is(emulatorDeviceItem)
        ? emulatorDeviceItem.getContent().doubleDiagonalSize.toString()
        : undefined,
      'hw.lcd.double.height': EmulatorTripleFoldItem.is(emulatorDeviceItem)
        ? emulatorDeviceItem.getContent().doubleResolutionHeight.toString()
        : undefined,
      'hw.lcd.double.width': EmulatorTripleFoldItem.is(emulatorDeviceItem)
        ? emulatorDeviceItem.getContent().doubleResolutionWidth.toString()
        : undefined,
      'hw.lcd.phy.height': emulatorDeviceItem.getContent().physicalHeight.toString(),
      'hw.lcd.phy.width': emulatorDeviceItem.getContent().physicalWidth.toString(),
      'hw.lcd.number': (EmulatorTripleFoldItem.is(emulatorDeviceItem) || EmulatorFoldItem.is(emulatorDeviceItem)) ? '2' : '1',
      'hw.ramSize': listFileItem.getContent().memoryRamSize,
      'hw.dataPartitionSize': listFileItem.getContent().dataDiskSize,
      'isCustomize': 'true',
      'hw.hdc.port': 'notset',
    })
    device.setConfigIniFile(deviceIniFile)

    const namedIniUri = NamedIniFileImpl.getFileUri<ProductDeviceType, ProductName>(device)
    const namedIniFile = new NamedIniFileImpl<ProductDeviceType, ProductName>(device, namedIniUri, {
      'hvd.ini.encoding': 'UTF-8',
      'path': listFileItem.getContent().path,
    })
    device.setNamedIniFile(namedIniFile)

    // Write named.ini file -> write device.ini file -> update lists.json file
    // !IMPORTANT: lists.json file must to be updated after the named.ini file & device.ini file are written
    await namedIniFile.write()
    await deviceIniFile.write()
    await listsFile.write()

    return device
  }

  toJSON(): LocalImage.Serializable {
    return {
      ...super.toJSON(),
      sdkPkgFile: this.getSdkPkgFile(),
    }
  }
}
