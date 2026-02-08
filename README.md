# @arkts/image-manager

OpenHarmony/HarmonyOS qemu image manager.

## Usage

```ts
import { createImageManager, RequestUrlError } from '@arkts/image-manager'

async function main() {
  const imageManager = createImageManager({ /** options */ })

  // Get all local and remote images
  const images = await imageManager.getImages()
  console.log(images)

  // We choice the first image to deploy
  const image = images[0]
  // Download the image
  const downloader = await image.createDownloader()
  if (downloader instanceof RequestUrlError)
    return console.error(downloader)

  // Listen to the download and extract progress
  downloader.on('download-progress', progress => console.warn(progress))
  downloader.on('extract-progress', progress => console.warn(progress))

  // Start download
  await downloader.startDownload()

  // When the download is complete, we can check the checksum
  const checksum = await downloader.checkChecksum()
  console.warn(`Checksum: ${checksum}`)
  if (!checksum)
    return console.error('Checksum is not valid')

  // Start extract the image
  await downloader.extract()

  // Clean the download cache
  await downloader.clean()

  // Start to deploy the image
  // We must find the product config item if you don't want to customize the deployed image options,
  // like `screenWidth`, `screenHeight`, `screenDiagonal`, `screenDensity`, etc.
  const productConfig = await image.getProductConfig()
  const mateBookFold = productConfig.find(item => item.name === 'MateBook Fold')
  if (!mateBookFold)
    throw new Error('MateBook Fold not found')

  // Create the deployer
  const deployer = image.createDeployer('MateBook Fold', createDeployedImageConfig(image))
    .setCpuNumber(4)
    .setMemoryRamSize(4096)
    .setDataDiskSize(6144)

  // We can get the final deployed image options,
  // it will be written to the `imageBasePath/lists.json` file when deployed.
  const list = await deployer.buildList()
  console.warn(list)

  // We can get the `config.ini` object,
  // it will be written to the `deployedPath/MateBook Fold/config.ini` file when deployed.
  const config = await deployer.buildIni()
  console.warn(config)
  // You also can get the `config.ini` string version:
  const iniString = await deployer.toIniString()
  console.warn(iniString)

  // Deploy the image
  await deployer.deploy()
  console.warn('Image deployed successfully')

  // Start the emulator
  await image.start(deployer)

  await new Promise<void>(resolve => setTimeout(resolve, 1000 * 60))
  // Stop the emulator
  image.stop(deployer)
}
```
