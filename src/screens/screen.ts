import type { SnakecaseDeviceType } from '../types'
import type { BaseScreen } from './base-screen'
import { BaseScreenImpl } from './base-screen'
import { CoverScreen, createCoverScreen } from './cover-screen'
import { createDoubleScreen, DoubleScreen } from './double-screen'
import { createOuterScreen, OuterScreen } from './outer-screen'
import { createSingleScreen, SingleScreen } from './single-screen'

export interface Screen<T extends Screen.Options = Screen.Options> extends BaseScreen<T> {
  getScreen(): this
  getApiVersion(): number
  getSnakecaseDeviceType(): SnakecaseDeviceType
  getOuterScreen(): OuterScreen | undefined
  setOuterScreen(outerScreen: OuterScreen | OuterScreen.Options): this
  getCoverScreen(): CoverScreen | undefined
  setCoverScreen(coverScreen: CoverScreen | CoverScreen.Options): this
  getSingleScreen(): SingleScreen | undefined
  setSingleScreen(singleScreen: SingleScreen | SingleScreen.Options): this
  getDoubleScreen(): DoubleScreen | undefined
  setDoubleScreen(doubleScreen: DoubleScreen | DoubleScreen.Options): this
  getDensity(): number
  setDensity(density: number): this
}

export namespace Screen {
  export interface Options extends BaseScreen.Options {
    density: number
    apiVersion: number
    deviceType: SnakecaseDeviceType
    outer?: OuterScreen | OuterScreen.Options
    cover?: CoverScreen | CoverScreen.Options
    single?: SingleScreen | SingleScreen.Options
    double?: DoubleScreen | DoubleScreen.Options
  }

  export interface Stringifiable extends Options {}

  export function is(value: unknown): value is Screen {
    return value instanceof ScreenImpl
  }
}

export class ScreenImpl extends BaseScreenImpl implements Screen {
  private outerScreen?: OuterScreen
  private coverScreen?: CoverScreen
  private singleScreen?: SingleScreen
  private doubleScreen?: DoubleScreen

  constructor(protected readonly options: Screen.Options) {
    super(options)

    if (options.outer) {
      this.outerScreen = OuterScreen.is(options.outer) ? options.outer : createOuterScreen(options.outer, this)
    }

    if (options.cover) {
      this.coverScreen = CoverScreen.is(options.cover) ? options.cover : createCoverScreen(options.cover, this)
    }

    if (options.single) {
      this.singleScreen = SingleScreen.is(options.single) ? options.single : createSingleScreen(options.single, this)
    }

    if (options.double) {
      this.doubleScreen = DoubleScreen.is(options.double) ? options.double : createDoubleScreen(options.double, this)
    }
  }

  getScreen(): this {
    return this
  }

  getApiVersion(): number {
    return this.options.apiVersion
  }

  getSnakecaseDeviceType(): SnakecaseDeviceType {
    return this.options.deviceType
  }

  getOuterScreen(): OuterScreen | undefined {
    return this.outerScreen
  }

  setOuterScreen(outerScreen: OuterScreen | OuterScreen.Options): this {
    this.outerScreen = OuterScreen.is(outerScreen) ? outerScreen : createOuterScreen(outerScreen, this)
    return this
  }

  getCoverScreen(): CoverScreen | undefined {
    return this.coverScreen
  }

  setCoverScreen(coverScreen: CoverScreen | CoverScreen.Options): this {
    this.coverScreen = CoverScreen.is(coverScreen) ? coverScreen : createCoverScreen(coverScreen, this)
    return this
  }

  getSingleScreen(): SingleScreen | undefined {
    return this.singleScreen
  }

  setSingleScreen(singleScreen: SingleScreen | SingleScreen.Options): this {
    this.singleScreen = SingleScreen.is(singleScreen) ? singleScreen : createSingleScreen(singleScreen, this)
    return this
  }

  getDoubleScreen(): DoubleScreen | undefined {
    return this.doubleScreen
  }

  setDoubleScreen(doubleScreen: DoubleScreen | DoubleScreen.Options): this {
    this.doubleScreen = DoubleScreen.is(doubleScreen) ? doubleScreen : createDoubleScreen(doubleScreen, this)
    return this
  }

  getDensity(): number {
    return this.options.density
  }

  setDensity(density: number): this {
    this.options.density = density
    return this
  }

  toJSON(): Screen.Options {
    return {
      ...super.toJSON(),
      density: this.options.density,
      apiVersion: this.options.apiVersion,
      deviceType: this.options.deviceType,
      outer: this.outerScreen?.toJSON(),
      cover: this.coverScreen?.toJSON(),
      single: this.singleScreen?.toJSON(),
    }
  }
}

export function createScreen(options: Screen.Options): Screen {
  return new ScreenImpl(options)
}
