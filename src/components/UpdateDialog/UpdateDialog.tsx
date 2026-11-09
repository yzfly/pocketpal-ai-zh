import React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Button, Dialog, Portal, ProgressBar, Text} from 'react-native-paper';
import {observer} from 'mobx-react';

import {useTheme} from '../../hooks';
import {updateService} from '../../services';

const formatSize = (bytes?: number) =>
  bytes ? `${(bytes / 1024 / 1024).toFixed(0)} MB` : '';

/** 新版本提示与下载进度（挂在 App 根部） */
export const UpdateDialog: React.FC = observer(() => {
  const theme = useTheme();
  const m = updateService.manifest;
  if (!updateService.dialogVisible || !m) {
    return null;
  }
  const {status, progress, error, forced} = updateService;
  const busy = status === 'downloading' || status === 'verifying';

  let primaryLabel = '立即更新';
  let onPrimary = () => updateService.startDownload();
  if (status === 'downloading') {
    primaryLabel = `下载中 ${Math.round(progress * 100)}%`;
  } else if (status === 'verifying') {
    primaryLabel = '校验中…';
  } else if (status === 'readyToInstall' || status === 'needPermission') {
    primaryLabel = '安装';
    onPrimary = () => updateService.install();
  } else if (status === 'error') {
    primaryLabel = '重试';
  }

  return (
    <Portal>
      <Dialog
        visible
        dismissable={!forced && !busy}
        onDismiss={() => updateService.dismiss()}
        testID="update-dialog">
        <Dialog.Title>发现新版本 {m.versionName}</Dialog.Title>
        <Dialog.Content>
          <ScrollView style={styles.notes}>
            {(m.notes ?? []).map((n, i) => (
              <Text key={i} variant="bodyMedium" style={styles.note}>
                · {n}
              </Text>
            ))}
          </ScrollView>
          {m.size ? (
            <Text
              variant="bodySmall"
              style={{color: theme.colors.onSurfaceVariant}}>
              安装包 {formatSize(m.size)}，建议在 Wi-Fi 下更新
            </Text>
          ) : null}
          {busy && (
            <View style={styles.progress}>
              <ProgressBar
                progress={progress}
                indeterminate={status === 'verifying'}
                testID="update-progress"
              />
            </View>
          )}
          {status === 'needPermission' && (
            <Text variant="bodySmall" style={styles.hint}>
              请在设置中允许“安装未知应用”，返回后点“安装”。
            </Text>
          )}
          {error && (
            <Text variant="bodySmall" style={{color: theme.colors.error}}>
              {error}
            </Text>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          {!forced && !busy && (
            <>
              <Button
                onPress={() => updateService.dismiss(true)}
                testID="update-skip">
                忽略此版本
              </Button>
              <Button
                onPress={() => updateService.dismiss()}
                testID="update-later">
                以后再说
              </Button>
            </>
          )}
          <Button
            mode="contained"
            onPress={onPrimary}
            disabled={busy}
            testID="update-confirm">
            {primaryLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
});

const styles = StyleSheet.create({
  notes: {maxHeight: 220, marginBottom: 8},
  note: {marginBottom: 4},
  progress: {marginTop: 12},
  hint: {marginTop: 8},
});
