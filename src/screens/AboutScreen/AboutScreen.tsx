import React, {useContext, useMemo, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  Share,
} from 'react-native';

import DeviceInfo from 'react-native-device-info';
import {observer} from 'mobx-react';
import Clipboard from '@react-native-clipboard/clipboard';
import {Text, Button, SegmentedButtons} from 'react-native-paper';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import {submitFeedback} from '../../api/feedback';
import phononNotices from '../../assets/licenses/phononThirdPartyNotices.json';
import {APP_DOWNLOAD_URL, REPO_URL} from '../../config/urls';

import {
  ChatIcon,
  ChevronRightIcon,
  CopyIcon,
  GithubIcon,
  LinkExternalIcon,
  PlayIcon,
  RefreshIcon,
  ShareIcon,
} from '../../assets/icons';

import {BrandMark, Sheet, TextInput} from '../../components';
import {useTheme} from '../../hooks';
import {createStyles} from './styles';
import {L10nContext} from '../../utils';
import {uiStore} from '../../store';
import {updateService} from '../../services';
import {reflowNotice} from './reflowNotice';

type RowIcon = React.ComponentType<{
  width?: number;
  height?: number;
  stroke?: string;
}>;

interface AboutRowProps {
  icon: RowIcon;
  label: string;
  /** 行尾：进入下一层、跳到 App 外、复制，或一段状态文字 */
  trailing: 'chevron' | 'external' | 'copy';
  status?: string;
  loading?: boolean;
  last?: boolean;
  role?: 'button' | 'link';
  onPress: () => void;
  testID?: string;
}

const TRAILING_ICONS: Record<AboutRowProps['trailing'], RowIcon> = {
  chevron: ChevronRightIcon,
  external: LinkExternalIcon,
  copy: CopyIcon,
};

/** 关于页的一行操作：左图标、文字、行尾图标，整行可点（≥56dp） */
const AboutRow: React.FC<
  AboutRowProps & {styles: ReturnType<typeof createStyles>}
> = ({
  icon: Icon,
  label,
  trailing,
  status,
  loading,
  last,
  role = 'button',
  onPress,
  testID,
  styles,
}) => {
  const theme = useTheme();
  const Trailing = TRAILING_ICONS[trailing];
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={{disabled: !!loading}}
      disabled={loading}
      onPress={onPress}
      android_ripple={{color: theme.colors.surfaceVariant}}
      style={({pressed}) => [
        styles.row,
        !last && styles.rowDivider,
        pressed && styles.rowPressed,
      ]}
      testID={testID}>
      <Icon width={20} height={20} stroke={theme.colors.onSurface} />
      <Text style={styles.rowLabel} numberOfLines={2}>
        {label}
      </Text>
      {status ? (
        <Text style={styles.rowStatus} numberOfLines={1}>
          {status}
        </Text>
      ) : null}
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.onSurfaceVariant} />
      ) : (
        <Trailing
          width={18}
          height={18}
          stroke={theme.colors.onSurfaceVariant}
        />
      )}
    </Pressable>
  );
};

export const AboutScreen: React.FC = observer(() => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);
  const l10n = useContext(L10nContext);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showNotices, setShowNotices] = useState(false);
  const noticeSections = useMemo(() => phononNotices.map(reflowNotice), []);
  const [legalItemTops, setLegalItemTops] = useState<Record<number, number>>(
    {},
  );

  const legalLinks: {
    id: 'privacy' | 'terms' | 'notices';
    label: string;
    role: 'link' | 'button';
    onPress: () => void;
    testID?: string;
  }[] = [
    {
      id: 'privacy',
      label: l10n.about.privacyPolicy,
      role: 'link',
      onPress: () => Linking.openURL('https://pocketpal.dev/privacy-policy'),
    },
    {
      id: 'terms',
      label: l10n.about.termsOfService,
      role: 'link',
      onPress: () => Linking.openURL('https://pocketpal.dev/terms'),
    },
    {
      id: 'notices',
      label: l10n.about.openSourceNotices,
      role: 'button',
      onPress: () => setShowNotices(true),
      testID: 'about-open-source-notices',
    },
  ];

  const [appInfo, setAppInfo] = React.useState({
    version: '',
    build: '',
  });

  const [useCase, setUseCase] = useState('');
  const [featureRequests, setFeatureRequests] = useState('');
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [usageFrequency, setUsageFrequency] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    const version = DeviceInfo.getVersion();
    const buildNumber = DeviceInfo.getBuildNumber();
    setAppInfo({
      version,
      build: buildNumber,
    });
  }, []);

  const copyVersionToClipboard = () => {
    const versionString = `Version ${appInfo.version} (${appInfo.build})`;
    Clipboard.setString(versionString);
    Alert.alert(
      l10n.about.versionCopiedTitle,
      l10n.about.versionCopiedDescription,
    );
  };

  const handleSubmit = async () => {
    if (!useCase && !featureRequests && !generalFeedback) {
      Alert.alert(l10n.feedback.validation.required);
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedback({
        useCase,
        featureRequests,
        generalFeedback,
        usageFrequency,
      });
      Alert.alert('Success', l10n.feedback.success);
      setShowFeedback(false);
      // Clear form
      setUseCase('');
      setFeatureRequests('');
      setGeneralFeedback('');
      setUsageFrequency('');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : l10n.feedback.error.general;
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <View style={styles.hero}>
            <BrandMark size={72} />
            <Text variant="titleLarge" style={styles.title}>
              口袋AI
            </Text>
            <Text
              variant="bodyMedium"
              textBreakStrategy="balanced"
              style={styles.heroDescription}>
              {l10n.about.description}
            </Text>
            <TouchableOpacity
              style={styles.versionButton}
              accessibilityRole="button"
              hitSlop={{top: 6, bottom: 6}}
              onPress={copyVersionToClipboard}>
              <Text style={styles.versionText}>
                v{appInfo.version} ({appInfo.build})
              </Text>
              <CopyIcon
                width={14}
                height={14}
                stroke={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          {updateService.supported && (
            <View style={styles.section}>
              <AboutRow
                styles={styles}
                icon={RefreshIcon}
                label={l10n.about.checkUpdate}
                trailing="chevron"
                status={
                  updateService.status === 'upToDate'
                    ? l10n.about.upToDate
                    : undefined
                }
                loading={updateService.status === 'checking'}
                last
                testID="about-check-update"
                onPress={async () => {
                  const found = await updateService.check();
                  if (found) {
                    updateService.showDialog();
                  } else if (updateService.error) {
                    Alert.alert(l10n.about.checkUpdate, updateService.error);
                  }
                }}
              />
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{l10n.about.supportProject}</Text>
            <Text variant="bodyMedium" style={styles.description}>
              {l10n.about.supportProjectDescription}
            </Text>
            <AboutRow
              styles={styles}
              icon={ShareIcon}
              label={l10n.about.shareApp}
              trailing="chevron"
              testID="about-share-app"
              onPress={() => {
                Share.share({
                  message: l10n.about.shareAppMessage.replace(
                    '{{url}}',
                    APP_DOWNLOAD_URL,
                  ),
                }).catch(() => {});
              }}
            />
            <AboutRow
              styles={styles}
              icon={GithubIcon}
              label={l10n.about.githubButton}
              trailing="external"
              role="link"
              onPress={() => Linking.openURL(REPO_URL)}
            />
            <AboutRow
              styles={styles}
              icon={ChatIcon}
              label={l10n.feedback.shareThoughtsButton}
              trailing="chevron"
              last
              onPress={() => setShowFeedback(true)}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{l10n.about.chineseEdition}</Text>
            <Text variant="bodyMedium" style={styles.description}>
              {l10n.about.chineseEditionDescription}
            </Text>
            <AboutRow
              styles={styles}
              icon={GithubIcon}
              label={l10n.about.chineseEditionGithubButton}
              trailing="external"
              role="link"
              onPress={() =>
                Linking.openURL('https://github.com/yzfly/pocketpal-ai-zh')
              }
            />
            <AboutRow
              styles={styles}
              icon={ChatIcon}
              label={l10n.about.chineseEditionWechatButton}
              trailing="copy"
              last
              onPress={() => {
                Clipboard.setString('云中江树');
                Alert.alert(
                  l10n.about.chineseEditionWechatCopiedTitle,
                  l10n.about.chineseEditionWechatCopiedDescription,
                );
              }}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{l10n.about.tour}</Text>
            <Text variant="bodyMedium" style={styles.description}>
              {l10n.about.tourDescription}
            </Text>
            <AboutRow
              styles={styles}
              icon={PlayIcon}
              label={l10n.about.showIntroButton}
              trailing="chevron"
              last
              onPress={() => uiStore.replayOnboarding()}
            />
          </View>

          <View style={styles.legalRow}>
            {legalLinks.map((link, i) => (
              <View
                key={link.id}
                style={styles.legalItem}
                testID={`about-legal-item-${i}`}
                onLayout={e => {
                  const {y} = e.nativeEvent.layout;
                  setLegalItemTops(tops =>
                    tops[i] === y ? tops : {...tops, [i]: y},
                  );
                }}>
                <Pressable
                  accessibilityRole={link.role}
                  onPress={link.onPress}
                  style={styles.legalHit}
                  testID={link.testID}>
                  <Text style={styles.legalLink}>{link.label}</Text>
                </Pressable>
                {i < legalLinks.length - 1 ? (
                  <Text
                    style={[
                      styles.legalSeparator,
                      legalItemTops[i] !== legalItemTops[i + 1] &&
                        styles.legalSeparatorHidden,
                    ]}
                    importantForAccessibility="no"
                    accessibilityElementsHidden>
                    ·
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Sheet
        title={l10n.feedback.title}
        isVisible={showFeedback}
        displayFullHeight
        onClose={() => setShowFeedback(false)}>
        <Sheet.ScrollView contentContainerStyle={styles.feedbackForm}>
          <View style={styles.field}>
            <Text style={styles.label}>{l10n.feedback.useCase.label}</Text>
            <TextInput
              defaultValue={useCase}
              onChangeText={setUseCase}
              placeholder={l10n.feedback.useCase.placeholder}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              {l10n.feedback.featureRequests.label}
            </Text>
            <TextInput
              defaultValue={featureRequests}
              onChangeText={setFeatureRequests}
              placeholder={l10n.feedback.featureRequests.placeholder}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              {l10n.feedback.generalFeedback.label}
            </Text>
            <TextInput
              defaultValue={generalFeedback}
              onChangeText={setGeneralFeedback}
              placeholder={l10n.feedback.generalFeedback.placeholder}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              {l10n.feedback.usageFrequency.label}
            </Text>
            <SegmentedButtons
              value={usageFrequency}
              onValueChange={setUsageFrequency}
              buttons={[
                {
                  value: 'daily',
                  label: l10n.feedback.usageFrequency.options.daily,
                },
                {
                  value: 'weekly',
                  label: l10n.feedback.usageFrequency.options.weekly,
                },
                {
                  value: 'monthly',
                  label: l10n.feedback.usageFrequency.options.monthly,
                },
                {
                  value: 'rarely',
                  label: l10n.feedback.usageFrequency.options.rarely,
                },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
        </Sheet.ScrollView>
        <Sheet.Actions>
          <View style={styles.secondaryButtons}>
            <Button mode="text" onPress={() => setShowFeedback(false)}>
              {l10n.common.cancel}
            </Button>
          </View>
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}>
            {l10n.feedback.submit}
          </Button>
        </Sheet.Actions>
      </Sheet>

      <Sheet
        title={l10n.about.openSourceNotices}
        isVisible={showNotices}
        displayFullHeight
        onClose={() => setShowNotices(false)}>
        <Sheet.ScrollView
          contentContainerStyle={styles.noticesContent}
          testID="about-open-source-notices-sheet">
          <Text style={styles.noticesCredit}>
            {l10n.about.phononNoticesCredit}
          </Text>
          {noticeSections.map((section, i) => (
            <Text key={i} selectable style={styles.noticesText}>
              {section}
            </Text>
          ))}
        </Sheet.ScrollView>
      </Sheet>
    </SafeAreaView>
  );
});
