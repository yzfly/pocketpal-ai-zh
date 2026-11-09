import React, {useContext} from 'react';
import {StyleSheet, View} from 'react-native';
import {BottomSheetBackgroundProps} from '@gorhom/bottom-sheet';

import {L10nContext} from '../../utils';

export const SheetBackground = ({style}: BottomSheetBackgroundProps) => {
  const l10n = useContext(L10nContext);
  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={l10n.common.a11y.bottomSheet}
      style={[styles.background, style]}
    />
  );
};

const styles = StyleSheet.create({
  background: {
    backgroundColor: 'white',
    borderRadius: 15,
  },
});
