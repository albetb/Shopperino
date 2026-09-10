import { render, screen, fireEvent, act } from '@testing-library/react';
import useLongPress from './useLongPress';

/**
 * A press that leaves the button is a press taken back.
 *
 * The hook fires the tap handler when the press *ends*, and it used to treat
 * the pointer leaving as one of the ways a press ends. With a mouse that is
 * wrong twice over: the pointer leaves the button on its way to anywhere else,
 * so a normal click landed the action once on mouse-up and again on the way
 * out — which is what dropping a hit point twice per click looked like.
 */

function Harness({ onTap, onHold }) {
  const press = useLongPress(onHold, onTap, { delay: 400, shouldPreventDefault: false });
  return <button type="button" {...press}>−</button>;
}

const button = () => screen.getByRole('button');

describe('with a mouse', () => {
  test('a click still fires the tap once', () => {
    const onTap = jest.fn();
    render(<Harness onTap={onTap} onHold={jest.fn()} />);
    fireEvent.mouseDown(button());
    fireEvent.mouseUp(button());
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  test('and moving the pointer off afterwards does not fire it again', () => {
    const onTap = jest.fn();
    render(<Harness onTap={onTap} onHold={jest.fn()} />);
    fireEvent.mouseDown(button());
    fireEvent.mouseUp(button());
    fireEvent.mouseLeave(button());
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  test('dragging off without releasing cancels the press entirely', () => {
    const onTap = jest.fn();
    render(<Harness onTap={onTap} onHold={jest.fn()} />);
    fireEvent.mouseDown(button());
    fireEvent.mouseLeave(button());
    expect(onTap).not.toHaveBeenCalled();
  });
});

describe('holding', () => {
  test('fires the long press and then no tap on release', () => {
    jest.useFakeTimers();
    const onTap = jest.fn();
    const onHold = jest.fn();
    render(<Harness onTap={onTap} onHold={onHold} />);
    fireEvent.mouseDown(button());
    act(() => { jest.advanceTimersByTime(500); });
    fireEvent.mouseUp(button());
    expect(onHold).toHaveBeenCalledTimes(1);
    expect(onTap).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
