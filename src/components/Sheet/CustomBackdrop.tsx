import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import React, {useContext, useMemo} from 'react';
import {useTheme} from 'react-native-paper';

import {L10nContext} from '../../utils';
// import {Extrapolation, interpolate} from 'react-native-reanimated';
// import {useAnimatedStyle} from 'react-native-reanimated';

export const CustomBackdrop = ({
  animatedIndex,
  animatedPosition,
  style,
}: BottomSheetBackdropProps) => {
  const theme = useTheme();
  const l10n = useContext(L10nContext);

  // const containerAnimatedStyle = useAnimatedStyle(() => ({
  //   opacity: interpolate(
  //     animatedIndex.value,
  //     [-1, 0],
  //     [0, 1],
  //     Extrapolation.CLAMP,
  //   ),
  // }));

  const containerStyle = useMemo(
    () => [
      style,
      {
        backgroundColor: theme.colors.backdrop,
      },
      // containerAnimatedStyle,
    ],
    [style, theme.colors.backdrop],
  );

  return (
    <BottomSheetBackdrop
      animatedIndex={animatedIndex}
      animatedPosition={animatedPosition}
      disappearsOnIndex={-1}
      accessibilityLabel={l10n.common.a11y.closeSheet}
      style={containerStyle}
    />
  );
};
