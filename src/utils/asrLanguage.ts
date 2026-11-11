// 口袋AI：语音输入可选的识别语言（whisper 语言码，'zh-Hant' = 繁体中文）；
// 'auto' = 首次自动检测后沿用。语言名用各自的写法，不随界面语言翻译。
export const ASR_LANGUAGE_OPTIONS = [
  'auto',
  'zh',
  'zh-Hant',
  'en',
  'ja',
  'ko',
] as const;

const ASR_LANGUAGE_NATIVE: Record<string, string> = {
  zh: '简体中文',
  'zh-Hant': '繁體中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
};

export const asrLanguageLabel = (
  code: string,
  l10n: {voiceInput: {spokenLanguageAuto: string}},
): string =>
  code === 'auto'
    ? l10n.voiceInput.spokenLanguageAuto
    : (ASR_LANGUAGE_NATIVE[code] ?? code.toUpperCase());
