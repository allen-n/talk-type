export default class AudioStreamManager {
  private activeAudioStreams: Array<MediaStream> = []
  private activeMediaRecorders: Array<MediaRecorder> = []

  constructor() {
    console.debug('AudioStreamManager instantiated')
  }

  private closeAudioStream = (stream: MediaStream) => {
    stream.getTracks().forEach((track) => track.stop())
  }

  closeAllAudioStreams = () => {
    // Stop all active media recorders and streams, must stop media recorders first because they are consuming the streams
    this.activeMediaRecorders.forEach((recorder) => recorder.stop())
    this.activeAudioStreams.forEach((stream) => this.closeAudioStream(stream))
    // Then clear the arrays so the streams and recorders can get garbage collected
    this.activeMediaRecorders.length = 0
    this.activeAudioStreams.length = 0
  }

  /**
   *
   * @param autoClose if true, closes the audio stream immediately after getting it (i.e. for getting mic access). Defaults to `false`.
   * @returns Returns true if microphone access was granted, false otherwise
   */
  getAudioStream = async (autoClose: boolean = false): Promise<MediaStream | null> => {
    // Request media stream
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (audioStream) {
        // Microphone access granted, do something with the stream
        if (autoClose) {
          console.debug('Microphone access acquired! Closing stream immediately.')
          this.closeAudioStream(audioStream)
        } else {
          this.activeAudioStreams.push(audioStream)
        }
      }
      return audioStream
    } catch (error) {
      console.error('Error getting microphone access', error)
      return null
    }
  }

  /**
   *
   * @param socket The socket to stream audio to
   * @returns true if successful, false otherwise
   */
  streamAudioToSocket = async (socket: WebSocket): Promise<boolean> => {
    //   see https://blog.deepgram.com/live-transcription-mic-browser/
    const stream = await this.getAudioStream()
    if (stream) {
      var recorder = new MediaRecorder(stream)
      recorder.ondataavailable = async (event) => {
        if (event.data.size > 0 && socket.readyState == socket.OPEN) {
          // Debug here to see if data is being sent
          socket.send(event.data)
        } else {
          console.warn('Socket not ready or there was no data, state was', socket.readyState)
        }
      }
      recorder.start(100) // 100-250 ms chunks or smaller work best for deepgram
      this.activeMediaRecorders.push(recorder)
      return true
    } else {
      console.warn('Could not get audio stream')
      return false
    }
  }
}
