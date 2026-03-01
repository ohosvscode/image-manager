export type BaseSerializable<T extends Record<PropertyKey, any>> = {
  [K in keyof T as K extends `get${infer GetterName}`
    ? T[K] extends () => infer R
      ? R extends Promise<any>
        ? never
        : Uncapitalize<GetterName>
      : never
    : never]: K extends `get${string}`
    ? T[K] extends () => infer R
      ? R extends Promise<any>
        ? never
        : R extends Serializable<infer R2> // return a serializable object, infer the real value in the serializable
          ? R2
          : R extends Array<Serializable<infer R2>> // return an array of serializable objects, infer the real value in the array
            ? R2[]
            : R
      : never
    : never
}

/**
 * A serializable object.
 */
export interface Serializable<T extends BaseSerializable<T>> {
  /**
   * Serialize the object to a JSON object.
   */
  toJSON(): T
}

export type DeepPartial<T extends Record<PropertyKey, any>> = {
  [K in keyof T]?: T[K] extends Record<PropertyKey, any>
    ? DeepPartial<T[K]>
    : T[K]
}
