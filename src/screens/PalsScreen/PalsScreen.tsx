import React, {useState, useContext} from 'react';
import {View, FlatList, useWindowDimensions} from 'react-native';
import {Text} from 'react-native-paper';
import {observer} from 'mobx-react-lite';

import {PlusIcon} from '../../assets/icons';

import {useTheme} from '../../hooks';
import {createStyles} from './styles';
import {isLocalPal} from '../../utils/pal-type-guards';
import {L10nContext} from '../../utils';
import {chunkIntoRows, computePalGridLayout} from './palGridLayout';

import type {PalGridItem} from './palGridLayout';

import {
  BottomActionBar,
  FilterChips,
  FilterType,
  PalGridRow,
} from './components';

import {PalSheet} from '../../components/PalsSheets';

import {
  createNewAssistantPal,
  createNewRoleplayPal,
  createNewVideoPal,
  preparePalForEditing,
} from '../../utils/pal-templates';

import {palStore, Pal} from '../../store';
import {hasVideoCapability} from '../../utils/pal-capabilities';

// 口袋AI：助手全部保存在本机，没有在线市场与购买。
export const PalsScreen: React.FC = observer(() => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const l10n = useContext(L10nContext);
  const {width: windowWidth} = useWindowDimensions();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showPalSheet, setShowPalSheet] = useState(false);
  const [currentPal, setCurrentPal] = useState<Partial<Pal> | null>(null);

  const handleCreatePal = (type: 'assistant' | 'roleplay' | 'video') => {
    const newPal =
      type === 'roleplay'
        ? createNewRoleplayPal()
        : type === 'video'
          ? createNewVideoPal()
          : createNewAssistantPal();
    setCurrentPal(newPal);
    setShowPalSheet(true);
  };

  const handlePalPress = (pal: PalGridItem) => {
    if (!isLocalPal(pal)) {
      return;
    }
    setCurrentPal(preparePalForEditing(pal));
    setShowPalSheet(true);
  };

  const pals = palStore.getLocalPals();
  const filtered =
    activeFilter === 'video' ? pals.filter(p => hasVideoCapability(p)) : pals;

  const {columns, cardWidth} = computePalGridLayout(windowWidth);
  const rows = chunkIntoRows(filtered, columns);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <PlusIcon stroke={theme.colors.onSurfaceVariant} width={48} height={48} />
      <Text style={styles.emptyStateText}>{l10n.palsScreen.emptyState}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FilterChips
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <FlatList
        data={rows}
        keyExtractor={row => row.key}
        renderItem={({item}) => (
          <PalGridRow
            row={item}
            cardWidth={cardWidth}
            onPalPress={handlePalPress}
          />
        )}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        testID="pals-flat-list"
      />

      <BottomActionBar onCreatePal={handleCreatePal} />

      {showPalSheet && currentPal && (
        <PalSheet
          isVisible={showPalSheet}
          onClose={() => {
            setShowPalSheet(false);
            setCurrentPal(null);
          }}
          pal={currentPal}
        />
      )}
    </View>
  );
});

export default PalsScreen;
