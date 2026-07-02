/**
 * ChatInput 语音输入按钮测试（端侧 SenseVoice via sherpa-onnx）。
 */

import * as React from 'react';
import {Alert} from 'react-native';
import {fireEvent, waitFor, act} from '@testing-library/react-native';

import * as RNFS from '@dr.pogodin/react-native-fs';

import {user} from '../../../../jest/fixtures';
import {l10n} from '../../../locales';
import {UserContext} from '../../../utils';
import {ChatInput} from '../ChatInput';
import {render} from '../../../../jest/test-utils';

// moduleNameMapper 把 react-native-sherpa-onnx 的所有子路径指向同一 mock 文件，
// 直接从该文件导入以拿到同一实例上的测试助手。
import {
  __mockPcmStream,
  __emitPcmData,
  __resetPcmCallbacks,
  createSTT,
} from '../../../../__mocks__/external/react-native-sherpa-onnx';

jest.spyOn(Alert, 'alert');

const voiceL10n = l10n.en.components.chatInput.voiceInput;

const renderChatInput = () =>
  render(
    <UserContext.Provider value={user}>
      <ChatInput onSendPress={jest.fn()} sendButtonVisibilityMode="editing" />
    </UserContext.Provider>,
  );

describe('ChatInput voice input', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetPcmCallbacks();
  });

  it('renders the mic button in idle state', () => {
    const {getByTestId, getByLabelText} = renderChatInput();
    expect(getByTestId('voice-input-button')).toBeTruthy();
    expect(getByLabelText(voiceL10n.start)).toBeTruthy();
  });

  it('prompts to download the model when it is not installed', async () => {
    (RNFS.exists as jest.Mock).mockResolvedValue(false);

    const {getByTestId} = renderChatInput();
    fireEvent.press(getByTestId('voice-input-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        voiceL10n.downloadTitle,
        expect.stringContaining('229'),
        expect.any(Array),
      );
    });
    // 未安装时不应触碰录音或识别器
    expect(__mockPcmStream.start).not.toHaveBeenCalled();
    expect(createSTT).not.toHaveBeenCalled();
  });

  it('records, transcribes and appends the text to the input', async () => {
    (RNFS.exists as jest.Mock).mockResolvedValue(true);

    const {getByTestId, getByPlaceholderText, getByLabelText} =
      renderChatInput();

    const textInput = getByPlaceholderText(
      l10n.en.components.chatInput.inputPlaceholder,
    );
    fireEvent.changeText(textInput, '你好');

    // 第一次点击：开始录音
    fireEvent.press(getByTestId('voice-input-button'));
    await waitFor(() => {
      expect(__mockPcmStream.start).toHaveBeenCalledTimes(1);
      expect(getByLabelText(voiceL10n.stop)).toBeTruthy();
    });

    // 推送一块 PCM 数据（否则视为空录音）
    act(() => {
      __emitPcmData(new Float32Array([0.1, 0.2, 0.3]));
    });

    // 第二次点击：停止 → 转写 → 追加文本（mock 返回 'mock transcription'）
    fireEvent.press(getByTestId('voice-input-button'));
    await waitFor(() => {
      expect(textInput.props.value).toBe('你好mock transcription');
    });
    expect(__mockPcmStream.stop).toHaveBeenCalledTimes(1);
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
