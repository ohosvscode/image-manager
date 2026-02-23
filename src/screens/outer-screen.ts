import type { BaseScreen } from './base-screen'
import type { Screen } from './screen'
import { BaseScreenImpl } from './base-screen'
import { createOuterDoubleScreen, OuterDoubleScreen } from './outer-double-screen'

export interface OuterScreen<T extends OuterScreen.Options = OuterScreen.Options> extends BaseScreen<T> {
  getScreen(): Screen
  getOuterDoubleScreen(): OuterDoubleScreen | undefined
  setOuterDoubleScreen(outerDoubleScreen: OuterDoubleScreen | OuterDoubleScreen.Options): this
}

export namespace OuterScreen {
  export interface Options extends BaseScreen.Options {
    double?: OuterDoubleScreen | OuterDoubleScreen.Options
  }
  export interface Stringifiable extends Options {}

  export function is(value: unknown): value is OuterScreen {
    return value instanceof OuterScreenImpl
  }
}

export class OuterScreenImpl<T extends OuterScreen.Options = OuterScreen.Options> extends BaseScreenImpl<T> implements OuterScreen<T> {
  private outerDoubleScreen?: OuterDoubleScreen

  constructor(
    protected readonly options: T,
    private readonly screen: Screen,
  ) {
    super(options)

    if (options.double) {
      this.outerDoubleScreen = OuterDoubleScreen.is(options.double) ? options.double : createOuterDoubleScreen(options.double, this)
    }
  }

  getScreen(): Screen {
    return this.screen
  }

  getOuterDoubleScreen(): OuterDoubleScreen | undefined {
    return this.outerDoubleScreen
  }

  setOuterDoubleScreen(outerDoubleScreen: OuterDoubleScreen | OuterDoubleScreen.Options): this {
    this.outerDoubleScreen = OuterDoubleScreen.is(outerDoubleScreen) ? outerDoubleScreen : createOuterDoubleScreen(outerDoubleScreen, this)
    return this
  }

  toJSON(): T {
    return {
      ...super.toJSON(),
      double: this.outerDoubleScreen?.toJSON(),
    }
  }
}

export function createOuterScreen(options: OuterScreen.Options, screen: Screen): OuterScreen {
  return new OuterScreenImpl(options, screen)
}
