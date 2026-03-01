import type { ListsFileItem, ProductConfigFile } from '../configs'

export namespace DeviceTypeConverter {
  export function snakecaseToCamelcase(snakecaseDeviceType: ListsFileItem.DeviceType | (string & {})): ProductConfigFile.DeviceType {
    switch (snakecaseDeviceType) {
      case 'phone':
        return 'Phone'
      case '2in1':
        return '2in1'
      case '2in1_foldable':
        return '2in1 Foldable'
      case 'foldable':
        return 'Foldable'
      case 'tablet':
        return 'Tablet'
      case 'triplefold':
        return 'TripleFold'
      case 'tv':
        return 'TV'
      case 'wearable':
        return 'Wearable'
      case 'widefold':
        return 'WideFold'
      // Fallback to lowercase, and replace underscores with spaces
      default:
        return snakecaseDeviceType.toLowerCase().split('_').join(' ') as ProductConfigFile.DeviceType
    }
  }
}
