import { render, screen, fireEvent } from '@testing-library/react';
import TriSwitch from './TriSwitch';

/* Three positions, one choice. The rule that carries it is that the centre is
   a real destination, not the absence of a selection: a monk who has not
   decided yet must be able to say so, and must be able to get back there after
   picking a side. */

const setup = (value = '', onChange = jest.fn()) => {
  render(
    <TriSwitch
      value={value}
      leftValue="Improved grapple"
      rightValue="Stunning fist"
      leftLabel="Take Improved grapple"
      rightLabel="Take Stunning fist"
      centerLabel="Take neither"
      onChange={onChange}
    />
  );
  return onChange;
};

const pos = (label) => screen.getByRole('radio', { name: label });

test('it is one radiogroup of three, not two independent switches', () => {
  setup();
  expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  expect(screen.getAllByRole('radio')).toHaveLength(3);
});

test('with nothing chosen the centre is the checked position', () => {
  setup('');
  expect(pos('Take neither')).toHaveAttribute('aria-checked', 'true');
  expect(pos('Take Improved grapple')).toHaveAttribute('aria-checked', 'false');
  expect(pos('Take Stunning fist')).toHaveAttribute('aria-checked', 'false');
});

test('a chosen side is the checked one, and only one is ever checked', () => {
  setup('Stunning fist');
  expect(pos('Take Stunning fist')).toHaveAttribute('aria-checked', 'true');
  expect(screen.getAllByRole('radio').filter((r) => r.getAttribute('aria-checked') === 'true'))
    .toHaveLength(1);
});

test('pressing a side reports that side\'s value', () => {
  const onChange = setup('');
  fireEvent.click(pos('Take Improved grapple'));
  expect(onChange).toHaveBeenCalledWith('Improved grapple');
});

test('pressing the centre clears the choice rather than reporting a value', () => {
  const onChange = setup('Stunning fist');
  fireEvent.click(pos('Take neither'));
  expect(onChange).toHaveBeenCalledWith('');
});

test('a value matching neither side reads as the centre', () => {
  setup('Something else entirely');
  expect(pos('Take neither')).toHaveAttribute('aria-checked', 'true');
});

test('disabled, no position reports anything', () => {
  const onChange = jest.fn();
  render(
    <TriSwitch value="" leftValue="a" rightValue="b" onChange={onChange} disabled />
  );
  screen.getAllByRole('radio').forEach((r) => fireEvent.click(r));
  expect(onChange).not.toHaveBeenCalled();
});
