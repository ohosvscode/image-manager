import type { BaseScreen } from './base-screen'
import type { Screen } from './screen'
import { BaseScreenImpl } from './base-screen'

export interface DoubleScreen {
  getScreen(): Screen
}

export namespace DoubleScreen {
  export interface Options extends BaseScreen.Options {}
  export interface Stringifiable extends Options {}

  export function is(value: unknown): value is DoubleScreen {
    return value instanceof DoubleScreenImpl
  }
}

export class DoubleScreenImpl extends BaseScreenImpl implements DoubleScreen {
  constructor(
    protected readonly options: DoubleScreen.Options,
    private readonly screen: Screen,
  ) {
    super(options)
  }

  getScreen(): Screen {
    return this.screen
  }
}

export function createDoubleScreen(options: DoubleScreen.Options, screen: Screen): DoubleScreen {
  return new DoubleScreenImpl(options, screen)
}
