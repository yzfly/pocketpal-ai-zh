import DeviceInfo from 'react-native-device-info';

/**
 * User-Agent for outbound Hugging Face requests (API + model downloads).
 * The `(com.pocketwisdom)` token is a fixed attribution key on both platforms.
 */
export const hfUserAgent = (): string =>
  `PocketWisdom/${DeviceInfo.getVersion()} (com.pocketwisdom)`;
