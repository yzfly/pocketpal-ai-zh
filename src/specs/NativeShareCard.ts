import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  /**
   * 把一问一答画成一张带品牌的分享图片（PNG，宽 1080），存到缓存目录，
   * 返回 file:// 地址。question 可为空字符串。
   */
  render(
    brand: string,
    question: string,
    answer: string,
    tagline: string,
    link: string,
    dark: boolean,
  ): Promise<string>;
}

export default TurboModuleRegistry.get<Spec>('ShareCardModule');
