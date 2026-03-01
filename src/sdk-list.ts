export namespace SDKList {
  export type OS = 'windows' | 'mac' | 'linux'
  export type Arch = 'x86' | 'arm64'

  export interface Request {
    /**
     * The architecture of the operating system.
     */
    readonly osArch: Arch
    /**
     * The type of the operating system.
     */
    readonly osType: OS
    /**
     * The support version of the SDK.
     */
    readonly supportVersion: string
  }

  export interface RemoteImageSDK {
    /** @example 'system-image,HarmonyOS-6.0.2,pc_all_x86' */
    readonly path: `${string},${string},${string}`
    /** @example '22' */
    readonly apiVersion: string
    /** @example 'HarmonyOS-SDK' */
    readonly license: string
    /** @example '6.0.0.129' */
    readonly version: string
    /** @example 'System-image-pc_all' */
    readonly displayName: string
    /** @example 'HarmonyOS emulator image for pc_all' */
    readonly description: string
    /** @example '0' */
    readonly experimentalFlag: string
    /** @example 'Beta1' */
    readonly releaseType: string
    /** @example '1.0.0' */
    readonly metaVersion: string
    readonly archive: {
      complete: {
        size: '2234888400'
        checksum: 'd4541e398b61cae48545a95e0fe5bb946d18fd497cd57892e8f8a311568ac8fe'
        osArch: 'x64'
      }
    }
    /** The additional properties. */
    readonly [key: string]: unknown
  }

  export namespace RemoteImageSDK {
    export interface Archive {
      complete: Archive.Complete
    }

    export namespace Archive {
      export interface Complete {
        size: string
        checksum: string
        osArch: string
      }
    }
  }

  export type OptionalRemoteImageSDK = Partial<RemoteImageSDK>

  export type OKResponse = RemoteImageSDK[]

  export interface ErrorResponse {
    /**
     * The error code.
     */
    readonly code: number
    /**
     * The error message.
     */
    readonly body: string
  }

  export type AxiosResponse = import('axios').AxiosResponse<OKResponse>
  export type AxiosError = import('axios').AxiosError<ErrorResponse>
  export type Result = AxiosResponse | AxiosError

  export function isOKResponse(result: Result): result is AxiosResponse {
    return 'data' in result && Array.isArray(result.data)
  }

  export class SDKListError extends Error {
    constructor(
      public readonly code: SDKListError.Code,
      public readonly message: string,
      public readonly cause?: AxiosError | AxiosResponse,
    ) {
      super(message)
    }
  }

  export namespace SDKListError {
    export enum Code {
      VALIDATION_ERROR = 400,
      REQUEST_ERROR = 500,
    }
  }
}
