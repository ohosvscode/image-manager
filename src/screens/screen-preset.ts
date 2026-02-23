import type { EmulatorConfig } from '../emulator-config'
import type { LocalImage } from '../images'
import type { ProductConfig, ProductConfigItem } from '../product-config'
import type { PascalCaseDeviceType, SnakecaseDeviceType, Stringifiable } from '../types'
import type { EmulatorPreset } from './emulator-preset'
import type { ProductPreset } from './product-preset'
import { GroupPCAllEmulatorConfigItem, GroupPhoneAllEmulatorConfigItem, ParentEmulatorConfigItem, PCAllEmulatorConfigItem, PhoneAllEmulatorConfigItem } from '../emulator-config'
import { isProductConfig } from '../product-config'
import { isPCAllSnakecaseDeviceType, isPhoneAllSnakecaseDeviceType } from '../types'
import { createEmulatorPreset } from './emulator-preset'
import { createOuterDoubleScreen } from './outer-double-screen'
import { createOuterScreen } from './outer-screen'
import { createProductPreset } from './product-preset'
import { createScreen, Screen } from './screen'

export interface ScreenPreset extends Stringifiable<ScreenPreset.Stringifiable> {
  getScreen(): Screen
  getEmulatorPreset(): EmulatorPreset | undefined
  getProductPreset(): ProductPreset | undefined
}

export namespace ScreenPreset {
  export interface ScreenOptions {
    screen: Screen
    productConfig?: Partial<ProductConfig>
    emulatorConfig?: EmulatorConfig
  }

  export interface ProductOptions {
    image: LocalImage
    productConfig: ProductConfigItem
    pascalCaseDeviceType: PascalCaseDeviceType
  }

  export type Options = ScreenOptions | ProductOptions

  export interface Stringifiable {
    emulatorPreset?: EmulatorPreset.Stringifiable
    productPreset?: ProductPreset.Stringifiable
  }

  export function is(value: unknown): value is ScreenPreset {
    return value instanceof ScreenPresetImpl
  }
}

export class ScreenPresetImpl implements ScreenPreset {
  private emulatorPreset?: EmulatorPreset
  private productPreset?: ProductPreset

  constructor(private readonly options: ScreenPreset.Options) {
    this._screen = this.getScreen()
    this.setEmulatorPreset()
    this.setProductPreset()
  }

  private isScreenOptions(options: ScreenPreset.Options): options is ScreenPreset.ScreenOptions {
    return 'screen' in options
      && Screen.is(options.screen)
  }

  private _screen?: Screen

  getScreen(): Screen {
    if (this.isScreenOptions(this.options))
      return this.options.screen
    if (this._screen)
      return this._screen

    this._screen = createScreen({
      width: Number(this.options.productConfig.screenWidth),
      height: Number(this.options.productConfig.screenHeight),
      diagonal: Number(this.options.productConfig.screenDiagonal),
      density: Number(this.options.productConfig.screenDensity),
      apiVersion: Number.parseInt(this.options.image.getApiVersion()),
      deviceType: this.options.image.getSnakecaseDeviceType() as SnakecaseDeviceType,
    })
    if (this.options.productConfig.outerScreenWidth && this.options.productConfig.outerScreenHeight && this.options.productConfig.outerScreenDiagonal) {
      this._screen.setOuterScreen(
        createOuterScreen({
          width: Number(this.options.productConfig.outerScreenWidth),
          height: Number(this.options.productConfig.outerScreenHeight),
          diagonal: Number(this.options.productConfig.outerScreenDiagonal),
        }, this._screen),
      )
    }
    if (this.options.productConfig.outerDoubleScreenWidth && this.options.productConfig.outerDoubleScreenHeight && this.options.productConfig.outerDoubleScreenDiagonal) {
      this._screen.getOuterScreen()?.setOuterDoubleScreen(
        createOuterDoubleScreen({
          width: Number(this.options.productConfig.outerDoubleScreenWidth),
          height: Number(this.options.productConfig.outerDoubleScreenHeight),
          diagonal: Number(this.options.productConfig.outerDoubleScreenDiagonal),
        }, this._screen.getOuterScreen()!),
      )
    }
    return this._screen
  }

  private getProductConfigItems(): [ProductConfigItem[], PascalCaseDeviceType] | undefined {
    if (!this.options.productConfig || !isProductConfig(this.options.productConfig))
      return

    for (const [pascalCaseDeviceType, productConfigItem] of Object.entries(this.options.productConfig) as [PascalCaseDeviceType, ProductConfigItem[]][]) {
      if (pascalCaseDeviceType === '2in1' && this.getScreen().getSnakecaseDeviceType() === '2in1') {
        return [productConfigItem, pascalCaseDeviceType]
      }
      else if (pascalCaseDeviceType === '2in1 Foldable' && this.getScreen().getSnakecaseDeviceType() === '2in1_foldable') {
        return [productConfigItem, pascalCaseDeviceType]
      }
      else if (pascalCaseDeviceType === 'Foldable' && this.getScreen().getSnakecaseDeviceType() === 'foldable') {
        return [productConfigItem, pascalCaseDeviceType]
      }
      else if (pascalCaseDeviceType === 'Phone' && this.getScreen().getSnakecaseDeviceType() === 'phone') {
        return [productConfigItem, pascalCaseDeviceType]
      }
      else if (pascalCaseDeviceType === 'TV' && this.getScreen().getSnakecaseDeviceType() === 'tv') {
        return [productConfigItem, pascalCaseDeviceType]
      }
      else if (pascalCaseDeviceType === 'Tablet' && this.getScreen().getSnakecaseDeviceType() === 'tablet') {
        return [productConfigItem, pascalCaseDeviceType]
      }
      else if (pascalCaseDeviceType === 'TripleFold' && this.getScreen().getSnakecaseDeviceType() === 'triplefold') {
        return [productConfigItem, pascalCaseDeviceType]
      }
      else if (pascalCaseDeviceType === 'Wearable' && this.getScreen().getSnakecaseDeviceType() === 'wearable') {
        return [productConfigItem, pascalCaseDeviceType]
      }
      else if (pascalCaseDeviceType === 'WideFold' && this.getScreen().getSnakecaseDeviceType() === 'widefold') {
        return [productConfigItem, pascalCaseDeviceType]
      }
      else if (pascalCaseDeviceType.toLowerCase() === this.getScreen().getSnakecaseDeviceType().toLowerCase()) {
        return [productConfigItem, pascalCaseDeviceType]
      }
    }
  }

  private setProductPreset(): void {
    if (!this.isScreenOptions(this.options)) {
      this.productPreset = createProductPreset(this.options.productConfig, this.options.pascalCaseDeviceType, this)
      return
    }

    const [productConfigItems = [], pascalCaseDeviceType] = this.getProductConfigItems() ?? []
    if (!pascalCaseDeviceType || !productConfigItems.length)
      return

    for (const productConfigItem of productConfigItems) {
      if (
        this.getScreen().getWidth() !== Number(productConfigItem.screenWidth)
        || this.getScreen().getHeight() !== Number(productConfigItem.screenHeight)
        || this.getScreen().getDiagonal() !== Number(productConfigItem.screenDiagonal)
        || this.getScreen().getDensity() !== Number(productConfigItem.screenDensity)
      ) {
        continue
      }
      if (productConfigItem.outerScreenWidth && productConfigItem.outerScreenHeight && productConfigItem.outerScreenDiagonal) {
        const outerScreen = this.getScreen().getOuterScreen()
        if (!outerScreen)
          continue
        if (
          outerScreen.getWidth() !== Number(productConfigItem.outerScreenWidth)
          || outerScreen.getHeight() !== Number(productConfigItem.outerScreenHeight)
          || outerScreen.getDiagonal() !== Number(productConfigItem.outerScreenDiagonal)
        ) {
          continue
        }
      }
      if (productConfigItem.outerDoubleScreenWidth && productConfigItem.outerDoubleScreenHeight && productConfigItem.outerDoubleScreenDiagonal) {
        const outerDoubleScreen = this.getScreen().getOuterScreen()?.getOuterDoubleScreen()
        if (!outerDoubleScreen)
          continue
        if (
          outerDoubleScreen.getWidth() !== Number(productConfigItem.outerDoubleScreenWidth)
          || outerDoubleScreen.getHeight() !== Number(productConfigItem.outerDoubleScreenHeight)
          || outerDoubleScreen.getDiagonal() !== Number(productConfigItem.outerDoubleScreenDiagonal)
        ) {
          continue
        }
      }
      this.productPreset = createProductPreset(productConfigItem, pascalCaseDeviceType, this)
      return
    }
  }

  private setEmulatorPreset(): void {
    if (!this.isScreenOptions(this.options))
      return

    if (!this.options.emulatorConfig)
      return

    for (const parentConfigItem of this.options.emulatorConfig) {
      if (parentConfigItem.api !== this.options.screen.getApiVersion())
        continue
      if (ParentEmulatorConfigItem.is(parentConfigItem) && parentConfigItem.deviceType === this.options.screen.getSnakecaseDeviceType()) {
        this.emulatorPreset = createEmulatorPreset(parentConfigItem, this)
        return
      }
      if (GroupPhoneAllEmulatorConfigItem.is(parentConfigItem) && isPhoneAllSnakecaseDeviceType(this.options.screen.getSnakecaseDeviceType())) {
        for (const childrenConfigItem of parentConfigItem.children) {
          if (PhoneAllEmulatorConfigItem.is(childrenConfigItem) && childrenConfigItem.deviceType === this.options.screen.getSnakecaseDeviceType()) {
            this.emulatorPreset = createEmulatorPreset(childrenConfigItem, this)
            return
          }
        }
      }
      if (GroupPCAllEmulatorConfigItem.is(parentConfigItem) && isPCAllSnakecaseDeviceType(this.options.screen.getSnakecaseDeviceType())) {
        for (const childrenConfigItem of parentConfigItem.children) {
          if (PCAllEmulatorConfigItem.is(childrenConfigItem) && childrenConfigItem.deviceType === this.options.screen.getSnakecaseDeviceType()) {
            this.emulatorPreset = createEmulatorPreset(childrenConfigItem, this)
            return
          }
        }
      }
    }
  }

  getEmulatorPreset(): EmulatorPreset | undefined {
    return this.emulatorPreset
  }

  getProductPreset(): ProductPreset | undefined {
    return this.productPreset
  }

  toJSON(): ScreenPreset.Stringifiable {
    return {
      emulatorPreset: this.emulatorPreset?.toJSON(),
      productPreset: this.productPreset?.toJSON(),
    }
  }
}
/**
 * Create a screen preset with screen.
 *
 * @param options - The options to create a screen preset.
 */
export function createScreenPreset(options: ScreenPreset.ScreenOptions): ScreenPreset
/**
 * Create a screen preset with product options and local image.
 *
 * @param options - The options to create a screen preset.
 */
export function createScreenPreset(options: ScreenPreset.ProductOptions): ScreenPreset
export function createScreenPreset(options: ScreenPreset.Options): ScreenPreset {
  return new ScreenPresetImpl(options)
}
