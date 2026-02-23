import type { BaseScreen } from './base-screen'
import type { Screen } from './screen'
import { BaseScreenImpl } from './base-screen'

export interface SingleScreen<T extends SingleScreen.Options = SingleScreen.Options> extends BaseScreen<T> {
  getScreen(): Screen
}

export namespace SingleScreen {
  export interface Options extends BaseScreen.Options {}
  export interface Stringifiable extends Options {}

  export function is(value: unknown): value is SingleScreen {
    return value instanceof SingleScreenImpl
  }
}

export class SingleScreenImpl extends BaseScreenImpl implements SingleScreen {
  constructor(
    protected readonly options: SingleScreen.Options,
    private readonly screen: Screen,
  ) {
    super(options)
  }

  getScreen(): Screen {
    return this.screen
  }
}

export function createSingleScreen(options: SingleScreen.Options, screen: Screen): SingleScreen {
  return new SingleScreenImpl(options, screen)
}
