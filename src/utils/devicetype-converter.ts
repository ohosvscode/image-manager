import type { ListsFileItem, ProductConfigFile } from '../configs'

export namespace DeviceTypeConverter {
  export function snakecaseToCamelcase(snakecaseDeviceType: ListsFileItem.DeviceTypeWithString): ProductConfigFile.DeviceType {
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

  export function camelcaseToSnakecase(camelcaseDeviceType: ProductConfigFile.DeviceTypeWithString): ListsFileItem.DeviceType {
    switch (camelcaseDeviceType) {
      case 'Phone':
        return 'phone'
      case '2in1':
        return '2in1'
      case '2in1 Foldable':
        return '2in1_foldable'
      case 'Foldable':
        return 'foldable'
      case 'TV':
        return 'tv'
      case 'Tablet':
        return 'tablet'
      case 'TripleFold':
        return 'triplefold'
      case 'Wearable':
        return 'wearable'
      case 'WideFold':
        return 'widefold'
      // Fallback to lowercase, and replace spaces with underscores
      default:
        return camelcaseDeviceType.toLowerCase().split(' ').join('_') as ListsFileItem.DeviceType
    }
  }
}
