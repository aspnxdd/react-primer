import {isMacOS} from '@primer/behaviors/dist/esm/utils'
import {fireEvent, render, screen} from '@testing-library/react'
import {renderHook} from '@testing-library/react-hooks'
import userEvent from '@testing-library/user-event'
import {useIgnoreKeyboardActionsWhileComposing} from '../../hooks/useIgnoreKeyboardActionsWhileComposing'

jest.mock('@primer/behaviors/dist/esm/utils')

describe('useIgnoreKeyboardActionsWhileComposing', () => {
  beforeEach(() => {
    ;(isMacOS as jest.Mock).mockReturnValue(false)
  })

  it('should allow typing when no composition occurs', async () => {
    const onKeyDown = jest.fn()
    const {result} = renderHook(() => useIgnoreKeyboardActionsWhileComposing(onKeyDown))

    render(<textarea {...result.current} />)

    const textarea = screen.getByRole('textbox')
    await userEvent.type(textarea, 'ime composition')

    expect(screen.getByRole('textbox')).toHaveValue('ime composition')
  })

  it('should allow typing when composition occurs', async () => {
    const onKeyDown = jest.fn()
    const {result} = renderHook(() => useIgnoreKeyboardActionsWhileComposing(onKeyDown))

    render(<textarea {...result.current} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.compositionStart(textarea)
    await userEvent.type(textarea, 'ime composition')
    fireEvent.compositionEnd(textarea)

    expect(screen.getByRole('textbox')).toHaveValue('ime composition')
  })

  it('should ignore unprintable `229` keydown event typing after composition end on macOS', async () => {
    ;(isMacOS as jest.Mock).mockReturnValue(true)
    const onKeyDown = jest.fn()
    const {result} = renderHook(() => useIgnoreKeyboardActionsWhileComposing(onKeyDown))

    render(<textarea {...result.current} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.compositionStart(textarea)
    await userEvent.type(textarea, 'ime composition')
    fireEvent.compositionEnd(textarea)
    onKeyDown.mockReset()
    fireEvent.keyDown(textarea, {keyCode: 229})

    expect(screen.getByRole('textbox')).toHaveValue('ime composition')
    expect(onKeyDown).not.toHaveBeenCalled()
  })

  it('should not ignore unprintable `229` keydown event typing after composition ends not on macOS', async () => {
    const onKeyDown = jest.fn()
    const {result} = renderHook(() => useIgnoreKeyboardActionsWhileComposing(onKeyDown))

    render(<textarea {...result.current} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.compositionStart(textarea)
    await userEvent.type(textarea, 'ime composition')
    fireEvent.compositionEnd(textarea)
    onKeyDown.mockReset()
    fireEvent.keyDown(textarea, {keyCode: 229})

    expect(screen.getByRole('textbox')).toHaveValue('ime composition')
    expect(onKeyDown).toHaveBeenCalled()
  })

  it('should not ignore unprintable `229` keydown event typing before composition ends not on macOS', async () => {
    const onKeyDown = jest.fn()
    const {result} = renderHook(() => useIgnoreKeyboardActionsWhileComposing(onKeyDown))

    render(<textarea {...result.current} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.compositionStart(textarea)
    await userEvent.type(textarea, 'ime composition')
    onKeyDown.mockReset()
    fireEvent.keyDown(textarea, {keyCode: 229})
    fireEvent.compositionEnd(textarea)

    expect(screen.getByRole('textbox')).toHaveValue('ime composition')
    expect(onKeyDown).toHaveBeenCalled()
  })

  it('should ignore Enter keydown event before composition ends', async () => {
    const onKeyDown = jest.fn()
    const {result} = renderHook(() => useIgnoreKeyboardActionsWhileComposing(onKeyDown))

    render(<textarea {...result.current} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.compositionStart(textarea)
    await userEvent.type(textarea, 'ime composition')
    onKeyDown.mockReset()
    await userEvent.type(textarea, '{enter}')

    expect(onKeyDown).not.toHaveBeenCalled()
  })

  it('should not ignore Enter keydown event after composition ends', async () => {
    const onKeyDown = jest.fn()
    const {result} = renderHook(() => useIgnoreKeyboardActionsWhileComposing(onKeyDown))

    render(<textarea {...result.current} />)

    const textarea = screen.getByRole('textbox')
    fireEvent.compositionStart(textarea)
    await userEvent.type(textarea, 'ime composition')
    fireEvent.compositionEnd(textarea)
    onKeyDown.mockReset()
    await userEvent.type(textarea, '{enter}')

    expect(onKeyDown).toHaveBeenCalled()
  })
})
