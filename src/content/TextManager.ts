// TODO @allen-n: Consider storing transcribed text in chrome storage too in case injection fails
enum CaretType {
  Caret = 'Caret',
  Selection = 'Selection',
  None = 'None',
}
enum PasteType {
  PlainText = 'text/plain',
  HTML = 'text/html',
}

/**
 * A class to manage text injection into the DOM
 */
export default class TextManager {
  private startTempOffset: number | null = null
  private failedInjectionCallback: (err: string) => void = () => {}
  private dataTransfer: DataTransfer

  /**
   *
   * @param failedInjectionCallback A callback to be called when injection fails, with the error message
   */
  constructor(failedInjectionCallback: (err: string) => void = () => {}) {
    this.failedInjectionCallback = failedInjectionCallback
    this.dataTransfer = new DataTransfer()
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
   *
   * @param target The target element to dispatch the paste event to
   * @param text The text to paste
   * @param type The type of paste to perform
   */
  private dispatchPaste = (
    target: Element,
    text: string,
    type: PasteType = PasteType.PlainText,
  ) => {
    // this may be 'text/html' if it's required
    console.debug("Data transfer's types: ", this.dataTransfer)
    this.dataTransfer.setData('text/plain', text)

    target.dispatchEvent(
      new ClipboardEvent('paste', {
        clipboardData: this.dataTransfer,

        // need these for the event to reach Draft paste handler
        bubbles: true,
        cancelable: true,
      }),
    )

    // clear DataTransfer Data
    this.dataTransfer.clearData()
  }

  /**
   *
   * @param text The text to inject at the current cursor position
   * @param isTextFinal
   */
  handleSimpleTextUpdate = (text: string, isTextFinal: boolean): void => {
    console.debug('handleSimpleTextUpdate called', text)
    if (text === '' || text === ' ' || !document.activeElement) {
      return
    }
    if (isTextFinal) {
      text = text.trim()
      // document.execCommand('insertText', false, text + ' ')
      this.dispatchPaste(document.activeElement, text + ' ')
    }
  }
  /**
   * Inject text into the current selection, including partial updates on partial results
   *
   * @param text The text to append to the current selection
   * @param isTextFinal Whether the text is final or not (i.e. a temporary transcript that will be updated later)
   * @returns the current selection, if it exists
   */
  handleTextUpdate = (text: string, isTextFinal: boolean): Selection | null => {
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
