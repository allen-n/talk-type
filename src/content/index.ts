import { messageKeys } from '../utils/messageKeys'
import { DEEPGRAM_API_KEY } from '../secrets'
import AudioStreamManager from './AudioStreamManager'

if (!DEEPGRAM_API_KEY) {
  throw new Error('DEEPGRAM_API_KEY is not defined')
}

enum CaretType {
  Caret = 'Caret',
  Selection = 'Selection',
  None = 'None',
}
const audioStreamManager = new AudioStreamManager()

const openSocket = (): WebSocket => {
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
  }

  socket.onmessage = (message) => {
    console.debug({ event: 'onmessage', message })
    const received = JSON.parse(message.data)
    const transcript = received.channel.alternatives[0].transcript
    console.debug(transcript)
    if (transcript && received.is_final) {
      console.info(transcript)
      injectText(transcript)
    }
  }

  socket.onclose = (event) => {
    console.debug({ eventName: 'onclose', event })
  }

  socket.onerror = (error) => {
    console.debug({ event: 'onerror', error })
  }
  return socket
}

const handleInvalidSelection = () => {
  alert(
    '⚠️ TalkType could not find a selection to inject text into. Please select a text input area and try again.',
  )
}

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
  handleInvalidSelection()
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
      const socket = openSocket()
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
