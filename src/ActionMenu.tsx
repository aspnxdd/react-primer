import {List, ListPropsBase, GroupedListProps} from './ActionList/List'
import {Item, ItemProps} from './ActionList/Item'
import {Divider} from './ActionList/Divider'
import Button, {ButtonProps} from './Button'
import React, {useCallback, useRef, useState} from 'react'
import Overlay from './Overlay'
import getRandomValues from 'get-random-values'

export interface ActionMenuProps extends Partial<Omit<GroupedListProps, keyof ListPropsBase>>, ListPropsBase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderAnchor?: (props: any) => JSX.Element
  triggerContent?: React.ReactNode
  onActivate?: (props: ItemProps) => void
}

const ActionMenuItem = (props: ItemProps) => <Item role="menuitem" {...props} />

ActionMenuItem.displayName = 'ActionMenu.Item'

const ActionMenuBase = ({
  triggerContent,
  renderAnchor = <T extends ButtonProps>(props: T) => <Button {...props}>{triggerContent}</Button>,
  renderItem = Item,
  onActivate,
  ...listProps
}: ActionMenuProps): JSX.Element => {
  const anchorRef = useRef<HTMLElement>(null)
  const anchorId = `actionMenuAnchor-${getRandomValues(new Uint8Array(4)).join('')}`
  const [open, setOpen] = useState<boolean>(false)
  const onDismiss = useCallback(() => setOpen(false), [setOpen])
  const onToggle = useCallback(() => setOpen(!open), [setOpen, open])
  return (
    <>
      {renderAnchor({
        ref: anchorRef,
        id: anchorId,
        'aria-labelledby': anchorId,
        'aria-haspopup': 'listbox',
        'aria-label': 'menu',
        onClick: onToggle,
        children: triggerContent,
        tabIndex: 0
      })}
      {open && (
        <Overlay anchorRef={anchorRef} returnFocusRef={anchorRef} onClickOutside={onDismiss} onEscape={onDismiss}>
          <List
            {...listProps}
            role="menu"
            renderItem={({onClick, ...itemProps}) =>
              renderItem({
                ...itemProps,
                role: 'menuitem',
                onKeyPress: event => {
                  if (event.key == 'Enter' || event.key == 'Space') {
                    onActivate && onActivate(itemProps as ItemProps)
                    setOpen(false)
                  }
                },
                onClick: event => {
                  onActivate && onActivate(itemProps as ItemProps)
                  onClick && onClick(event)
                  setOpen(false)
                }
              })
            }
          />
        </Overlay>
      )}
    </>
  )
}

ActionMenuBase.displayName = 'ActionMenu'

export const ActionMenu = Object.assign(ActionMenuBase, {Divider: Divider, Item: ActionMenuItem})
