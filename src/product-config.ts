import type { PascalCaseDeviceType } from './types'

export interface ProductConfigItem {
  /**
   * The name of the product.
   */
  name: string
  /**
   * The screen width of the product.
   */
  screenWidth: string
  /**
   * The screen height of the product.
   */
  screenHeight: string
  /**
   * The screen diagonal of the product.
   */
  screenDiagonal: string
  /**
   * The screen density of the product.
   */
  screenDensity: string
  /**
   * The outer screen width of the product.
   */
  outerScreenWidth?: string
  /**
   * The outer screen height of the product.
   */
  outerDoubleScreenWidth?: string
  /**
   * The outer double screen height of the product.
   */
  outerDoubleScreenHeight?: string
  /**
   * The outer double screen diagonal of the product.
   */
  outerDoubleScreenDiagonal?: string
  /**
   * The outer screen height of the product.
   */
  outerScreenHeight?: string
  /**
   * The outer screen diagonal of the product.
   */
  outerScreenDiagonal?: string
  /**
   * Whether the product is visible.
   */
  visible: boolean
  /**
   * The one cutout path of the product.
   */
  oneCutoutPath?: string
  /**
   * The dev model of the product.
   */
  devModel?: string
}

export namespace ProductConfigItem {
  export function is(value: unknown): value is ProductConfigItem {
    return typeof value === 'object'
      && value !== null
      && 'name' in value
      && 'screenWidth' in value
      && 'screenHeight' in value
      && 'screenDiagonal' in value
      && 'screenDensity' in value
      && typeof value.name === 'string'
      && typeof value.screenWidth === 'string'
      && typeof value.screenHeight === 'string'
      && typeof value.screenDiagonal === 'string'
      && typeof value.screenDensity === 'string'
  }
}

export type ProductConfig = Record<PascalCaseDeviceType, ProductConfigItem[]>

export function isProductConfig(value: unknown): value is ProductConfig {
  return typeof value === 'object' && value !== null && Object.values(value).every(item => Array.isArray(item))
}
