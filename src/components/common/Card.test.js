import { render, screen, fireEvent } from '@testing-library/react';
import Card from './Card';

/* Collapsing from the whole title bar rather than only the chevron. The rule
   that carries this is the exclusion: a head can hold its own buttons — a
   breakdown, a rest, a use-one-charge — and those must keep doing their own
   job instead of collapsing the card out from under the tap. */

describe('a card whose head is clickable', () => {
  test('a click on the title toggles it', () => {
    const onHeadClick = jest.fn();
    render(<Card title="Attacks" eyebrow="BAB +8" onHeadClick={onHeadClick}>body</Card>);
    fireEvent.click(screen.getByText('Attacks'));
    expect(onHeadClick).toHaveBeenCalledTimes(1);
  });

  test('a click on the eyebrow toggles it too', () => {
    const onHeadClick = jest.fn();
    render(<Card title="Attacks" eyebrow="BAB +8" onHeadClick={onHeadClick}>body</Card>);
    fireEvent.click(screen.getByText('BAB +8'));
    expect(onHeadClick).toHaveBeenCalled();
  });

  test('a button in the action slot does its own job and does not toggle', () => {
    const onHeadClick = jest.fn();
    const onAction = jest.fn();
    render(
      <Card
        title="Health"
        onHeadClick={onHeadClick}
        action={<button type="button" onClick={onAction}>Rest</button>}
      >
        body
      </Card>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Rest' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onHeadClick).not.toHaveBeenCalled();
  });

  test('a card with no handler is inert — clicking its head changes nothing', () => {
    render(<Card title="Plain">body</Card>);
    fireEvent.click(screen.getByText('Plain'));
    expect(screen.getByText('body')).toBeInTheDocument();
  });
});
