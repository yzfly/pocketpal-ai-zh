import React, {useCallback, useContext, useRef} from 'react';
import {TouchableOpacity, type HostInstance} from 'react-native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

import {styles} from './styles';
import {claimPlusReturnFocus, releasePlusReturnFocus} from './plusReturnFocus';
import {MenuIcon} from '../../assets/icons';
import {useTheme} from '../../hooks';
import {L10nContext} from '../../utils';

export const HeaderLeft: React.FC = () => {
  const theme = useTheme();
  const l10n = useContext(L10nContext);
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const buttonRef = useRef<HostInstance>(null);

  useFocusEffect(
    useCallback(() => {
      const node = buttonRef.current;
      claimPlusReturnFocus(node);
      return () => releasePlusReturnFocus(node);
    }, []),
  );

  return (
    <TouchableOpacity
      ref={buttonRef}
      style={[styles.menuIcon]}
      testID="menu-button"
      accessibilityLabel={l10n.common.a11y.openDrawer}
      onPress={() => navigation.openDrawer()}>
      <MenuIcon stroke={theme.colors.primary} />
    </TouchableOpacity>
  );
};
