import type { Stringifiable } from '../types'

export interface BaseScreen<T extends BaseScreen.Options = BaseScreen.Options> extends Stringifiable<T> {
  getWidth(): number
  setWidth(width: number): this
  getHeight(): number
  setHeight(height: number): this
  getDiagonal(): number
  setDiagonal(diagonal: number): this
}

export namespace BaseScreen {
  export interface Options {
    width: number
    height: number
    diagonal: number
  }
}

export abstract class BaseScreenImpl<T extends BaseScreen.Options = BaseScreen.Options> implements BaseScreen<T> {
  constructor(protected readonly options: T) {}

  getWidth(): number {
    return this.options.width
  }

  setWidth(width: number): this {
    this.options.width = width
    return this
  }

  getHeight(): number {
    return this.options.height
  }

  setHeight(height: number): this {
    this.options.height = height
    return this
  }

  getDiagonal(): number {
    return this.options.diagonal
  }

  setDiagonal(diagonal: number): this {
    this.options.diagonal = diagonal
    return this
  }

  toJSON(): T {
    return this.options
  }
}
