import type { OuterScreen } from './outer-screen'
import { OuterScreenImpl } from './outer-screen'

export interface OuterDoubleScreen extends OuterScreen {
  getOuterScreen(): OuterScreen
}

export namespace OuterDoubleScreen {
  export interface Options extends OuterScreen.Options {}
  export interface Stringifiable extends Options {}

  export function is(value: unknown): value is OuterDoubleScreen {
    return value instanceof OuterDoubleScreenImpl
  }
}

export class OuterDoubleScreenImpl extends OuterScreenImpl implements OuterDoubleScreen {
  constructor(
    protected readonly options: OuterDoubleScreen.Options,
    private readonly outerScreen: OuterScreen,
  ) {
    super(options, outerScreen.getScreen())
  }

  getOuterScreen(): OuterScreen {
    return this.outerScreen
  }
}

export function createOuterDoubleScreen(options: OuterDoubleScreen.Options, outerScreen: OuterScreen): OuterDoubleScreen {
  return new OuterDoubleScreenImpl(options, outerScreen)
}
