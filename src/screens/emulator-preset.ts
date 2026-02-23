import type { EmulatorConfigItem } from '../emulator-config'
import type { Stringifiable } from '../types'
import type { ScreenPreset } from './screen-preset'

export interface EmulatorPreset extends Stringifiable<EmulatorPreset.Stringifiable> {
  getScreenPreset(): ScreenPreset
  getEmulatorConfig(): EmulatorConfigItem
}

export namespace EmulatorPreset {
  export interface Stringifiable {
    emulatorConfig: EmulatorConfigItem
  }
}

export class EmulatorPresetImpl implements EmulatorPreset {
  constructor(
    private readonly emulatorConfigItem: EmulatorConfigItem,
    private readonly screenPreset: ScreenPreset,
  ) {}

  getScreenPreset(): ScreenPreset {
    return this.screenPreset
  }

  getEmulatorConfig(): EmulatorConfigItem {
    return this.emulatorConfigItem
  }

  toJSON(): EmulatorPreset.Stringifiable {
    return {
      emulatorConfig: this.emulatorConfigItem,
    }
  }
}

export function createEmulatorPreset(emulatorConfigItem: EmulatorConfigItem, screenPreset: ScreenPreset): EmulatorPreset {
  return new EmulatorPresetImpl(emulatorConfigItem, screenPreset)
}
