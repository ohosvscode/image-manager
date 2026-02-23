import type { PCAllSnakecaseDeviceType, PhoneAllSnakecaseDeviceType, SnakecaseDeviceType } from './types'

export interface BaseEmulatorConfigItem {
  name: string
  api: number
}

export namespace BaseEmulatorConfigItem {
  export function is(value: unknown): value is BaseEmulatorConfigItem {
    return typeof value === 'object'
      && value !== null
      && 'name' in value
      && typeof value.name === 'string'
      && 'deviceType' in value
      && typeof value.deviceType === 'string'
      && 'api' in value
      && typeof value.api === 'number'
  }
}

export interface ParentEmulatorConfigItem extends BaseEmulatorConfigItem {
  deviceType: SnakecaseDeviceType
  resolutionWidth: number
  resolutionHeight: number
  physicalWidth: number
  physicalHeight: number
  diagonalSize: number
  density: number
  memoryRamSize: number
  datadiskSize: number
  procNumber: number
  coverResolutionWidth?: number
  coverResolutionHeight?: number
  coverDiagonalSize?: number
}

export namespace ParentEmulatorConfigItem {
  export function is(value: unknown): value is ParentEmulatorConfigItem {
    return BaseEmulatorConfigItem.is(value)
      && 'resolutionWidth' in value
      && typeof value.resolutionWidth === 'number'
      && 'resolutionHeight' in value
      && typeof value.resolutionHeight === 'number'
      && 'physicalWidth' in value
      && typeof value.physicalWidth === 'number'
      && 'physicalHeight' in value
      && typeof value.physicalHeight === 'number'
      && 'diagonalSize' in value
      && typeof value.diagonalSize === 'number'
      && 'density' in value
      && typeof value.density === 'number'
      && 'memoryRamSize' in value
      && typeof value.memoryRamSize === 'number'
      && 'datadiskSize' in value
      && typeof value.datadiskSize === 'number'
      && 'procNumber' in value
      && typeof value.procNumber === 'number'
      && 'api' in value
      && typeof value.api === 'number'
  }
}

export interface PhoneAllEmulatorConfigItem extends ParentEmulatorConfigItem {
  deviceType: PhoneAllSnakecaseDeviceType
  singleResolutionHeight?: number
  singleResolutionWidth?: number
  singleDiagonalSize?: number
  doubleResolutionWidth?: number
  doubleResolutionHeight?: number
  doubleDiagonalSize?: number
}

export namespace PhoneAllEmulatorConfigItem {
  export function is(value: unknown): value is PhoneAllEmulatorConfigItem {
    return ParentEmulatorConfigItem.is(value)
  }
}

export interface GroupPhoneAllEmulatorConfigItem extends BaseEmulatorConfigItem {
  deviceType: 'phone_all'
  children: PhoneAllEmulatorConfigItem[]
}

export namespace GroupPhoneAllEmulatorConfigItem {
  export function is(value: unknown): value is GroupPhoneAllEmulatorConfigItem {
    return BaseEmulatorConfigItem.is(value)
      && 'children' in value
      && Array.isArray(value.children)
      && value.children.every(PhoneAllEmulatorConfigItem.is)
  }
}

export interface PCAllEmulatorConfigItem extends ParentEmulatorConfigItem {
  deviceType: PCAllSnakecaseDeviceType
}

export namespace PCAllEmulatorConfigItem {
  export function is(value: unknown): value is PCAllEmulatorConfigItem {
    return ParentEmulatorConfigItem.is(value)
  }
}

export interface GroupPCAllEmulatorConfigItem extends BaseEmulatorConfigItem {
  deviceType: 'pc_all'
  children: PCAllEmulatorConfigItem[]
}

export namespace GroupPCAllEmulatorConfigItem {
  export function is(value: unknown): value is GroupPCAllEmulatorConfigItem {
    return BaseEmulatorConfigItem.is(value)
      && 'children' in value
      && Array.isArray(value.children)
      && value.children.every(PCAllEmulatorConfigItem.is)
  }
}
export type EmulatorConfig = (ParentEmulatorConfigItem | GroupPhoneAllEmulatorConfigItem | GroupPCAllEmulatorConfigItem)[]
export type EmulatorConfigItem = ParentEmulatorConfigItem | PhoneAllEmulatorConfigItem | PCAllEmulatorConfigItem
