import {StyleSheet} from 'react-native';

import type {Theme} from '../../../../utils/types';

export const createStyles = (theme: Theme, align: 'left' | 'center') =>
  StyleSheet.create({
    bodyText: {
      ...theme.typography.bodyM,
      color: theme.colors.onSurfaceVariant,
      textAlign: align,
    },
    pillRun: {
      // 口袋AI 黑白风格：重点词用深色加粗，不再铺底色（铺色像被选中的文字）
      color: theme.colors.text,
      fontWeight: '600',
    },
  });
