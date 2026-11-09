import React, {useContext} from 'react';
import {View} from 'react-native';
import {Text} from 'react-native-paper';
import {observer} from 'mobx-react';

import {BrandMark} from '../BrandMark';
import {useTheme} from '../../hooks';
import {createStyles} from './styles';
import {L10nContext} from '../../utils';

interface VideoPalEmptyPlaceholderProps {
  bottomComponentHeight: number;
}

export const VideoPalEmptyPlaceholder = observer(
  ({bottomComponentHeight}: VideoPalEmptyPlaceholderProps) => {
    const theme = useTheme();
    const l10n = useContext(L10nContext);
    const styles = createStyles({theme});

    return (
      <View
        style={[styles.container, {paddingBottom: bottomComponentHeight + 20}]}>
        <BrandMark size={64} />

        <View style={styles.content}>
          <Text style={styles.title}>{l10n.video.emptyPlaceholder.title}</Text>
          <Text style={styles.subtitle}>
            {l10n.video.emptyPlaceholder.subtitle}
          </Text>

          <View style={styles.experimentalNotice}>
            <Text style={styles.experimentalText}>
              {l10n.video.emptyPlaceholder.experimentalNotice}
            </Text>
          </View>

          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsTitle}>
              {l10n.video.emptyPlaceholder.howToUse}
            </Text>
            <Text style={styles.instructionStep}>
              {l10n.video.emptyPlaceholder.step1}
            </Text>
            <Text style={styles.instructionStep}>
              {l10n.video.emptyPlaceholder.step2}
            </Text>
            <Text style={styles.instructionStep}>
              {l10n.video.emptyPlaceholder.step3}
            </Text>
            <Text style={styles.instructionStep}>
              {l10n.video.emptyPlaceholder.step4}
            </Text>
          </View>
        </View>
      </View>
    );
  },
);
