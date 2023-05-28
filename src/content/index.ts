enum CaretType {
  Caret = 'Caret',
  Selection = 'Selection',
  None = 'None',
}
console.debug('TalkType content script loaded! 🚀🚀')

document.addEventListener('click', (event) => {
  // @ts-ignore - type does exist
  console.debug(`clicked on:`, event.target?.tagName)
  //   injectText('hello')
})

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

document.addEventListener('focus', (event) => {
  // @ts-ignore - type does exist
  console.debug(`focus on:`, event.target?.tagName)
  //   injectText('hello')
})
export {}
