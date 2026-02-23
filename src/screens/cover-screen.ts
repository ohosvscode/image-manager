import type { BaseScreen } from './base-screen'
import type { Screen } from './screen'
import { BaseScreenImpl } from './base-screen'

export interface CoverScreen<T extends CoverScreen.Options = CoverScreen.Options> extends BaseScreen<T> {
  getScreen(): Screen
}

export namespace CoverScreen {
  export interface Options extends BaseScreen.Options {}
  export interface Stringifiable extends Options {}

  export function is(value: unknown): value is CoverScreen {
    return value instanceof CoverScreenImpl
  }
}

export class CoverScreenImpl extends BaseScreenImpl implements CoverScreen {
  constructor(
    protected readonly options: CoverScreen.Options,
    private readonly screen: Screen,
  ) {
    super(options)
  }

  getScreen(): Screen {
    return this.screen
  }
}

export function createCoverScreen(options: CoverScreen.Options, screen: Screen): CoverScreen {
  return new CoverScreenImpl(options, screen)
}
