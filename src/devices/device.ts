import type child_process from 'node:child_process'
import type { Readable } from 'node:stream'
import type { FileSystemWatcher } from 'vscode-fs'
import type { ConfigIniFile, NamedIniFile, ProductConfigFile } from '../configs'
import type { ListsFile, ListsFileItem } from '../configs/lists'
import type { ImageManager } from '../image-manager'
import type { ScreenPreset } from '../screens/screen-preset'
import type { BaseSerializable, Serializable } from '../types'
import { fromByteArray } from 'base64-js'
import { RelativePattern } from 'vscode-fs'

export interface Device<
  ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
  ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
> extends Serializable<Device.Serializable<ProductDeviceType, ProductName>> {
  /** Get the screen of the device. */
  getScreen(): ScreenPreset<ProductDeviceType, ProductName>
  /** Get the image manager of the device. */
  getImageManager(): ImageManager
  /** Get the lists file of the device. */
  getListsFile(): ListsFile
  /** Get the lists file item of the device. */
  getListsFileItem(): ListsFileItem
  /** Get the config INI file of the device. */
  getConfigIniFile(): ConfigIniFile<ProductDeviceType, ProductName>
  /** Get the named INI file of the device. */
  getNamedIniFile(): NamedIniFile<ProductDeviceType, ProductName>
  /** Get the executable URI of the device. */
  getExecutableUri(): import('vscode-uri').URI
  /** Get the snapshot URI of the device. */
  getSnapshotUri(): import('vscode-uri').URI
  /** Get the snapshot base64 string of the device. */
  getSnapshot(): Promise<string>
  /** Get the start command of the device. */
  getStartCommand(): [string, string[]]
  /** Get the stop command of the device. */
  getStopCommand(): [string, string[]]
  /** Start the device. */
  start(): Promise<child_process.ChildProcessByStdio<null, Readable, Readable>>
  /** Stop the device. */
  stop(): Promise<child_process.ChildProcessByStdio<null, Readable, Readable>>
  /** Delete the device. */
  delete(): Promise<void>
  /** Get the storage size of the device. */
  getStorageSize(): Promise<number>
  /**
   * Get the watcher of the device.
   *
   * - If the watcher is already created, it will return the existing watcher.
   * - If the watcher is disposed, it will create a new watcher.
   * - If the watcher is already created but disposed, it will create a new watcher.
   */
  getWatcher(): Promise<FileSystemWatcher>
}

export namespace Device {
  export interface Serializable<
    ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
    ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
  > extends Omit<BaseSerializable<Device<ProductDeviceType, ProductName>>, 'imageManager'> {}

  export function is(value: unknown): value is Device {
    return value instanceof DeviceImpl
  }
}

export interface DeviceOptions<
  ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
  ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
> {
  readonly imageManager: ImageManager
  readonly listsFile: ListsFile
  readonly listFileItem: ListsFileItem
  readonly screen: ScreenPreset<ProductDeviceType, ProductName>
}

export class DeviceImpl<
  ProductDeviceType extends ProductConfigFile.DeviceType = ProductConfigFile.DeviceType,
  ProductName extends ProductConfigFile.GenericContent<ProductDeviceType>['name'] = ProductConfigFile.GenericContent<ProductDeviceType>['name'],
> implements Device<ProductDeviceType, ProductName> {
  constructor(private readonly options: DeviceOptions<ProductDeviceType, ProductName>) {}

  getScreen(): ScreenPreset<ProductDeviceType, ProductName> {
    return this.options.screen
  }

  getListsFile(): ListsFile {
    return this.options.listsFile
  }

  getListsFileItem(): ListsFileItem {
    return this.options.listFileItem
  }

  getImageManager(): ImageManager {
    return this.options.imageManager
  }

  private _configIniFile: ConfigIniFile<ProductDeviceType, ProductName>

  setConfigIniFile(configIniFile: ConfigIniFile<ProductDeviceType, ProductName>): this {
    this._configIniFile = configIniFile
    return this
  }

  getConfigIniFile(): ConfigIniFile<ProductDeviceType, ProductName> {
    return this._configIniFile
  }

  private _namedIniFile: NamedIniFile<ProductDeviceType, ProductName>

  getNamedIniFile(): NamedIniFile<ProductDeviceType, ProductName> {
    return this._namedIniFile
  }

  setNamedIniFile(namedIniFile: NamedIniFile<ProductDeviceType, ProductName>): this {
    this._namedIniFile = namedIniFile
    return this
  }

  getExecutableUri(): import('vscode-uri').URI {
    const { emulatorPath, adapter: { join, process } } = this.getImageManager().getOptions()
    return join(emulatorPath, process.platform === 'win32' ? 'Emulator.exe' : 'Emulator')
  }

  getSnapshotUri(): import('vscode-uri').URI {
    const { deployedPath, adapter: { join } } = this.getImageManager().getOptions()
    return join(deployedPath, this.getListsFileItem().getContent().name, 'Snapshot.png')
  }

  async getSnapshot(): Promise<string> {
    const snapshotUri = this.getSnapshotUri()
    const { adapter: { fs } } = this.getImageManager().getOptions()
    const snapshot = await fs.readFile(snapshotUri)
    return fromByteArray(snapshot)
  }

  getStartCommand(): [string, string[]] {
    const listFileItemContent = this.getListsFileItem().getContent()
    const executableUri = this.getExecutableUri()
    return [
      executableUri.fsPath,
      [
        '-hvd',
        listFileItemContent.name,
        '-path',
        this.getImageManager().getOptions().deployedPath.fsPath,
        '-imageRoot',
        this.getImageManager().getOptions().imageBasePath.fsPath,
      ],
    ]
  }

  async start(): Promise<child_process.ChildProcessByStdio<null, Readable, Readable>> {
    const { emulatorPath, adapter: { child_process } } = this.getImageManager().getOptions()
    const [executableUri, args] = this.getStartCommand()
    return child_process.spawn(executableUri, args, { cwd: emulatorPath.fsPath, stdio: ['ignore', 'pipe', 'pipe'] })
  }

  getStopCommand(): [string, string[]] {
    const listFileItemContent = this.getListsFileItem().getContent()
    const executableUri = this.getExecutableUri()
    return [executableUri.fsPath, ['-stop', listFileItemContent.name]]
  }

  async stop(): Promise<child_process.ChildProcessByStdio<null, Readable, Readable>> {
    const { emulatorPath, adapter: { child_process } } = this.getImageManager().getOptions()
    const [executableUri, args] = this.getStopCommand()
    return child_process.spawn(executableUri, args, { cwd: emulatorPath.fsPath, stdio: ['ignore', 'pipe', 'pipe'] })
  }

  async delete(): Promise<void> {
    const { deployedPath, adapter: { join, fs } } = this.getImageManager().getOptions()

    await Promise.allSettled([
      fs.delete(join(deployedPath, this.getListsFileItem().getContent().name), { recursive: true }),
      fs.delete(join(deployedPath, `${this.getListsFileItem().getContent().name}.ini`), { recursive: false }),
      this.getImageManager().readListsFile().then(
        async (listsFile) => {
          const listsFileItem = listsFile.getListsFileItems().find(item => item.getContent().name === this.getListsFileItem().getContent().name)
          if (!listsFileItem) return
          await listsFile.deleteListsFileItem(listsFileItem).write()
        },
      ),
    ])
  }

  async getStorageSize(): Promise<number> {
    const { deployedPath, adapter: { join, fs } } = this.getImageManager().getOptions()
    const storageSize = await fs.stat(join(deployedPath, this.getListsFileItem().getContent().name))
    return storageSize.size
  }

  private _watcher?: FileSystemWatcher

  async getWatcher(): Promise<FileSystemWatcher> {
    if (this._watcher && !this._watcher.isDisposed) return this._watcher
    const { deployedPath, adapter: { fs, join } } = this.getImageManager().getOptions()
    this._watcher = await fs.createWatcher(new RelativePattern(join(deployedPath, this.getListsFileItem().getContent().name), '**'))
    return this._watcher
  }

  toJSON(): Device.Serializable<ProductDeviceType, ProductName> {
    return {
      screen: this.getScreen(),
      listsFile: this.getListsFile().toJSON(),
      listsFileItem: this.getListsFileItem().toJSON(),
      configIniFile: this.getConfigIniFile().toJSON(),
      namedIniFile: this.getNamedIniFile().toJSON(),
      executableUri: this.getExecutableUri().toJSON(),
      snapshotUri: this.getSnapshotUri().toJSON(),
      startCommand: this.getStartCommand(),
      stopCommand: this.getStopCommand(),
    }
  }
}
