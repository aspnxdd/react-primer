import {CheckIcon} from '@primer/octicons-react'
import React, {forwardRef, useContext, useRef} from 'react'
import styled, {css} from 'styled-components'
import {COMMON, get, SystemCommonProps} from '../constants'
import StyledOcticon from '../StyledOcticon'
import sx, {SxProp} from '../sx'
import {ForwardRefComponent} from '../utils/polymorphic'
import {MenuContext} from './SelectMenuContext'

export const listItemStyles = css`
  display: flex;
  align-items: center;
  padding: ${get('space.3')};
  overflow: hidden;
  text-align: left;
  cursor: pointer;
  background-color: ${get('colors.bg.overlay')};
  border: 0;
  border-bottom: ${get('borderWidths.1')} solid ${get('colors.selectMenu.borderSecondary')};
  color: ${get('colors.text.secondary')};
  text-decoration: none;
  font-size: ${get('fontSizes.0')};
  font-family: inherit; // needed if user uses a "button" tag
  width: 100%;

  &:hover {
    text-decoration: none;
  }
  &:focus {
    outline: none;
  }

  &[hidden] {
    display: none !important;
  }

  @media (min-width: ${get('breakpoints.0')}) {
    padding-top: ${get('space.2')};
    padding-bottom: ${get('space.2')};
  }

  .SelectMenu-icon {
    width: ${get('space.3')};
    margin-right: ${get('space.2')};
    flex-shrink: 0;
  }

  .SelectMenu-selected-icon {
    visibility: hidden;
    transition: transform 0.12s cubic-bezier(0.5, 0.1, 1, 0.5), visibility 0s 0.12s linear;
    transform: scale(0);
  }

  // selected items
  &[aria-checked='true'] {
    font-weight: 500;
    color: ${get('colors.text.primary')};

    .SelectMenu-selected-icon {
      visibility: visible;
      transition: transform 0.12s cubic-bezier(0, 0, 0.2, 1), visibility 0s linear;
      transform: scale(1);
    }
  }

  // can hover states
  @media (hover: hover) {
    body:not(.intent-mouse) .SelectMenu-item:focus,
    &:hover,
    &:active,
    &:focus {
      background-color: ${get('colors.state.hover.secondaryBg')};
    }
  }

  // Can not hover states
  //
  // For touch input

  @media (hover: none) {
    // Android
    &:focus,
    &:active {
      background-color: ${get('colors.bg.secondary')};
    }

    // iOS Safari
    // :active would work if ontouchstart is added to the button
    // Instead this tweaks the "native" highlight color
    -webkit-tap-highlight-color: ${get('colors.selectMenu.tapHighlight')};
  }
`

const styledItemDefaultElement = 'a'

type StyledItemProps = SystemCommonProps & SxProp

type StyledItemComponent = ForwardRefComponent<typeof styledItemDefaultElement, StyledItemProps>

const StyledItem = styled(styledItemDefaultElement)<StyledItemProps>`
  ${listItemStyles}
  ${COMMON}
  ${sx}
` as StyledItemComponent

const selectMenuItemDefaultElement = 'a'

export type SelectMenuItemProps = StyledItemProps & {
  selected?: boolean
}

type SelectMenuItemComponent = ForwardRefComponent<typeof selectMenuItemDefaultElement, SelectMenuItemProps>

const SelectMenuItem = forwardRef(
  ({as = selectMenuItemDefaultElement, children, selected = false, onClick, ...rest}, forwardedRef) => {
    const menuContext = useContext(MenuContext)
    const backupRef = useRef<HTMLAnchorElement>(null)
    const itemRef = forwardedRef ?? backupRef

    // close the menu when an item is clicked
    // this can be overriden if the user provides a `onClick` prop and prevents default in it
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      onClick && onClick(e)

      if (!e.defaultPrevented) {
        menuContext.setOpen?.(false)
      }
    }

    return (
      <StyledItem as={as} ref={itemRef} role="menuitemcheckbox" {...rest} onClick={handleClick} aria-checked={selected}>
        <StyledOcticon className="SelectMenu-icon SelectMenu-selected-icon" icon={CheckIcon} />
        {children}
      </StyledItem>
    )
  }
) as SelectMenuItemComponent

SelectMenuItem.displayName = 'SelectMenu.Item'

export default SelectMenuItem
