enum CaretType {
  Caret = 'Caret',
  Selection = 'Selection',
  None = 'None',
}

export default class TextInjector {
  focusNode: Node | null = null
  focusOffset: number | null = null
  injectingFinalText: boolean = false
  failedInjectionCallback: (err: string) => void = () => {}

  /**
   *
   * @param failedInjectionCallback A callback to be called when injection fails, with the error message
   */
  constructor(failedInjectionCallback: (err: string) => void = () => {}) {
    this.failedInjectionCallback = failedInjectionCallback
  }

  private injectTemporaryText = (text: string, selection: Selection): void => {
    if (this.focusNode === null || this.focusOffset === null) {
      //   First call to this inject text
      console.debug('focusNode or focusOffset is null')
      this.focusNode = selection.focusNode
      this.focusOffset = selection.focusOffset
    } else {
      selection.setPosition(this.focusNode, this.focusOffset)
    }
    // TODO @allen-n: Keep working on this to move the caret to the right place, untested
    document.execCommand('insertText', false, text)
  }
  private injectFinalText = (text: string, selection: Selection): void => {
    if (this.focusNode !== null && this.focusOffset !== null) {
      selection.setPosition(this.focusNode, this.focusOffset)
    }
    text = text.trim()
    text += ' '
    document.execCommand('insertText', false, text)
    // Reset the cursor position
    this.focusNode = null
    this.focusOffset = null
  }

  resetCursor = (): void => {
    this.focusNode = null
    this.focusOffset = null
  }
  /**
   * Inject text into the current selection
   *
   * @param text The text to append to the current selection
   * @returns the current selection, if it exists
   */
  injectText = (text: string, isTextFinal: boolean = true): Selection | null => {
    const selection = document.getSelection()

    if (!!selection) {
      if (selection.type == CaretType.Caret) {
        console.debug('selection is a caret')
        if (isTextFinal) {
          this.injectFinalText(text, selection)
        } else {
          this.injectTemporaryText(text, selection)
        }
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
    this.failedInjectionCallback('Failed to inject text: No selection found.')
    // alert(
    //   '⚠️ TalkType could not find a selection to inject text into. Please select a text input area and try again.',
    // )
    // audioStreamManager.closeAllAudioStreams()
    return null
  }
}
