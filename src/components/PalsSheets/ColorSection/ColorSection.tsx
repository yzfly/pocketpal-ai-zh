import React, {useContext} from 'react';
import {View, TouchableOpacity, ScrollView} from 'react-native';
import {observer} from 'mobx-react-lite';
import {useFormContext, Controller} from 'react-hook-form';

import {useTheme} from '../../../hooks';
import {t} from '../../../locales';
import {L10nContext} from '../../../utils';
import {createStyles} from './styles';
import {SectionDivider} from '../SectionDivider';
import type {PalFormData} from '../types';

type ColorPair = {
  id: string;
  colors: [string, string];
};
const colorPairs: ColorPair[] = [
  {
    id: 'light-mode',
    colors: ['#858585', '#333333'],
  },
  {
    id: 'dark-mode',
    colors: ['#333333', '#e5e5e6'],
  },
  {id: 'blue-light', colors: ['#70A6F5', '#D9F2FF']},
  {id: 'blue-mid', colors: ['#2444DA', '#70A6F5']},
  {id: 'green-light', colors: ['#A2D29E', '#CBFFDC']},
  {id: 'pink-light', colors: ['#FFBBFE', '#FAEFFE']},
  {id: 'orange-beige', colors: ['#FFAD50', '#F1EAD9']},
  {id: 'pink-rose', colors: ['#9E204F', '#F6E1EA']},
  {id: 'navy-purple', colors: ['#253375', '#8B94C1']},
];

const DualColorCircle = ({
  colors,
  isSelected,
}: {
  colors: [string, string];
  isSelected: boolean;
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View
      testID="color-button"
      style={[
        styles.colorButtonContainer,
        isSelected && styles.selectedColorButtonContainer,
      ]}>
      <View style={styles.colorButton}>
        <View style={[styles.colorHalf, {backgroundColor: colors[0]}]} />
        <View
          style={[
            styles.colorHalf,
            styles.rightHalf,
            {backgroundColor: colors[1]},
          ]}
        />
      </View>
    </View>
  );
};

export const ColorSection = observer(() => {
  const {control} = useFormContext<PalFormData>();
  const theme = useTheme();
  const styles = createStyles(theme);
  const l10n = useContext(L10nContext);

  return (
    <View>
      <SectionDivider label={l10n.components.colorSection.title} />
      <Controller
        control={control}
        name="color"
        render={({field: {onChange, value}}) => (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pickerContainer}>
            {colorPairs.map((pair, index) => {
              const isSelected =
                value?.[0] === pair.colors[0] && value?.[1] === pair.colors[1];
              return (
                <TouchableOpacity
                  key={pair.id}
                  accessibilityRole="radio"
                  accessibilityLabel={t(l10n.components.colorSection.option, {
                    index: String(index + 1),
                  })}
                  accessibilityState={{selected: isSelected}}
                  onPress={() => onChange(pair.colors)}
                  hitSlop={5}
                  activeOpacity={0.7}>
                  <DualColorCircle
                    colors={pair.colors}
                    isSelected={isSelected}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      />
    </View>
  );
});
