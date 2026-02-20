import type { ImageManager } from '../src'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect } from 'vitest'
import { createImageManager, createProductPreset, RequestUrlError } from '../src'

const imageBasePath = path.resolve(__dirname, 'fixtures', 'images')
const deployedPath = path.resolve(__dirname, 'fixtures', 'deployed')
const emulatorPath = path.resolve(__dirname, 'fixtures', 'emulator')
const projectRootPath = path.resolve(__dirname, '..')
const downloadTest = false

describe.sequential('image manager', (it) => {
  let imageManager: ImageManager

  it.beforeAll(async () => {
    if (downloadTest) {
      for (const filePath of fs.readdirSync(path.resolve(imageBasePath))) {
        if (filePath === '.gitkeep' || filePath === 'cache')
          continue
        fs.rmSync(path.resolve(imageBasePath, filePath), { recursive: true, force: true })
      }
      for (const filePath of fs.readdirSync(path.resolve(deployedPath))) {
        if (filePath === '.gitkeep')
          continue
        fs.rmSync(path.resolve(deployedPath, filePath), { recursive: true, force: true })
      }
    }
    imageManager = await createImageManager({ imageBasePath, deployedPath, emulatorPath })
    expect(await imageManager.isCompatible()).toBe(true)
  })

  it.sequential('should write default product config', async () => {
    await imageManager.writeDefaultProductConfig()
  })

  it.runIf(downloadTest)('should create image manager', async () => {
    const images = await imageManager.getImages()
    const image = images[0]
    const downloader = await image.createDownloader()
    if (downloader instanceof RequestUrlError)
      return console.error(downloader)
    downloader.on('download-progress', progress => console.warn(progress))
    downloader.on('extract-progress', progress => console.warn(progress))
    await downloader.startDownload()
    const checksum = await downloader.checkChecksum()
    console.warn(`Checksum: ${checksum}`)
    if (!checksum)
      return console.error('Checksum is not valid')
    await downloader.extract()
    await downloader.clean()
  }, 1000 * 60 * 10)

  it.sequential('should deploy image', async () => {
    const image = await imageManager.getImages().then(images => images.find(image => image.imageType === 'local'))
    if (!image)
      return console.error('No local image found')
    if (image instanceof RequestUrlError)
      return console.error(image)
    const productConfig = await image.getProductConfig()
    const mateBookFold = productConfig.find(item => item.name === 'MateBook Fold')
    if (!mateBookFold)
      throw new Error('MateBook Fold not found')
    const uuid = crypto.randomUUID()
    const deployer = image.createDevice({
      name: 'MateBook Fold',
      cpuNumber: 4,
      diskSize: 6144,
      memorySize: 4096,
      screen: await createProductPreset(mateBookFold, '2in1 Foldable'),
    }).setUuid(uuid)

    expect(deployer.buildList()).toMatchInlineSnapshot(`
      {
        "abi": "arm",
        "apiVersion": "22",
        "cpuNumber": "4",
        "dataDiskSize": "6144",
        "density": "288",
        "devModel": "PCEMU-FD05",
        "diagonalSize": "18.00",
        "guestVersion": "HarmonyOS 6.0.0.129(Beta1)",
        "harmonyOSVersion": "HarmonyOS-6.0.2",
        "harmonyos.config.path": "${imageManager.getOptions().configPath}",
        "harmonyos.log.path": "${imageManager.getOptions().logPath}",
        "harmonyos.sdk.path": "${path.resolve(projectRootPath, 'test', 'fixtures', 'images')}",
        "hw.apiName": "6.0.2",
        "imageDir": "system-image/HarmonyOS-6.0.2/pc_all_arm/",
        "memoryRamSize": "4096",
        "model": "MateBook Fold",
        "name": "MateBook Fold",
        "path": "${path.resolve(projectRootPath, 'test', 'fixtures', 'deployed', 'MateBook Fold')}",
        "resolutionHeight": "2472",
        "resolutionWidth": "3296",
        "showVersion": "HarmonyOS 6.0.2(22)",
        "type": "2in1_foldable",
        "uuid": "${uuid}",
        "version": "6.0.0.129",
      }
    `)

    expect(deployer.buildIni()).toMatchInlineSnapshot(`
      {
        "configPath": "${imageManager.getOptions().configPath}",
        "deviceModel": "PCEMU-FD05",
        "deviceType": "2in1_foldable",
        "hw.cpu.arch": "arm",
        "hw.cpu.ncore": "4",
        "hw.dataPartitionSize": "6144",
        "hw.hdc.port": "notset",
        "hw.lcd.density": "288",
        "hw.lcd.double.diagonalSize": "18",
        "hw.lcd.double.height": "2472",
        "hw.lcd.double.width": "3296",
        "hw.lcd.number": "2",
        "hw.lcd.single.diagonalSize": "13",
        "hw.lcd.single.height": "1648",
        "hw.lcd.single.width": "2472",
        "hw.ramSize": "4096",
        "imageSubPath": "system-image/HarmonyOS-6.0.2/pc_all_arm/",
        "instancePath": "${path.resolve(projectRootPath, 'test', 'fixtures', 'deployed', 'MateBook Fold')}",
        "isCustomize": "false",
        "logPath": "${imageManager.getOptions().logPath}",
        "name": "MateBook Fold",
        "os.apiVersion": "22",
        "os.isPublic": "true",
        "os.osVersion": "HarmonyOS 6.0.2(22)",
        "os.softwareVersion": "6.0.0.129",
        "productModel": "MateBook Fold",
        "sdkPath": "${path.resolve(projectRootPath, 'test', 'fixtures', 'images')}",
        "uuid": "${uuid}",
        "vendorCountry": "CN",
      }
    `)

    expect(await deployer.toIniString()).toMatchInlineSnapshot(`
      "name=MateBook Fold
      deviceType=2in1_foldable
      deviceModel=PCEMU-FD05
      productModel=MateBook Fold
      vendorCountry=CN
      uuid=${uuid}
      configPath=${imageManager.getOptions().configPath}
      logPath=${imageManager.getOptions().logPath}
      sdkPath=${path.resolve(projectRootPath, 'test', 'fixtures', 'images')}
      imageSubPath=system-image/HarmonyOS-6.0.2/pc_all_arm/
      instancePath=${path.resolve(projectRootPath, 'test', 'fixtures', 'deployed', 'MateBook Fold')}
      os.osVersion=HarmonyOS 6.0.2(22)
      os.apiVersion=22
      os.softwareVersion=6.0.0.129
      os.isPublic=true
      hw.cpu.arch=arm
      hw.cpu.ncore=4
      hw.lcd.density=288
      hw.lcd.single.diagonalSize=13
      hw.lcd.single.height=1648
      hw.lcd.single.width=2472
      hw.lcd.number=2
      hw.ramSize=4096
      hw.dataPartitionSize=6144
      isCustomize=false
      hw.hdc.port=notset
      hw.lcd.double.diagonalSize=18
      hw.lcd.double.height=2472
      hw.lcd.double.width=3296
      "
    `)

    if (!(await deployer.isDeployed()))
      await deployer.deploy()
    const child_process = await image.start(deployer)

    return new Promise<void>(resolve => setTimeout(resolve, 1000 * 5))
      .then(() => {
        if (typeof child_process.exitCode === 'number')
          throw new Error(`Emulator quit in 5 seconds, exit code: ${child_process.exitCode}`)
      })
      .then(() => image.stop(deployer))
  }, 1000 * 100)
})

describe.skip('start', (it) => {
  let imageManager: ImageManager

  it.beforeAll(async () => {
    imageManager = await createImageManager({ imageBasePath, deployedPath, emulatorPath })
  })

  it.sequential('should start image', async () => {
    const image = await imageManager.getImages().then(images => images.find(image => image.imageType === 'local'))
    if (!image)
      throw new Error('No local image found')
    const productConfig = await image.getProductConfig()
    const mateBookFold = productConfig.find(item => item.name === 'MateBook Fold')
    if (!mateBookFold)
      throw new Error('MateBook Fold not found')
    await image.start(
      image.createDevice({
        name: 'MateBook Fold',
        cpuNumber: 4,
        diskSize: 6144,
        memorySize: 4096,
        screen: await createProductPreset(mateBookFold, '2in1 Foldable'),
      }),
    )
  }, 1000 * 1000)
})
