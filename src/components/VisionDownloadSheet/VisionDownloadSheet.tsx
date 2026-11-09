import React, {useState, useContext, useMemo} from 'react';
import {View} from 'react-native';
import {
  Text,
  Button,
  Switch,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {Sheet} from '../Sheet';
import {ProjectionModelSelector} from '../ProjectionModelSelector';
import {useTheme} from '../../hooks';
import {L10nContext, hfAsModel, getMmprojFiles} from '../../utils';
import {Model, HuggingFaceModel, ModelFile} from '../../utils/types';

import {modelStore} from '../../store';

import {createStyles} from './styles';

interface VisionDownloadSheetProps {
  isVisible: boolean;
  onClose: () => void;
  hfModel: HuggingFaceModel;
  modelFile: ModelFile;
  convertedModel: Model;
}

export const VisionDownloadSheet: React.FC<VisionDownloadSheetProps> = ({
  isVisible,
  onClose,
  hfModel,
  modelFile,
  convertedModel,
}) => {
  const theme = useTheme();
  const l10n = useContext(L10nContext);
  const styles = createStyles(theme);

  const [visionEnabled, setVisionEnabled] = useState(true);
  // Track selected projection model for UI consistency (ProjectionModelSelector expects this callback)
  const [selectedProjectionModel, setSelectedProjectionModel] = useState<
    string | null
  >(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Create projection models from HF repository data for search context
  const repositoryProjectionModels = useMemo(() => {
    const mmprojFiles = getMmprojFiles(hfModel.siblings || []);
    return mmprojFiles.map(file => hfAsModel(hfModel, file));
  }, [hfModel]);

  const handleVisionToggle = (enabled: boolean) => {
    setVisionEnabled(enabled);
    if (!enabled) {
      setSelectedProjectionModel(null);
    }
  };

  const handleProjectionModelSelect = (projectionModelId: string | null) => {
    setSelectedProjectionModel(projectionModelId);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await modelStore.downloadHFModel(hfModel, modelFile, {
        enableVision: visionEnabled,
        projectionModelId: selectedProjectionModel || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const renderVisionToggle = () => (
    <View style={styles.toggleContainer}>
      <View style={styles.toggleHeader}>
        <Icon
          name={visionEnabled ? 'eye' : 'eye-off'}
          size={24}
          color={visionEnabled ? theme.colors.text : theme.colors.textSecondary}
        />
        <View style={styles.toggleTextContainer}>
          <Text
            style={[
              styles.toggleTitle,
              !visionEnabled && {color: theme.colors.textSecondary},
            ]}>
            {l10n.models.multimodal.visionControls.visionEnabled}
          </Text>
        </View>
        <Switch
          value={visionEnabled}
          onValueChange={handleVisionToggle}
          accessibilityLabel={
            l10n.models.multimodal.visionControls.visionEnabled
          }
        />
      </View>
    </View>
  );

  const renderProjectionModelSelector = () => {
    if (!visionEnabled) {
      return (
        <View style={styles.projectionModelsContainer}>
          <View style={styles.disabledProjectionSelector}>
            <ProjectionModelSelector
              model={convertedModel}
              context="search"
              availableProjectionModels={repositoryProjectionModels}
              onProjectionModelSelect={handleProjectionModelSelect}
              showDownloadActions={false}
            />
          </View>
        </View>
      );
    }

    return (
      <ProjectionModelSelector
        model={convertedModel}
        context="search"
        availableProjectionModels={repositoryProjectionModels}
        onProjectionModelSelect={handleProjectionModelSelect}
        showDownloadActions={false}
      />
    );
  };

  return (
    <Sheet
      isVisible={isVisible}
      onClose={onClose}
      title={`${modelFile.rfilename}`}
      snapPoints={['60%']}>
      <Sheet.ScrollView contentContainerStyle={styles.container}>
        {renderVisionToggle()}

        <Divider style={styles.divider} />

        {renderProjectionModelSelector()}
      </Sheet.ScrollView>

      <Sheet.Actions style={styles.actionsContainer}>
        <Button mode="text" onPress={onClose} disabled={isDownloading}>
          {l10n.common.cancel}
        </Button>
        <Button
          mode="contained"
          onPress={handleDownload}
          loading={isDownloading}
          disabled={isDownloading}>
          {isDownloading ? (
            <ActivityIndicator size="small" color={theme.colors.onPrimary} />
          ) : (
            l10n.models.multimodal.download
          )}
        </Button>
      </Sheet.Actions>
    </Sheet>
  );
};
