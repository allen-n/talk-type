import { DEEPGRAM_API_KEY } from '../secrets'
// TODO @allen-n: consider using the deepgram SDK instead of a websocket
if (!DEEPGRAM_API_KEY) {
  throw new Error('DEEPGRAM_API_KEY is not defined')
}

export default class SocketManager {
  onopenCallbacks: Iterable<() => void> = []
  onmessageCallbacks: Iterable<(message: MessageEvent) => void> = []
  oncloseCallbacks: Iterable<(event: CloseEvent) => void> = []
  onerrorCallbacks: Iterable<(error: Event) => void> = []

  constructor(
    onopenCallbacks: Iterable<() => void> = [],
    onmessageCallbacks: Iterable<(message: MessageEvent) => void> = [],
    oncloseCallbacks: Iterable<(event: CloseEvent) => void> = [],
    onerrorCallbacks: Iterable<(error: Event) => void> = [],
  ) {
    console.debug('SocketManager constructor fired')
    this.onopenCallbacks = onopenCallbacks
    this.onmessageCallbacks = onmessageCallbacks
    this.oncloseCallbacks = oncloseCallbacks
    this.onerrorCallbacks = onerrorCallbacks
  }

  /**
   *
   * @param waitUntilReady if true, will wait until the socket is ready before returning the promise. Else returns right away and is on the caller to wait until the socket is open.
   * @returns
   */
  openSocket = async (waitUntilReady: boolean = true): Promise<WebSocket> => {
    console.debug('opening new socket')
    const config = {
      language: 'en-US',
      smart_format: 'true',
      punctuate: 'true',
      interim_results: 'true',
      model: 'nova',
    }
    const url = `wss://api.deepgram.com/v1/listen?${new URLSearchParams(config)}`
    const socket = new WebSocket(url, ['token', DEEPGRAM_API_KEY])
    socket.onopen = () => {
      console.debug({ event: 'onopen' })
      for (const callback of this.onopenCallbacks) {
        callback()
      }
    }

    socket.onmessage = (message) => {
      console.debug({ event: 'onmessage', message })
      for (const callback of this.onmessageCallbacks) {
        callback(message)
      }
    }

    socket.onclose = (event) => {
      console.debug({ eventName: 'onclose', event })
      for (const callback of this.oncloseCallbacks) {
        callback(event)
      }
    }

    socket.onerror = (error) => {
      console.debug({ event: 'onerror', error })
      for (const callback of this.onerrorCallbacks) {
        callback(error)
      }
    }
    if (waitUntilReady) {
      while (socket.readyState !== socket.OPEN) {
        console.debug('Socket not ready, waiting...')
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
    }
    return socket
  }
}
