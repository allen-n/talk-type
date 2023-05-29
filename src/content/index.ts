import { messageKeys } from '../utils/messageKeys'
import AudioStreamManager from './AudioStreamManager'
import SocketManager from './SocketManager'
import { DEEPGRAM_API_KEY } from '../secrets'
// TODO @allen-n: consider using the deepgram SDK instead of a websocket
if (!DEEPGRAM_API_KEY) {
  throw new Error('DEEPGRAM_API_KEY is not defined')
}

enum CaretType {
  Caret = 'Caret',
  Selection = 'Selection',
  None = 'None',
}
const audioStreamManager = new AudioStreamManager()

const onMessageCallback = (message: MessageEvent) => {
  const received = JSON.parse(message.data)
  if (typeof received.channel === 'undefined') {
    console.debug('received.channel is undefined')
    return
  }
  const transcript = received.channel.alternatives[0].transcript
  console.debug(transcript)
  if (transcript && received.is_final) {
    console.info(transcript)
    injectText(transcript)
  }
}

const socketManager = new SocketManager([], [onMessageCallback], [], [])

/**
 * Inject text into the current selection
 *
 * @param text The text to append to the current selection
 * @returns the current selection, if it exists
 */
const injectText = (text: string): Selection | null => {
  const selection = document.getSelection()
  text = text.trim()
  text += ' '
  if (!!selection) {
    if (selection.type == CaretType.Caret) {
      console.debug('selection is a caret')
      document.execCommand('insertText', false, text)
    } else if (selection.type === CaretType.Selection) {
      console.debug('selection is a selection')
    } else if (selection.type === CaretType.None) {
      console.debug('selection is none')
    } else {
      console.warn('selection is not a caret, selection, or none')
    }
    return selection
  }
  console.warn('selection does not exist')
  alert(
    '⚠️ TalkType could not find a selection to inject text into. Please select a text input area and try again.',
  )
  audioStreamManager.closeAllAudioStreams()
  return null
}

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
