import React from 'react';
import {View, ScrollView} from 'react-native';
import {Chip} from 'react-native-paper';
import {observer} from 'mobx-react-lite';

import {useTheme} from '../../../../hooks';
import {createStyles} from './styles';
import {PAL_FILTER_LABELS} from '../../../../utils/palshub-display';

export type FilterType = 'all' | 'video';

interface FilterChipsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

interface FilterOption {
  key: FilterType;
  label: string;
}

export const FilterChips: React.FC<FilterChipsProps> = observer(
  ({activeFilter, onFilterChange}) => {
    const theme = useTheme();
    const styles = createStyles(theme);

    const visibleFilters: FilterOption[] = [
      {key: 'all', label: PAL_FILTER_LABELS.all},
      {key: 'video', label: PAL_FILTER_LABELS.video},
    ];

    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {visibleFilters.map(option => (
            <Chip
              testID={`filter-chip-${option.key}`}
              key={option.key}
              mode={activeFilter === option.key ? 'flat' : 'outlined'}
              selected={activeFilter === option.key}
              onPress={() => onFilterChange(option.key)}
              style={[
                styles.chip,
                activeFilter === option.key && styles.activeChip,
              ]}
              textStyle={[
                styles.chipText,
                activeFilter === option.key && styles.activeChipText,
              ]}
              compact>
              {option.label}
            </Chip>
          ))}
        </ScrollView>
      </View>
    );
  },
);
