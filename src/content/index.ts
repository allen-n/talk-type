import { messageKeys } from '../utils/messageKeys'
import AudioStreamManager from './AudioStreamManager'
import SocketManager from './SocketManager'
import TextManager from './TextManager'
import { DEEPGRAM_API_KEY } from '../secrets'
// TODO @allen-n: consider using the deepgram SDK instead of a websocket
if (!DEEPGRAM_API_KEY) {
  throw new Error('DEEPGRAM_API_KEY is not defined')
}

const audioStreamManager = new AudioStreamManager()

// Callbacks

const failedTextInjectionCallback = () => {
  alert(
    '⚠️ TalkType could not find a selection to inject text into. Please select a text input area and try again.',
  )
  audioStreamManager.closeAllAudioStreams()
}

const textManager = new TextManager(failedTextInjectionCallback)

const testCallback = async () => {
  for (let i = 0; i < 20; i++) {
    const isFinal = Math.round(i / 3) === i / 3
    textManager.handleTextUpdate(`Number is ${i}`, isFinal)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

const onMessageCallback = (message: MessageEvent) => {
  const received = JSON.parse(message.data)
  if (typeof received.channel === 'undefined') {
    console.debug('received.channel is undefined')
    return
  }
  const transcript = received.channel.alternatives[0].transcript
  if (transcript) {
    // textManager.handleSimpleTextUpdate(transcript, received.is_final)
    textManager.handleTextUpdate(transcript, received.is_final)
  }
  // console.debug({ transcript: transcript, is_final: received.is_final })
}

const socketManager = new SocketManager([], [onMessageCallback], [], [])

console.debug('TalkType content script loaded! 🚀🚀')

// Chrome Runtime listeners

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.debug('message received:', request)
  switch (request.type) {
    case messageKeys.askForMicrophoneAccess:
      const result = await audioStreamManager.getAudioStream(true)
      if (typeof result === null) {
        alert(
          "⚠️ TalkType can't hear you 🥲. You'll need to microphone access to this site manually in the browser to use the extension.",
        )
      } else {
        console.debug('Microphone access granted:', result)
      }
      // testCallback() // TODO @allen-n: remove this
      break
    case messageKeys.startRecording:
      const socket = await socketManager.openSocket(true)
      const streamingActive = await audioStreamManager.streamAudioToSocket(socket)
      if (!streamingActive) {
        console.warn('Could not start streaming audio to ASR endpoint')
      } else {
        console.debug('Streaming audio to ASR endpoint! 🎉')
      }
      break
    case messageKeys.stopRecording:
      audioStreamManager.closeAllAudioStreams()
      break
    default:
      console.warn('Unknown message type:', request.type)
      break
  }
})

// Event listeners
document.addEventListener('click', (event) => {
  // @ts-ignore - type does exist
  console.debug(`clicked on:`, event.target?.tagName)
  //   injectText('hello')
})

document.addEventListener('focus', (event) => {
  // @ts-ignore - type does exist
  console.debug(`focus on:`, event.target?.tagName)
  //   injectText('hello')
})
export {}
