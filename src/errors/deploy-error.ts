export class DeployError extends Error {
  constructor(
    public readonly code: DeployError.Code,
    public readonly message: string,
    public readonly cause?: Error,
  ) {
    super(message, { cause })
  }
}

export namespace DeployError {
  export enum Code {
    DEVICE_ALREADY_DEPLOYED = 'DEVICE_ALREADY_DEPLOYED',
    LIST_JSON_NOT_AN_ARRAY = 'LIST_JSON_NOT_AN_ARRAY',
    CATCHED_ERROR = 'CATCHED_ERROR',
    MAYBE_OPENED_DEVICE_MANAGER_IN_DEVECO_STUDIO = 'MAYBE_OPENED_DEVICE_MANAGER_IN_DEVECO_STUDIO',
    SYMLINK_SDK_PATH_EXISTS = 'SYMLINK_SDK_PATH_EXISTS',
  }
}
