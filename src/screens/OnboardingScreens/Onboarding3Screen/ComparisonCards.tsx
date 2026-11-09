import React from 'react';
import {View} from 'react-native';
import {Text} from 'react-native-paper';

import {useTheme} from '../../../hooks';
import {BrandMark} from '../../../components/BrandMark';
import {GlobeIcon} from '../../../assets/icons';
import {createCardStyles} from './styles';

interface ComparisonCardsProps {
  copy: {
    localTitle: string;
    localSub: string;
    localTags: string;
    vs: string;
    cloudTitle: string;
    cloudSub: string;
    cloudTags: string;
  };
}

/**
 * 引导第 3 屏：本地（口袋AI）与云端 AI 的对比卡片。
 * 原来是一张写死英文和旧形象的图片，这里改为原生组件，随语言与深浅色变化。
 */
export const ComparisonCards: React.FC<ComparisonCardsProps> = ({copy}) => {
  const theme = useTheme();
  const styles = createCardStyles(theme);
  return (
    <View
      style={styles.row}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <View style={[styles.card, styles.localCard]}>
        <BrandMark size={40} />
        <Text style={styles.title}>{copy.localTitle}</Text>
        <Text style={styles.sub}>{copy.localSub}</Text>
        <Text style={styles.tags}>{copy.localTags}</Text>
      </View>
      <Text style={styles.vs}>{copy.vs}</Text>
      <View style={[styles.card, styles.cloudCard]}>
        <View style={styles.cloudIcon}>
          <GlobeIcon
            width={22}
            height={22}
            stroke={theme.colors.onSurfaceVariant}
          />
        </View>
        <Text style={[styles.title, styles.mutedTitle]}>{copy.cloudTitle}</Text>
        <Text style={styles.sub}>{copy.cloudSub}</Text>
        <Text style={styles.tags}>{copy.cloudTags}</Text>
      </View>
    </View>
  );
};
