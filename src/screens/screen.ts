export interface Screen {
  getDiagonal(): number
  setDiagonal(diagonal: number): this
  getDensity(): number
  setDensity(density: number): this
  getHeight(): number
  setHeight(height: number): this
  getWidth(): number
  setWidth(width: number): this
  toJSON(): Screen.Options
}

export namespace Screen {
  export interface Options {
    diagonal: number
    density: number
    height: number
    width: number
  }

  export interface Stringifiable extends Options {}
}

export class ScreenImpl implements Screen {
  constructor(private readonly options: Screen.Options) {}

  getDiagonal(): number {
    return this.options.diagonal
  }

  setDiagonal(diagonal: number): this {
    this.options.diagonal = diagonal
    return this
  }

  getDensity(): number {
    return this.options.density
  }

  setDensity(density: number): this {
    this.options.density = density
    return this
  }

  getHeight(): number {
    return this.options.height
  }

  setHeight(height: number): this {
    this.options.height = height
    return this
  }

  getWidth(): number {
    return this.options.width
  }

  setWidth(width: number): this {
    this.options.width = width
    return this
  }

  toJSON(): Screen.Stringifiable {
    return this.options
  }
}

export function createScreen(options: Screen.Options): Screen {
  return new ScreenImpl(options)
}
