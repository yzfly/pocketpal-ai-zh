import React from 'react';

import {useTheme} from '../../hooks';
import Mark from '../../assets/brand/mark.svg';
import MarkInverse from '../../assets/brand/mark-inverse.svg';

interface BrandMarkProps {
  size?: number;
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * 口袋AI 标识（星球轨道），与桌面图标同源：由 scripts/generate-app-icons.js
 * 从同一组 SVG 生成。浅色模式黑底白标，深色模式白底黑标，
 * 与 Geist 黑白主色保持一致。
 */
export const BrandMark: React.FC<BrandMarkProps> = ({
  size = 72,
  accessibilityLabel,
  testID,
}) => {
  const theme = useTheme();
  const Svg = theme.dark ? MarkInverse : Mark;
  return (
    <Svg
      width={size}
      height={size}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityElementsHidden={!accessibilityLabel}
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no'}
    />
  );
};
