export interface Stringifiable<T> {
  toJSON(): T
}
export type OS = 'windows' | 'mac' | 'linux'
export type Arch = 'x86' | 'arm64'
export type DeviceType
  = | 'pc' // I think `pc` is the `2in1 Foldable`
    | 'phone'
    | 'tablet'
    | 'wearable'
    | 'tv'
    | 'foldable'
    | 'widefold'
    | '2in1'
export type SnakecaseDeviceType
  = | 'phone'
    | 'tablet'
    | '2in1'
    | 'foldable'
    | 'widefold'
    | 'triplefold'
    | '2in1_foldable'
    | 'tv'
    | 'wearable'
export type ParentEmulatorSnakecaseDeviceType
  = | SnakecaseDeviceType
    | 'pc_all'
    | 'phone_all'
export type PhoneAllSnakecaseDeviceType
  = | 'phone'
    | 'triplefold'
    | 'widefold'
    | 'foldable'
export function isPhoneAllSnakecaseDeviceType(value: unknown): value is PhoneAllSnakecaseDeviceType {
  return value === 'phone' || value === 'triplefold' || value === 'widefold' || value === 'foldable'
}
export type PCAllSnakecaseDeviceType
  = | '2in1_foldable'
    | '2in1'
export function isPCAllSnakecaseDeviceType(value: unknown): value is PCAllSnakecaseDeviceType {
  return value === '2in1_foldable' || value === '2in1'
}
export type PascalCaseDeviceType
  = | 'Phone'
    | 'Tablet'
    | '2in1'
    | 'Foldable'
    | 'WideFold'
    | 'TripleFold'
    | '2in1 Foldable'
    | 'TV'
    | 'Wearable'
