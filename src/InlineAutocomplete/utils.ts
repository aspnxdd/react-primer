import getCaretCoordinates from '@koddsson/textarea-caret'
import {Children, EventHandler, SyntheticEvent} from 'react'

import {Coordinates, ShowSuggestionsEvent, Suggestion, TextInputCompatibleChild, Trigger} from './types'

const singleWordTriggerTerminators = new Set([' ', '\n'])
const multiWordTriggerTerminators = new Set(['.', '\n'])

const isWhitespace = (char: string) => /\s/.test(char)

/**
 * Calculate whether or not suggestions should be shown based on the given state of the
 * input. If they should be shown, returns the show event.
 */
export const calculateSuggestionsQuery = (
  triggers: Array<Trigger>,
  text: string,
  caretLocation: number
): ShowSuggestionsEvent | null => {
  // Build backwards from the caret location until the most recent expansion key or terminator
  for (
    let i = caretLocation - 1, query = '', potentialTriggers = triggers;
    i >= 0 && potentialTriggers.length > 0;
    i--
  ) {
    const character = text[i]

    if (singleWordTriggerTerminators.has(character)) potentialTriggers = potentialTriggers.filter(t => t.multiWord)
    if (multiWordTriggerTerminators.has(character)) potentialTriggers = potentialTriggers.filter(t => !t.multiWord)

    for (const trigger of potentialTriggers.filter(t => character === t.triggerChar)) {
      // Trigger chars must always be preceded by whitespace or be the first character, and the query cannot start with whitespace
      if ((i === 0 || isWhitespace(text[i - 1])) && !isWhitespace(query[0])) return {trigger, query}

      potentialTriggers = potentialTriggers.filter(t => t !== trigger)
    }

    query = character + query
  }

  return null
}

/**
 * Obtain the coordinates (px) of the bottom left of a character in an input, relative to the
 * textarea itself.
 * @param input The target `<textarea>` element.
 * @param index The index of the character to calculate for.
 * @param adjustForScroll Control whether the returned value is adjusted based on scroll position.
 */
export const getCharacterCoordinates = (
  input: HTMLTextAreaElement | HTMLInputElement | null,
  index: number,
  adjustForScroll = true
): Coordinates => {
  if (!input) return {top: 0, left: 0}

  // word-wrap:break-word breaks the getCaretCoordinates calculations, and word-wrap has
  // no effect on input element anyway
  if (input instanceof HTMLInputElement) input.style.wordWrap = ''

  let coords = getCaretCoordinates(input, index)

  // For autosizing inputs, the new character can be accidentally wrapped even with the
  // wordWrap override above. If this happens, go back to the last usable index.
  let adjustedIndex = index
  while (input instanceof HTMLInputElement && coords.top > coords.height) {
    coords = getCaretCoordinates(input, --adjustedIndex)
  }

  const scrollTopOffset = adjustForScroll ? -input.scrollTop : 0
  const scrollLeftOffset = adjustForScroll ? -input.scrollLeft : 0

  return {top: coords.top + coords.height + scrollTopOffset, left: coords.left + scrollLeftOffset}
}

/**
 * Obtain the coordinates of the bottom left of a character in an input relative to the top-left
 * of the page.
 */
export const getAbsoluteCharacterCoordinates = (
  input: HTMLTextAreaElement | HTMLInputElement | null,
  index: number
): Coordinates => {
  const {top: relativeTop, left: relativeLeft} = getCharacterCoordinates(input, index, true)
  const {top: viewportOffsetTop, left: viewportOffsetLeft} = input?.getBoundingClientRect() ?? {top: 0, left: 0}

  return {
    top: viewportOffsetTop + relativeTop,
    left: viewportOffsetLeft + relativeLeft
  }
}

export const getSuggestionValue = (suggestion: Suggestion): string =>
  typeof suggestion === 'string' ? suggestion : suggestion.value

export const getSuggestionKey = (suggestion: Suggestion): string =>
  typeof suggestion === 'string' ? suggestion : suggestion.key ?? suggestion.value

/**
 * Replace a section of a string.
 */
export const replaceSlice = (
  original: string,
  [startInclusive, endExclusive]: [number, number],
  replacement: string
) => {
  const before = original.substring(0, startInclusive)
  const after = original.substring(endExclusive)
  return before + replacement + after
}

/**
 * Attempts to assert that the child element is of a supported type. This can't be enforced
 * by the type system so it has to be done as a runtime check. This isn't foolproof - a
 * component that forwards a ref to a correct element but does not forward event handlers
 * will not work. But it's the best we can do.
 */
export function requireChildrenToBeInput(
  child: React.ReactElement,
  childRef: React.RefObject<HTMLElement>
): TextInputCompatibleChild {
  Children.only(child) // Assert that the child is lonely
  if (
    // There is no way to know what type the underlying child is until it mounts, so this
    // will always pass on first render
    childRef.current &&
    !(childRef.current instanceof HTMLInputElement) &&
    !(childRef.current instanceof HTMLTextAreaElement)
  ) {
    throw new TypeError(
      `AutocompleteTextarea child must be a component that forwards a ref and props to an <input> or <textarea> element.`
    )
  }
  return child
}

/**
 * Combine several event handlers into one. The last handler in the list is called first
 * and no further handlers will be called if the `event.preventDefault()` is called.
 */
export const augmentHandler =
  <E extends SyntheticEvent>(...handlers: Array<EventHandler<E> | undefined>) =>
  (event: E) => {
    for (const handler of [...handlers].reverse()) {
      if (!event.defaultPrevented) handler?.(event)
    }
  }
