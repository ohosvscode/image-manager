export class RemoteImageRequestError<T = unknown> extends Error {
  constructor(
    public readonly message: string,
    public readonly code: number,
    public readonly cause?: T,
  ) {
    super(message, { cause })
  }
}
