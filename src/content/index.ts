import { messageKeys } from '../utils/messageKeys'
import { DEEPGRAM_API_KEY } from '../secrets'

if (!DEEPGRAM_API_KEY) {
  throw new Error('DEEPGRAM_API_KEY is not defined')
}

enum CaretType {
  Caret = 'Caret',
  Selection = 'Selection',
  None = 'None',
}

var scriptAudioStream: MediaStream | null = null

const openSocket = (): WebSocket => {
  console.debug('opening new socket')
  const socket = new WebSocket('wss://api.deepgram.com/v1/listen', ['token', DEEPGRAM_API_KEY])
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

  socket.onclose = () => {
    console.debug({ event: 'onclose' })
  }

  socket.onerror = (error) => {
    console.debug({ event: 'onerror', error })
  }
  return socket
}

var scriptSocket: WebSocket = openSocket()

const handleInvalidSelection = () => {
  alert(
    '⚠️ TalkType could not find a selection to inject text into. Please select a text input area and try again.',
  )
  if (scriptAudioStream !== null) {
    closeAudioStream(scriptAudioStream)
  }
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

const closeAudioStream = (stream: MediaStream) => {
  stream.getTracks().forEach((track) => track.stop())
}

/**
 *
 * @param autoClose if true, closes the audio stream immediately after getting it (i.e. for getting mic access). Defaults to `false`.
 * @returns Returns true if microphone access was granted, false otherwise
 */
const getAudioStream = async (autoClose: boolean = false): Promise<MediaStream | null> => {
  // Request media stream
  if (scriptAudioStream !== null) {
    return scriptAudioStream
  }
  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    if (audioStream) {
      // Microphone access granted, do something with the stream
      console.debug('Microphone access granted')
      if (autoClose) {
        closeAudioStream(audioStream)
      } else {
        scriptAudioStream = audioStream
      }
    }
    return audioStream
  } catch (error) {
    console.error('Error getting microphone access', error)
    scriptAudioStream = null
    return scriptAudioStream
  }
}

const streamAudioToASR = async () => {
  //   see https://blog.deepgram.com/live-transcription-mic-browser/
  const stream = await getAudioStream()
  if (stream) {
    var recorder = new MediaRecorder(stream)
    recorder.ondataavailable = (event) => {
      if (
        scriptSocket.readyState === scriptSocket.CLOSING ||
        scriptSocket.readyState === scriptSocket.CLOSED
      ) {
        scriptSocket = openSocket()
      }
      const socket = scriptSocket
      if (event.data.size > 0 && socket.readyState == 1) {
        socket.send(event.data)
      } else {
        console.warn('Socket not ready or there was no data, state was', socket.readyState)
      }
    }
    recorder.start(100) // 100-250 ms chunks or smaller work best for deepgram
  }
}

console.debug('TalkType content script loaded! 🚀🚀')

// Chrome Runtime listeners

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.debug('message received:', request)
  switch (request.type) {
    case messageKeys.askForMicrophoneAccess:
      const result = await getAudioStream(true)
      if (typeof result === null) {
        alert(
          "⚠️ TalkType can't hear you 🥲. You'll need to microphone access to this site manually in the browser to use the extension.",
        )
      } else {
        console.debug('Microphone access granted:', result)
      }
      break
    case messageKeys.startRecording:
      await streamAudioToASR()
      break
    case messageKeys.stopRecording:
      if (scriptAudioStream) {
        closeAudioStream(scriptAudioStream)
      }
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
