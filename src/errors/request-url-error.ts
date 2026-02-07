export class RequestUrlError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: number,
    public readonly cause?: Error,
  ) {
    super(message, { cause })
  }
}
