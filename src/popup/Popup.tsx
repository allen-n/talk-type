import React, { useState } from 'react'
import { messageKeys } from '../utils/messageKeys'
import './Popup.css'

const sendMessage = (message: messageKeys) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0]
    if (activeTab) {
      chrome.tabs.sendMessage(activeTab.id!, { type: message })
    }
  })
}

const requestContentScriptMicAccess = () => {
  sendMessage(messageKeys.askForMicrophoneAccess)
}
const startStreamingAudio = () => {
  sendMessage(messageKeys.startRecording)
}
const stopStreamingAudio = () => {
  sendMessage(messageKeys.stopRecording)
}

function App() {
  const [crx, setCrx] = useState('create-chrome-ext')

  return (
    <main>
      <h3>Popup Page!</h3>

      <h6>v 0.0.0</h6>

      <a href="https://www.npmjs.com/package/create-chrome-ext" target="_blank" rel="noopener">
        Power by {crx}
      </a>
      <button onClick={requestContentScriptMicAccess}>Grant Mic Access</button>
      <button onClick={startStreamingAudio}>Start Transcribing!</button>
      <button onClick={stopStreamingAudio}>Stop Transcribing!</button>
    </main>
  )
}

export default App
