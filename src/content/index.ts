import { messageKeys } from '../utils/messageKeys'

enum CaretType {
  Caret = 'Caret',
  Selection = 'Selection',
  None = 'None',
}

/**
 * Inject text into the current selection
 *
 * @param text The text to append to the current selection
 * @returns the current selection, if it exists
 */
const injectText = (text: string): Selection | null => {
  const selection = document.getSelection()
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
  return null
}

/**
 *
 * @returns Returns true if microphone access was granted, false otherwise
 */
const requestMediaAccess = async (): Promise<boolean> => {
  // Request media stream
  try {
    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    if (audioStream) {
      // Microphone access granted, do something with the stream
      console.debug('Microphone access granted')
      audioStream.getTracks().forEach((track) => track.stop())
      return true
    }
    return false
  } catch (error) {
    console.error('Error getting microphone access', error)
    return false
  }
}

console.debug('TalkType content script loaded! 🚀🚀')

// Chrome Runtime listeners
chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  console.debug('message received:', request)
  if (request.type === messageKeys.askForMicrophoneAccess) {
    const result = await requestMediaAccess()
    if (!result) {
      alert("Microphone access was not granted. You'll need to grant it to use the extension.")
    }
    console.debug('Microphone access granted:', result)
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
