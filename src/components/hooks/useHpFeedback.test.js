import { renderHook, act } from '@testing-library/react';
import useHpFeedback from './useHpFeedback';

describe('the hit-point change readout', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('nothing is shown until something changes', () => {
    const { result } = renderHook(() => useHpFeedback());
    expect(result.current.feedback).toBeNull();
  });

  test('a gain reads with a plus, a loss with a minus', () => {
    const { result } = renderHook(() => useHpFeedback());
    act(() => result.current.show(7));
    expect(result.current.feedback).toEqual({ text: '+7', delta: 7 });

    act(() => jest.advanceTimersByTime(5000));
    act(() => result.current.show(-4));
    expect(result.current.feedback).toEqual({ text: '-4', delta: -4 });
  });

  test('changes inside the window accumulate rather than flashing one by one', () => {
    const { result } = renderHook(() => useHpFeedback());
    act(() => result.current.show(1));
    act(() => result.current.show(1));
    act(() => result.current.show(1));
    expect(result.current.feedback.text).toBe('+3');
  });

  test('a heal after a hit nets out', () => {
    const { result } = renderHook(() => useHpFeedback());
    act(() => result.current.show(-10));
    act(() => result.current.show(4));
    expect(result.current.feedback).toEqual({ text: '-6', delta: -6 });
  });

  test('the readout clears once the window lapses, and the total starts over', () => {
    const { result } = renderHook(() => useHpFeedback());
    act(() => result.current.show(5));
    act(() => jest.advanceTimersByTime(5000));
    expect(result.current.feedback).toBeNull();

    act(() => result.current.show(2));
    expect(result.current.feedback.text).toBe('+2');
  });

  test('the window restarts on every change', () => {
    const { result } = renderHook(() => useHpFeedback());
    act(() => result.current.show(1));
    act(() => jest.advanceTimersByTime(4000));
    act(() => result.current.show(1));
    act(() => jest.advanceTimersByTime(4000));
    // 8s since the first change, but only 4s since the last — still showing.
    expect(result.current.feedback.text).toBe('+2');
  });

  test('a change of zero is not a change', () => {
    const { result } = renderHook(() => useHpFeedback());
    act(() => result.current.show(0));
    expect(result.current.feedback).toBeNull();
  });
});
