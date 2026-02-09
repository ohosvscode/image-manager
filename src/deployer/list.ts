export enum DevModel {
  MCHEMU_AL00CN = 'MCHEMU-AL00CN',
  PHEMU_FD00 = 'PHEMU-FD00',
  PHEMU_FD01 = 'PHEMU-FD01',
  PHEMU_FD02 = 'PHEMU-FD02',
  PHEMU_FD06 = 'PHEMU-FD06',
  PCEMU_FD00 = 'PCEMU-FD00',
  PCEMU_FD05 = 'PCEMU-FD05',
}

export type DeployedDevModel
  = 'MCHEMU-AL00CN'
    | 'PHEMU-FD00'
    | 'PHEMU-FD01'
    | 'PHEMU-FD02'
    | 'PHEMU-FD06'
    | 'PCEMU-FD00'
    | 'PCEMU-FD05'
    | DevModel
    | (string & {})

export type ProductNameable<T> = T & {
  /**
   * The name of the product.
   *
   * @example 'Mate 80 Pro Max、Mate 80 RS'
   */
  productName: string
}

export interface DeployedImageConfig {
  /**
   * Diagonal size.
   *
   * @example '1.6'
   */
  diagonalSize: string
  /**
   * Density.
   *
   * @example '320'
   */
  density: string
  /**
   * Resolution height.
   *
   * @example '466'
   */
  resolutionHeight: string
  /**
   * Resolution width.
   *
   * @example '466'
   */
  resolutionWidth: string
}

export interface DeployedImageConfigWithProductName extends DeployedImageConfig {
  /**
   * The name of the product.
   *
   * @example 'Mate 80 Pro Max、Mate 80 RS'
   */
  productName: string
}

export interface DeployedImageOptions extends DeployedImageConfig {
  /**
   * RAM size.
   *
   * @example '4096'
   */
  'memoryRamSize': string
  /**
   * CPU number.
   *
   * @example '4'
   */
  'cpuNumber': string
  /**
   * Data disk size.
   *
   * @example '6144'
   */
  'dataDiskSize': string
  /**
   * Deployed name.
   *
   * @example 'Huawei_Wearable'
   */
  'name': string
  /**
   * UUID.
   *
   * @example 'ce454934-3a1b-4770-9838-dc85c5d7b6c1'
   */
  'uuid': string
  /**
   * OpenHarmony/HarmonyOS version.
   *
   * @example '6.0.1'
   */
  'hw.apiName': string
  /**
   * Device model.
   *
   * @example 'MCHEMU-AL00CN'
   */
  'devModel'?: DeployedDevModel
  /**
   * Model.
   *
   * @example 'Mate 80 Pro Max、Mate 80 RS'
   */
  'model': string
}

export interface FullDeployedImageOptions extends DeployedImageOptions {
  /**
   * Image directory.
   *
   * @example 'system-image/HarmonyOS-6.0.1/wearable_arm/'
   */
  'imageDir': string
  /**
   * Image SDK version.
   *
   * @example '6.0.0.112'
   */
  'version': string
  /**
   * Device type.
   *
   * @example 'wearable', 'phone', 'tablet'
   */
  'type': 'wearable' | 'phone' | 'tablet' | '2in1' | 'tv' | (string & {})
  /**
   * Architecture.
   *
   * @example 'arm'
   */
  'abi': string
  /**
   * API version.
   *
   * @example '21'
   */
  'apiVersion': string
  /**
   * Deployed path.
   *
   * @example '/Users/xxx/.Huawei/Emulator/deployed/Huawei_Wearable'
   */
  'path': string
  /**
   * Show version.
   *
   * @example 'HarmonyOS 6.0.1(21)'
   */
  'showVersion': string
  /**
   * HarmonyOS version.
   *
   * @example 'HarmonyOS-6.0.1'
   */
  'harmonyOSVersion': string
  /**
   * Cover resolution width.
   *
   * @example '2472'
   */
  'coverResolutionWidth'?: string
  /**
   * Cover resolution height.
   *
   * @example '1648'
   */
  'coverResolutionHeight'?: string
  /**
   * Cover diagonal size.
   *
   * @example '13.0'
   */
  'coverDiagonalSize'?: string
  /**
   * HarmonyOS SDK path.
   *
   * @example '/Applications/DevEco-Studio.app/Contents/sdk'
   */
  'harmonyos.sdk.path': string
  /**
   * HarmonyOS config path.
   *
   * @example '/Users/xxx/Library/Application Support/Huawei/DevEcoStudio6.0'
   */
  'harmonyos.config.path': string
  /**
   * HarmonyOS log path.
   *
   * @example '/Users/xxx/Library/Logs/Huawei/DevEcoStudio6.0'
   */
  'harmonyos.log.path': string
}
