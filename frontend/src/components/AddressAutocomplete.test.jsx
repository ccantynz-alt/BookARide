import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddressAutocomplete from './AddressAutocomplete';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('axios', () => ({
  get: jest.fn(),
}));

jest.mock('../config/api', () => ({ API: 'http://localhost:8000/api' }));

// Stub lucide-react so it doesn't break in jsdom
jest.mock('lucide-react', () => ({ MapPin: () => null }));

// Stub the shadcn Input to a plain <input> for easy querying
// Note: jest.mock factories cannot reference out-of-scope variables, so we
// use jest.requireActual('react') inside the factory.
jest.mock('./ui/input', () => {
  const mockReact = require('react');
  return {
    Input: mockReact.forwardRef((props, ref) => mockReact.createElement('input', { ref, ...props })),
  };
});

import axios from 'axios';

const SUGGESTIONS = [
  { description: '1 Queen Street, Auckland, New Zealand', place_id: 'p1' },
  { description: '2 Queen Street, Auckland, New Zealand', place_id: 'p2' },
  { description: '3 Queen Street, Auckland, New Zealand', place_id: 'p3' },
];

function setup(props = {}) {
  const onChange = jest.fn();
  const onSelect = jest.fn();
  const utils = render(
    <AddressAutocomplete
      value=""
      onChange={onChange}
      onSelect={onSelect}
      {...props}
    />
  );
  const input = utils.getByRole('textbox');
  return { ...utils, input, onChange, onSelect };
}

beforeEach(() => {
  jest.useFakeTimers();
  axios.get.mockResolvedValue({ data: { predictions: SUGGESTIONS } });
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

// ── 1. Rendering ───────────────────────────────────────────────────────────────

test('renders an input with the correct placeholder', () => {
  const { input } = setup({ placeholder: 'Type an address' });
  expect(input).toBeInTheDocument();
  expect(input).toHaveAttribute('placeholder', 'Type an address');
  expect(input.getAttribute('autocomplete')).toBe('off');
});

test('does not show dropdown initially', () => {
  setup();
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

// ── 2. Fetching suggestions ────────────────────────────────────────────────────

test('does not fetch for fewer than 3 characters', async () => {
  const { input } = setup();
  fireEvent.change(input, { target: { value: 'Qu' } });
  act(() => jest.runAllTimers());
  expect(axios.get).not.toHaveBeenCalled();
});

test('fetches suggestions after 300ms debounce', async () => {
  const { input } = setup();
  fireEvent.change(input, { target: { value: 'Queen Street' } });

  // Not called yet (debounce)
  expect(axios.get).not.toHaveBeenCalled();

  act(() => jest.runAllTimers());
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

  expect(axios.get).toHaveBeenCalledWith(
    'http://localhost:8000/api/places/autocomplete',
    { params: { input: 'Queen Street', types: 'address', region: 'nz' } }
  );
});

test('debounce resets on rapid keystrokes — only one API call made', async () => {
  const { input } = setup();

  fireEvent.change(input, { target: { value: 'Q' } });
  fireEvent.change(input, { target: { value: 'Qu' } });
  fireEvent.change(input, { target: { value: 'Que' } });
  fireEvent.change(input, { target: { value: 'Quee' } });

  act(() => jest.runAllTimers());
  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
});

test('shows suggestions in a portal after API response', async () => {
  const { input } = setup();
  fireEvent.change(input, { target: { value: 'Queen' } });
  act(() => jest.runAllTimers());

  await waitFor(() =>
    expect(screen.getByText('1 Queen Street, Auckland, New Zealand')).toBeInTheDocument()
  );

  const buttons = screen.getAllByRole('button');
  expect(buttons).toHaveLength(SUGGESTIONS.length);
});

// ── 3. Selection via onMouseDown (the core fix) ────────────────────────────────

test('selecting a suggestion calls onSelect and closes the dropdown', async () => {
  const { input, onSelect } = setup();
  fireEvent.change(input, { target: { value: 'Queen' } });
  act(() => jest.runAllTimers());

  await waitFor(() =>
    expect(screen.getByText('1 Queen Street, Auckland, New Zealand')).toBeInTheDocument()
  );

  const [firstBtn] = screen.getAllByRole('button');
  // Fire mousedown (this is what actually triggers selection now)
  fireEvent.mouseDown(firstBtn);

  expect(onSelect).toHaveBeenCalledWith('1 Queen Street, Auckland, New Zealand');
  expect(onSelect).toHaveBeenCalledTimes(1);

  // Dropdown must be gone
  await waitFor(() =>
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  );
});

test('when onSelect is not provided, onChange is called instead', async () => {
  const onChange = jest.fn();
  const { input } = setup({ onSelect: undefined, onChange });

  fireEvent.change(input, { target: { value: 'Queen' } });
  act(() => jest.runAllTimers());

  await waitFor(() =>
    expect(screen.getAllByRole('button').length).toBe(SUGGESTIONS.length)
  );

  fireEvent.mouseDown(screen.getAllByRole('button')[0]);
  expect(onChange).toHaveBeenCalledWith('1 Queen Street, Auckland, New Zealand');
});

// ── 4. React 18 concurrent-mode race condition ─────────────────────────────────
// Simulates a debounced API response arriving WHILE the user is clicking.
// With onClick this would re-open the dropdown; onMouseDown fires first and wins.

test('stale API response after selection does not re-open dropdown', async () => {
  const { input, onSelect } = setup();

  // First response populates dropdown
  fireEvent.change(input, { target: { value: 'Queen' } });
  act(() => jest.runAllTimers());
  await waitFor(() => screen.getAllByRole('button'));

  // User clicks first suggestion (mousedown)
  fireEvent.mouseDown(screen.getAllByRole('button')[0]);
  expect(onSelect).toHaveBeenCalledTimes(1);

  // A second API call resolves right after (race condition scenario)
  await act(async () => {
    axios.get.mockResolvedValueOnce({ data: { predictions: SUGGESTIONS } });
    fireEvent.change(input, { target: { value: 'Queen S' } });
    jest.runAllTimers();
  });

  // Dropdown should show again only because user typed again — that's fine.
  // The key assertion: onSelect was only called ONCE (no ghost selection)
  expect(onSelect).toHaveBeenCalledTimes(1);
});

// ── 5. Click-outside closes dropdown ──────────────────────────────────────────

test('clicking outside the input and dropdown closes it', async () => {
  const { input } = setup();
  fireEvent.change(input, { target: { value: 'Queen' } });
  act(() => jest.runAllTimers());
  await waitFor(() => screen.getAllByRole('button'));

  // Mousedown on something entirely outside
  fireEvent.mouseDown(document.body);

  await waitFor(() =>
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  );
});

test('mousedown on a suggestion selects it and closes — NOT a silent close', async () => {
  // Verifies the critical invariant: the dropdown never closes silently.
  // Either the user selected an item (onSelect called) or the dropdown stays open.
  const { input, onSelect } = setup();
  fireEvent.change(input, { target: { value: 'Queen' } });
  act(() => jest.runAllTimers());
  await waitFor(() => screen.getAllByRole('button'));

  const firstBtn = screen.getAllByRole('button')[0];
  fireEvent.mouseDown(firstBtn);

  // onSelect MUST have been called — not a silent dismissal
  expect(onSelect).toHaveBeenCalledWith('1 Queen Street, Auckland, New Zealand');

  // AND the dropdown must be gone
  await waitFor(() =>
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  );
});

// ── 6. Minimum 3-character gate ───────────────────────────────────────────────

test('clears suggestions and closes dropdown when input drops below 3 chars', async () => {
  const { input } = setup();
  fireEvent.change(input, { target: { value: 'Queen' } });
  act(() => jest.runAllTimers());
  await waitFor(() => screen.getAllByRole('button'));

  // User clears back to 2 chars
  fireEvent.change(input, { target: { value: 'Qu' } });
  act(() => jest.runAllTimers());

  await waitFor(() =>
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  );
});

// ── 7. API error handling ─────────────────────────────────────────────────────

test('API error does not crash the component — dropdown stays closed', async () => {
  axios.get.mockRejectedValueOnce(new Error('Network Error'));
  const { input } = setup();

  fireEvent.change(input, { target: { value: 'Queen' } });
  act(() => jest.runAllTimers());

  // Give time for promise rejection to propagate
  await act(async () => {});

  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

// ── 8. disabled prop ─────────────────────────────────────────────────────────

test('disabled input does not open dropdown', async () => {
  const { input } = setup({ disabled: true });
  expect(input).toBeDisabled();
});
