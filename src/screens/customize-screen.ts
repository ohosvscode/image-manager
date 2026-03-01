import type { ScreenPreset } from './screen-preset'
import type { BaseSerializable, Serializable } from '../types'

export interface CustomizeScreen extends Serializable<CustomizeScreen.Serializable> {
  /**
   * Get the screen preset.
   *
   * @returns The screen preset.
   */
  getScreenPreset(): ScreenPreset
}

export namespace CustomizeScreen {
  export interface Options {
    configName: string
    diagonalSize: number
    resolutionWidth: number
    resolutionHeight: number
    density: number
  }

  export interface Serializable extends Omit<BaseSerializable<CustomizeScreen>, 'screenPreset'>, CustomizeScreen.Options {}

  export function is(value: unknown): value is CustomizeScreen {
    return value instanceof CustomizeScreenImpl
  }
}

export class CustomizeScreenImpl implements CustomizeScreen {
  constructor(
    protected readonly screenPreset: ScreenPreset,
    protected readonly options?: CustomizeScreen.Options,
  ) {}

  getConfigName(): string {
    return this.options?.configName ?? 'Customize_01'
  }

  getDiagonalSize(): number {
    return this.options?.diagonalSize ?? 0
  }

  getResolutionWidth(): number {
    return this.options?.resolutionWidth ?? 0
  }

  getResolutionHeight(): number {
    return this.options?.resolutionHeight ?? 0
  }

  getDensity(): number {
    return this.options?.density ?? 0
  }

  getScreenPreset(): ScreenPreset {
    return this.screenPreset
  }

  toJSON(): CustomizeScreen.Serializable {
    return {
      configName: this.getConfigName(),
      diagonalSize: this.getDiagonalSize(),
      resolutionWidth: this.getResolutionWidth(),
      resolutionHeight: this.getResolutionHeight(),
      density: this.getDensity(),
    }
  }
}
