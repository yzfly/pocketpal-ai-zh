import React, {useContext} from 'react';
import {View, ScrollView} from 'react-native';
import {Chip} from 'react-native-paper';
import {observer} from 'mobx-react-lite';

import {useTheme} from '../../../../hooks';
import {createStyles} from './styles';
import {L10nContext} from '../../../../utils';

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
    // 随界面语言实时切换（原 PAL_FILTER_LABELS 只在启动时取一次语言）
    const l10n = useContext(L10nContext);

    const visibleFilters: FilterOption[] = [
      {key: 'all', label: l10n.palsScreen.filters.all},
      {key: 'video', label: l10n.palsScreen.filters.video},
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
