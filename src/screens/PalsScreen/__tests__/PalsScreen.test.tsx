import React from 'react';
import {act, fireEvent, waitFor} from '@testing-library/react-native';

import {render} from '../../../../jest/test-utils';

import {PalsScreen} from '../PalsScreen';
import {PalGridRow} from '../components';

import {palStore} from '../../../store';
import {createPal} from '../../../../jest/fixtures/pals';

// Mirrors the real hook: the width change re-renders from inside the component,
// which is what rotation does. A parent re-render cannot, since observer() memoises.
let mockWindow = {width: 750, height: 1334, scale: 2, fontScale: 1};
const mockWindowListeners = new Set<() => void>();

const setWindowWidth = (width: number) => {
  mockWindow = {...mockWindow, width};
  mockWindowListeners.forEach(listener => listener());
};

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => {
  const {useSyncExternalStore} = require('react');

  const subscribe = (listener: () => void) => {
    mockWindowListeners.add(listener);
    return () => mockWindowListeners.delete(listener);
  };

  const useMockWindowDimensions = () =>
    useSyncExternalStore(subscribe, () => mockWindow);

  return {__esModule: true, default: useMockWindowDimensions};
});

const renderScreen = () =>
  render(<PalsScreen />, {
    withNavigation: true,
    withSafeArea: true,
    withBottomSheetProvider: true,
  });

describe('PalsScreen (local only)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWindow = {width: 750, height: 1334, scale: 2, fontScale: 1};
    palStore.pals = [];
  });

  it('shows every local pal under the "all" filter', async () => {
    palStore.pals = [
      createPal({id: 'a', name: 'Pal A', source: 'local'}),
      createPal({id: 'b', name: 'Pal B', source: 'local'}),
    ];
    const {getByText} = renderScreen();
    await waitFor(() => {
      expect(getByText('Pal A')).toBeTruthy();
      expect(getByText('Pal B')).toBeTruthy();
    });
  });

  it('filters to video pals', async () => {
    palStore.pals = [
      createPal({id: 'a', name: 'Text Pal', source: 'local'}),
      createPal({
        id: 'v',
        name: 'Video Pal',
        source: 'local',
        capabilities: {video: true, multimodal: true},
      }),
    ];
    const {getByTestId, queryByText, getByText} = renderScreen();
    fireEvent.press(getByTestId('filter-chip-video'));
    await waitFor(() => {
      expect(getByText('Video Pal')).toBeTruthy();
      expect(queryByText('Text Pal')).toBeNull();
    });
  });

  it('shows the empty state with no pals', () => {
    const {getByText} = renderScreen();
    expect(getByText(/No assistants yet/)).toBeTruthy();
  });

  it('has no market, search or account entry points', () => {
    const {queryByTestId} = renderScreen();
    expect(queryByTestId('bottom-action-search')).toBeNull();
    expect(queryByTestId('bottom-action-profile')).toBeNull();
    expect(queryByTestId('filter-chip-premium')).toBeNull();
  });

  it('reflows the flat list on a width change without remounting it', () => {
    palStore.pals = ['g1', 'g2', 'g3', 'g4', 'g5'].map(id =>
      createPal({id, name: `Grid Pal ${id}`, source: 'local'}),
    );
    setWindowWidth(360);

    const {getByTestId, UNSAFE_getAllByType} = renderScreen();
    const firstRowSize = () =>
      UNSAFE_getAllByType(PalGridRow)[0].props.row.items.length;

    const flatList = getByTestId('pals-flat-list');
    expect(firstRowSize()).toBe(2);

    act(() => {
      setWindowWidth(800);
    });

    expect(getByTestId('pals-flat-list')).toBe(flatList);
    expect(firstRowSize()).toBe(4);
    act(() => {
      setWindowWidth(750);
    });
  });
});
