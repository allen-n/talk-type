enum CaretType {
  Caret = 'Caret',
  Selection = 'Selection',
  None = 'None',
}

export default class TextManager {
  private startTempOffset: number | null = null
  private failedInjectionCallback: (err: string) => void = () => {}

  /**
   *
   * @param failedInjectionCallback A callback to be called when injection fails, with the error message
   */
  constructor(failedInjectionCallback: (err: string) => void = () => {}) {
    this.failedInjectionCallback = failedInjectionCallback
  }

  private injectText = (text: string, selection: Selection, isFinal: boolean): void => {
    if (selection.anchorNode === null) {
      //   First call to this inject text
      console.warn('selection anchor node is null')
      this.failedInjectionCallback('TalkType Error: Invalid selection')
      return
    }
    if (this.startTempOffset === null) {
      this.startTempOffset = selection.focusOffset
    } else {
      console.warn('deleting!')
      console.info({ focusNode: selection.focusNode, selection: selection })
      selection.setBaseAndExtent(
        selection.anchorNode,
        this.startTempOffset,
        selection.anchorNode,
        selection.focusOffset,
      )
      document.execCommand('delete', false)
    }
    if (isFinal) {
      text = text.trim()
      text += ' '
    }
    console.debug({ startOffset: this.startTempOffset })
    document.execCommand('insertText', false, text)
    if (isFinal) {
      this.resetCursor()
    }
  }

  private resetCursor = (): void => {
    this.startTempOffset = null
  }
  /**
   * Inject text into the current selection
   *
   * @param text The text to append to the current selection
   * @returns the current selection, if it exists
   */
  handleTextUpdate = (text: string, isTextFinal: boolean = true): Selection | null => {
    const selection = document.getSelection()

    if (!!selection) {
      if (selection.type == CaretType.Caret) {
        console.debug('selection is a caret')
        this.injectText(text, selection, isTextFinal)
      } else if (selection.type === CaretType.Selection) {
        console.debug('selection is a selection')
      } else if (selection.type === CaretType.None) {
        console.debug('selection is none')
      } else {
        console.warn('selection is not a caret, selection, or none')
      }
      return selection
    }
    console.warn('TalkType Error: selection does not exist')
    this.failedInjectionCallback('Failed to inject text: No selection found.')

    return null
  }
}
