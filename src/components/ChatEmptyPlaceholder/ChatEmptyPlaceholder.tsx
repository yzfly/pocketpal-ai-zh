import React, {useContext} from 'react';
import {View} from 'react-native';
import {Button, Text} from 'react-native-paper';
import {observer} from 'mobx-react';

import {BrandMark} from '../BrandMark';
import {useTheme} from '../../hooks';
import {createStyles} from './styles';
import {modelStore, palStore} from '../../store';
import {useNavigation} from '@react-navigation/native';
import {NavigationProp} from '@react-navigation/native';
import {L10nContext} from '../../utils';

interface ChatEmptyPlaceholderProps {
  onSelectModel: () => void;
  bottomComponentHeight: number;
}

export const ChatEmptyPlaceholder = observer(
  ({onSelectModel, bottomComponentHeight}: ChatEmptyPlaceholderProps) => {
    const theme = useTheme();
    const navigation = useNavigation<NavigationProp<any>>();
    const l10n = useContext(L10nContext);
    const styles = createStyles({theme});

    const hasAvailableModels = modelStore.availableModels.length > 0;
    const hasActiveModel = modelStore.activeModelId !== undefined;
    // When the user lands here from onboarding-finish, the pal exists
    // and its defaultModel is downloading. The DownloadOverlay banner is
    // already showing progress at the top of the screen — the empty
    // state's job is just to telegraph "your pal is on the way, no
    // model picker needed."
    const pendingPalDownload = modelStore.activeDownloads
      .map(d =>
        palStore.pals.find(
          p =>
            p.source === 'local' &&
            p.defaultModel &&
            p.defaultModel.id === d.modelId,
        ),
      )
      .find(p => p !== undefined);

    const getContent = () => {
      if (pendingPalDownload) {
        return {
          title:
            l10n.components.chatEmptyPlaceholder.gettingReadyTitle?.replace(
              '{{name}}',
              pendingPalDownload.name,
            ) ?? `${pendingPalDownload.name} is getting ready`,
          description:
            l10n.components.chatEmptyPlaceholder.gettingReadyDescription ??
            'We’ll let you know the moment your pal can chat. Tap the banner up top to see how it’s going.',
          buttonText: null,
          onPress: () => {},
        };
      }

      if (!hasAvailableModels) {
        return {
          title: l10n.components.chatEmptyPlaceholder.noModelsTitle,
          description: l10n.components.chatEmptyPlaceholder.noModelsDescription,
          buttonText: l10n.components.chatEmptyPlaceholder.noModelsButton,
          onPress: () => {
            navigation.navigate('Models');
          },
        };
      }

      return {
        title: l10n.components.chatEmptyPlaceholder.activateModelTitle,
        description:
          l10n.components.chatEmptyPlaceholder.activateModelDescription,
        buttonText: l10n.components.chatEmptyPlaceholder.activateModelButton,
        onPress: onSelectModel,
      };
    };

    const {title, description, buttonText, onPress} = getContent();

    if (hasActiveModel) {
      // 已加载模型的新对话：简洁的就绪提示，替代原来的空白页
      const copy = l10n.components.chatEmptyPlaceholder;
      const modelName = modelStore.activeModel?.name ?? '';
      return (
        <View
          testID="chat-ready-placeholder"
          style={[
            styles.container,
            {marginBottom: bottomComponentHeight + 100},
          ]}>
          <BrandMark size={56} />
          <View>
            <Text style={styles.title}>
              {copy.readyTitle.replace('{{name}}', modelName)}
            </Text>
            <Text style={styles.description}>{copy.readyDescription}</Text>
          </View>
        </View>
      );
    }
    return (
      <View
        style={[styles.container, {marginBottom: bottomComponentHeight + 100}]}>
        <BrandMark size={72} />
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        {buttonText ? (
          <Button
            mode="contained"
            onPress={onPress}
            style={styles.button}
            loading={modelStore.isContextLoading}
            disabled={hasActiveModel}>
            {modelStore.isContextLoading
              ? l10n.components?.chatEmptyPlaceholder?.loading
              : buttonText}
          </Button>
        ) : null}
      </View>
    );
  },
);
