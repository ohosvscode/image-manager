import type { ImageManager } from '../src'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect } from 'vitest'
import { createImageManager, RequestUrlError } from '../src'
import { createDeployedImageConfig } from '../src/product-config'

const imageBasePath = path.resolve(__dirname, 'fixtures', 'images')
const deployedPath = path.resolve(__dirname, 'fixtures', 'deployed')
const emulatorPath = path.resolve(__dirname, 'fixtures', 'emulator')
const projectRootPath = path.resolve(__dirname, '..')
const downloadTest = true

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
    const deployer = image.createDeployer('MateBook Fold', createDeployedImageConfig(mateBookFold))
      .setCpuNumber(4)
      .setMemoryRamSize(4096)
      .setDataDiskSize(6144)
      .setUuid(uuid)

    expect(await deployer.buildList()).toMatchInlineSnapshot(`
      {
        "abi": "arm",
        "apiVersion": "21",
        "cpuNumber": "4",
        "dataDiskSize": "6144",
        "density": "288",
        "devModel": "PCEMU-FD05",
        "diagonalSize": "18",
        "harmonyOSVersion": "HarmonyOS-6.0.1",
        "harmonyos.config.path": "${imageManager.getOptions().configPath}",
        "harmonyos.log.path": "${imageManager.getOptions().logPath}",
        "harmonyos.sdk.path": "${path.resolve(projectRootPath, 'test', 'fixtures', 'images')}",
        "hw.apiName": "6.0.1",
        "imageDir": "system-image/HarmonyOS-6.0.1/pc_all_arm/",
        "memoryRamSize": "4096",
        "name": "MateBook Fold",
        "path": "${path.resolve(projectRootPath, 'test', 'fixtures', 'deployed', 'MateBook Fold')}",
        "productName": "MateBook Fold",
        "resolutionHeight": "2472",
        "resolutionWidth": "3296",
        "showVersion": "HarmonyOS 6.0.1(21)",
        "type": "2in1_foldable",
        "uuid": "${uuid}",
        "version": "6.0.0.112",
      }
    `)

    expect(await deployer.buildIni()).toMatchInlineSnapshot(`
      {
        "coverDiagonalSize": "13",
        "devModel": "PCEMU-FD05",
        "deviceType": "2in1_foldable",
        "diagonalSize": "18",
        "disk.dataPartition.size": "6144M",
        "guest.version": "6.0.0.112",
        "harmonyOSVersion": "HarmonyOS-6.0.1",
        "harmonyos.config.path": "${imageManager.getOptions().configPath}",
        "harmonyos.log.path": "${imageManager.getOptions().logPath}",
        "harmonyos.sdk.path": "${path.resolve(projectRootPath, 'test', 'fixtures', 'images')}",
        "hmAbi": "arm",
        "hmApiVersion": "21",
        "hmShowVersion": "HarmonyOS 6.0.1(21)",
        "hmVersion": "6.0.0.112",
        "hvd.path": "${path.resolve(projectRootPath, 'test', 'fixtures', 'deployed', 'MateBook Fold')}",
        "hw.apiName": "6.0.1",
        "hw.cover.height": "1648",
        "hw.cover.width": "2472",
        "hw.cpu.arch": "arm",
        "hw.cpu.ncore": "4",
        "hw.hdc.port": "notset",
        "hw.lcd.density": "288",
        "hw.lcd.height": "2472",
        "hw.lcd.width": "3296",
        "hw.phy.height": "1648",
        "hw.phy.width": "2472",
        "hw.ramSize": "4096",
        "image.sysdir.1": "system-image/HarmonyOS-6.0.1/pc_all_arm/",
        "isCustomize": "false",
        "isDefault": "true",
        "isPublic": "true",
        "model": undefined,
        "name": "MateBook Fold",
        "uuid": "${uuid}",
        "vendorCountry": "CN",
      }
    `)

    expect(await deployer.toIniString()).toMatchInlineSnapshot(`
      "name=MateBook Fold
      hw.lcd.density=288
      hw.lcd.height=2472
      hw.lcd.width=3296
      hw.cpu.ncore=4
      hw.phy.height=1648
      hw.phy.width=2472
      hw.cover.height=1648
      hw.cover.width=2472
      coverDiagonalSize=13
      diagonalSize=18
      hw.ramSize=4096
      deviceType=2in1_foldable
      uuid=${uuid}
      hmApiVersion=21
      hmAbi=arm
      hmVersion=6.0.0.112
      hw.cpu.arch=arm
      hw.apiName=6.0.1
      image.sysdir.1=system-image/HarmonyOS-6.0.1/pc_all_arm/
      hvd.path=${path.resolve(projectRootPath, 'test', 'fixtures', 'deployed', 'MateBook Fold')}
      disk.dataPartition.size=6144M
      hmShowVersion=HarmonyOS 6.0.1(21)
      harmonyOSVersion=HarmonyOS-6.0.1
      harmonyos.sdk.path=${path.resolve(projectRootPath, 'test', 'fixtures', 'images')}
      harmonyos.config.path=${imageManager.getOptions().configPath}
      harmonyos.log.path=${imageManager.getOptions().logPath}
      guest.version=6.0.0.112
      devModel=PCEMU-FD05
      isDefault=true
      isCustomize=false
      isPublic=true
      vendorCountry=CN
      hw.hdc.port=notset
      "
    `)

    await deployer.deploy()
    const child_process = await image.start(deployer)

    return new Promise<void>(resolve => setTimeout(resolve, 1000 * 60))
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
    await image.start(image.createDeployer('MateBook Fold', createDeployedImageConfig(mateBookFold)))
  }, 1000 * 1000)
})
