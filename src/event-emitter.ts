import type { Disposable } from 'vscode-fs'

/**
 * Represents a typed event.
 *
 * A function that represents an event to which you subscribe by calling it with
 * a listener function as argument.
 *
 * @example
 * item.onDidChange(function(event) { console.log("Event happened: " + event); });
 */
export interface Event<T> {

  /**
   * A function that represents an event to which you subscribe by calling it with
   * a listener function as argument.
   *
   * @param listener The listener function will be called when the event happens.
   * @param thisArgs The `this`-argument which will be used when calling the event listener.
   * @param disposables An array to which a {@link Disposable} will be added.
   * @returns A disposable which unsubscribes the event listener.
   */
  (listener: (e: T) => any, thisArgs?: any, disposables?: Disposable[]): Disposable
}

export class EventEmitter<T> implements Disposable {
  private _listeners: [listener: (e: T) => any, thisArgs?: any, disposables?: Disposable[]][] = []

  /**
   * The event listeners can subscribe to.
   */
  event: Event<T> = (listener: (e: T) => any, thisArgs?: any, disposables?: Disposable[]) => {
    this._listeners.push([listener, thisArgs, disposables])

    return {
      dispose: () => {
        this._listeners = this._listeners.filter(l => l[0] !== listener && l[1] !== thisArgs && l[2] !== disposables)
        disposables?.forEach(disposable => disposable.dispose())
      },
    }
  }

  /**
   * Notify all subscribers of the {@link EventEmitter.event event}. Failure
   * of one or more listener will not fail this function call.
   *
   * @param data The event object.
   */
  fire(data: T): void {
    this._listeners.forEach((listener) => {
      if (listener[1] !== undefined) listener[1].call(listener[2], data)
      else listener[0](data)
    })
  }

  /**
   * Dispose this object and free resources.
   */
  dispose(): void {
    this._listeners.forEach(listener => listener[2]?.forEach(disposable => disposable.dispose()))
    this._listeners = []
  }
}
