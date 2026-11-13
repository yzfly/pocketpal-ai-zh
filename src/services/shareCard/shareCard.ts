// 把一条回复分享成图片：原生画卡片（Android），再交给系统分享面板。
import Share from 'react-native-share';

import NativeShareCard from '../../specs/NativeShareCard';

export interface ShareCardContent {
  brand: string;
  question?: string;
  answer: string;
  tagline: string;
  link: string;
  dark: boolean;
}

/** 当前平台能否把回复画成图片（目前只有 Android 有原生实现） */
export const canShareAsImage = (): boolean => !!NativeShareCard;

/**
 * 把 Markdown 回复压成适合画在图片上的纯文本：
 * 去掉强调、标题、代码围栏等记号，列表符号统一成 “•”，保留换行。
 */
export function toPlainText(markdown: string): string {
  return markdown
    .replace(/\r\n/g, '\n')
    .replace(/^```[^\n]*$/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^>\s?/gm, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** 画图并打开系统分享面板；用户取消不算错误。返回是否真的画出了图片。 */
export async function shareReplyAsImage(
  content: ShareCardContent,
): Promise<boolean> {
  if (!NativeShareCard) {
    return false;
  }
  const answer = toPlainText(content.answer);
  if (!answer) {
    return false;
  }
  const url = await NativeShareCard.render(
    content.brand,
    toPlainText(content.question ?? ''),
    answer,
    content.tagline,
    content.link,
    content.dark,
  );
  await Share.open({url, type: 'image/png', failOnCancel: false});
  return true;
}
