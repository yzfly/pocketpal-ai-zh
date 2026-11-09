import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useContext,
} from 'react';

import {observer} from 'mobx-react';
import debounce from 'lodash/debounce';

import {SearchView} from './SearchView';
import {DetailsView} from './DetailsView';

import {hfStore} from '../../../store';

import {L10nContext} from '../../../utils';
import {HuggingFaceModel} from '../../../utils/types';
import {Sheet} from '../../../components';

interface HFModelSearchProps {
  visible: boolean;
  onDismiss: () => void;
}

const DEBOUNCE_DELAY = 500;

export const HFModelSearch: React.FC<HFModelSearchProps> = observer(
  ({visible, onDismiss}) => {
    const l10n = useContext(L10nContext);
    const [detailsVisible, setDetailsVisible] = useState(false);
    const [selectedModel, setSelectedModel] = useState<HuggingFaceModel | null>(
      null,
    );

    // Clear state when closed
    useEffect(() => {
      if (!visible) {
        setSelectedModel(null);
      }
    }, [visible]);

    const debouncedSearch = useMemo(
      () =>
        debounce(async (query: string) => {
          hfStore.setSearchQuery(query);
          await hfStore.fetchModels();
        }, DEBOUNCE_DELAY),
      [], // Empty dependencies since we don't want to recreate this
    );

    // Update search query without triggering immediate search
    const handleSearchChange = useCallback(
      (query: string) => {
        debouncedSearch(query);
      },
      [debouncedSearch],
    );

    useEffect(() => {
      if (visible) {
        handleSearchChange(hfStore.searchQuery);
      }
    }, [handleSearchChange, visible]);

    const handleModelSelect = async (model: HuggingFaceModel) => {
      setSelectedModel(model);
      setDetailsVisible(true);
      await hfStore.fetchModelData(model.id);
      const updatedModel = hfStore.getModelById(model.id);
      if (updatedModel) {
        setSelectedModel({...updatedModel});
      }
    };

    const handleSheetDismiss = () => {
      console.log('Search sheet dismissed, clearing error state');
      // Clear error state when the sheet is closed
      hfStore.clearError();
      onDismiss();
    };

    return (
      <>
        <Sheet
          isVisible={visible}
          snapPoints={['92%']}
          enableDynamicSizing={false}
          enablePanDownToClose
          enableContentPanningGesture={false} // Prevent gesture conflicts with FlatList scroll (Android)
          onClose={handleSheetDismiss}
          title={l10n.models.search.sheetTitle}
          showCloseButton={true}>
          <SearchView
            testID="hf-model-search-view"
            onModelSelect={handleModelSelect}
            onChangeSearchQuery={handleSearchChange}
          />
        </Sheet>
        <Sheet
          isVisible={detailsVisible}
          snapPoints={['90%']}
          enableDynamicSizing={false}
          enablePanDownToClose
          enableContentPanningGesture={false} // Prevent gesture conflicts with FlatList scroll (Android)
          onClose={() => setDetailsVisible(false)}
          title={l10n.models.search.detailsTitle}
          showCloseButton={true}>
          {selectedModel && <DetailsView hfModel={selectedModel} />}
        </Sheet>
      </>
    );
  },
);
