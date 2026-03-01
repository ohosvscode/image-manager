import type { ScreenPreset } from './screen-preset'
import type { Serializable } from '../types'
import type { CustomizeScreen } from './customize-screen'
import { CustomizeScreenImpl } from './customize-screen'

export interface CustomizeFoldableScreen extends Serializable<CustomizeFoldableScreen.Serializable>, Omit<CustomizeScreen, 'toJSON'> {
  getCoverResolutionWidth(): number
  getCoverResolutionHeight(): number
  getCoverDiagonalSize(): number
}

export namespace CustomizeFoldableScreen {
  export interface Options {
    coverResolutionWidth: number
    coverResolutionHeight: number
    coverDiagonalSize: number
  }

  export interface Serializable extends CustomizeScreen.Serializable, CustomizeFoldableScreen.Options {}

  export function is(value: unknown): value is CustomizeFoldableScreen {
    return value instanceof CustomizeFoldableScreenImpl
  }
}

export class CustomizeFoldableScreenImpl extends CustomizeScreenImpl implements CustomizeFoldableScreen {
  constructor(
    protected readonly screenPreset: ScreenPreset,
    protected readonly options?: CustomizeScreen.Options,
    protected readonly foldableOptions?: CustomizeFoldableScreen.Options,
  ) {
    super(screenPreset, options)
  }

  getCoverResolutionWidth(): number {
    return this.foldableOptions?.coverResolutionWidth ?? 0
  }

  getCoverResolutionHeight(): number {
    return this.foldableOptions?.coverResolutionHeight ?? 0
  }

  getCoverDiagonalSize(): number {
    return this.foldableOptions?.coverDiagonalSize ?? 0
  }

  toJSON(): CustomizeFoldableScreen.Serializable {
    return {
      ...super.toJSON(),
      coverResolutionWidth: this.getCoverResolutionWidth(),
      coverResolutionHeight: this.getCoverResolutionHeight(),
      coverDiagonalSize: this.getCoverDiagonalSize(),
    }
  }
}
