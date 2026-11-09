import React from 'react';
import {runInAction} from 'mobx';

import {render} from '../../../../jest/test-utils';
import {modelStore} from '../../../store';
import {ChatEmptyPlaceholder} from '../ChatEmptyPlaceholder';

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({navigate: jest.fn()}),
}));

describe('ChatEmptyPlaceholder', () => {
  afterEach(() => {
    runInAction(() => {
      modelStore.activeModelId = undefined;
      modelStore.models = [];
    });
  });

  it('shows a ready state instead of a blank page once a model is loaded', () => {
    runInAction(() => {
      modelStore.models = [
        {id: 'm1', name: '口袋助手 mini', isDownloaded: true} as any,
      ];
      modelStore.activeModelId = 'm1';
    });
    const {getByTestId, getByText} = render(
      <ChatEmptyPlaceholder
        onSelectModel={jest.fn()}
        bottomComponentHeight={0}
      />,
    );
    expect(getByTestId('chat-ready-placeholder')).toBeTruthy();
    expect(getByText('口袋助手 mini is ready')).toBeTruthy();
  });
});
