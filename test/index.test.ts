import type { ImageManager } from '../src'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect } from 'vitest'
import { createImageManager } from '../src'
import { SDKList } from '../src/sdk-list'

const FIXTURE_DIR = path.resolve(__dirname, 'fixtures')

describe.sequential('image manager', (it) => {
  let imageManager: ImageManager

  it.sequential('should create image manager', async () => {
    imageManager = await createImageManager({
      imageBasePath: path.resolve(FIXTURE_DIR, 'images'),
      deployedPath: path.resolve(FIXTURE_DIR, 'deployed'),
      cachePath: path.resolve(FIXTURE_DIR, 'cache'),
      emulatorPath: path.resolve(FIXTURE_DIR, 'emulator'),
    })
    expect(imageManager).toBeDefined()
  })

  it.skip('should get remote images, get local image and create device', async () => {
    const remoteImages = await imageManager.getDownloadedRemoteImages()
    if (remoteImages instanceof SDKList.SDKListError) throw remoteImages
    const remoteImage = remoteImages[0]
    if (!remoteImage) throw new Error('No remote image found')
    const localImage = (await remoteImage.getLocalImage())!
    expect(localImage).toBeDefined()
    const emulatorFile = await imageManager.readEmulatorFile()
    const emulatorDeviceItem = emulatorFile.findDeviceItem({
      apiVersion: localImage.getApiVersion(),
      deviceType: 'foldable',
    })
    if (!emulatorDeviceItem) throw new Error('No emulator device item found')
    const productConfigFile = await imageManager.readProductConfigFile()
    const productConfigItem = productConfigFile.findProductConfigItem({
      deviceType: 'Foldable',
      name: 'Mate X5',
    })
    if (!productConfigItem) throw new Error('No product config item found')

    const device = await localImage.createDevice({
      name: 'test',
      cpuNumber: 4,
      dataDiskSize: 6144,
      memoryRamSize: 8192,
      screen: {
        emulatorDeviceItem,
        productConfigItem,
      },
    })
    const configIniFileContent = await device.getConfigIniFile().serialize()
    const namedIniFileContent = await device.getNamedIniFile().serialize()
    await expect(configIniFileContent).toMatchFileSnapshot('./fixtures/deployed/test/config.ini')
    await expect(namedIniFileContent).toMatchFileSnapshot('./fixtures/deployed/test.ini')
  })

  it.sequential('should get deployed devices', async () => {
    const deployedDevices = await imageManager.getDeployedDevices()
    expect(deployedDevices).toBeDefined()
    expect(deployedDevices.length).toBeGreaterThanOrEqual(1)
    console.warn(deployedDevices)
    console.warn(`Starting device: ${deployedDevices[0].getStartCommand()}...`)
    const start_child_process = await deployedDevices[0].start()
    start_child_process.stdout.pipe(process.stdout)
    start_child_process.stderr.pipe(process.stderr)
    await Promise.race([
      new Promise(resolve => start_child_process.on('close', resolve)),
      new Promise(resolve => setTimeout(resolve, 1000 * 5 /** 5 seconds */)),
    ])
    console.warn(`Stopping device: ${deployedDevices[0].getStopCommand()}...`)
    const stop_child_process = await deployedDevices[0].stop()
    stop_child_process.stdout.pipe(process.stdout)
    stop_child_process.stderr.pipe(process.stderr)
    await Promise.race([
      new Promise(resolve => stop_child_process.on('close', resolve)),
      new Promise(resolve => setTimeout(resolve, 1000 * 5 /** 5 seconds */)),
    ])
  }, 1000 * 60 * 60 /** 1 hour */)

  it.skip('should download and extract image', async () => {
    fs.writeFileSync(path.resolve(FIXTURE_DIR, 'progress.log'), '')
    const remoteImages = await imageManager.getRemoteImages()
    if (remoteImages instanceof SDKList.SDKListError) throw remoteImages
    const remoteImage = remoteImages.find((remoteImage) => {
      return remoteImage.getRemoteImageSDK().apiVersion === '20' && remoteImage.getRemoteImageSDK().version === '6.0.0.48'
    })
    if (!remoteImage) throw new Error('No remote image found, please replace a new version of image.')
    const downloader = await remoteImage.createDownloader()
    downloader.onDownloadProgress((progress) => {
      fs.appendFileSync(path.resolve(FIXTURE_DIR, 'progress.log'), `${JSON.stringify(progress)}\n`)
      console.warn(JSON.stringify(progress))
    })
    downloader.onChecksumProgress((progress) => {
      fs.appendFileSync(path.resolve(FIXTURE_DIR, 'progress.log'), `${JSON.stringify(progress)}\n`)
      console.warn(JSON.stringify(progress))
    })
    downloader.onExtractProgress((progress) => {
      fs.appendFileSync(path.resolve(FIXTURE_DIR, 'progress.log'), `${JSON.stringify(progress)}\n`)
      console.warn(JSON.stringify(progress))
    })
    await downloader.startDownload()
    await downloader.checkChecksum()
    await downloader.extract()
  }, 1000 * 60 * 60 /** 1 hour */)
})
