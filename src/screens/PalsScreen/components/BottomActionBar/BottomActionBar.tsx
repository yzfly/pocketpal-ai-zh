import React from 'react';
import {View} from 'react-native';

import {observer} from 'mobx-react-lite';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useTheme} from '../../../../hooks';

import {createStyles} from './styles';
import {AddPalMenu} from '../AddPalMenu';

interface BottomActionBarProps {
  onCreatePal: (type: 'assistant' | 'roleplay' | 'video') => void;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = observer(
  ({onCreatePal}) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const styles = createStyles(theme, insets);

    const iconSize = 24;
    const iconColor = theme.colors.onSurfaceVariant;

    return (
      <View style={styles.container}>
        <View style={styles.actionBar}>
          {/* Add Pal Menu */}
          <AddPalMenu
            iconColor={iconColor}
            iconSize={iconSize}
            onCreatePal={onCreatePal}
          />
        </View>
      </View>
    );
  },
);
