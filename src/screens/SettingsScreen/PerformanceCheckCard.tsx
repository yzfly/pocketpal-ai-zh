import React, {useCallback, useContext, useEffect, useState} from 'react';
import {View} from 'react-native';

import {observer} from 'mobx-react-lite';
import DeviceInfo from 'react-native-device-info';
import {Button, Card, Text} from 'react-native-paper';

import {useTheme} from '../../hooks';
import {t} from '../../locales';
import {modelStore} from '../../store';
import {L10nContext} from '../../utils';
import {getCpuInfo} from '../../utils/deviceCapabilities';
import {getAvailableDevices} from '../../utils/deviceSelection';
import {memoryBand, type PerfParams} from '../../utils/perfProfile';

import {createStyles} from './styles';

interface Probe {
  band: string;
  cores: number;
  perfCores?: number;
  accel: 'npu' | 'gpu' | 'cpu';
  rec: PerfParams;
}

/**
 * 设置页“性能自检”：显示本机检测结果与推荐参数，一键应用。
 * 首次启动已自动应用过一次；上次加载被系统杀掉时这里会提示已自动调低。
 */
export const PerformanceCheckCard: React.FC = observer(() => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const l10n = useContext(L10nContext);
  const copy = l10n.settings.perfCheck;
  const [probe, setProbe] = useState<Probe | null>(null);
  const [applied, setApplied] = useState(false);

  const runProbe = useCallback(async () => {
    const [total, cpu, devices, rec] = await Promise.all([
      DeviceInfo.getTotalMemory(),
      getCpuInfo(),
      getAvailableDevices(),
      modelStore.getRecommendedPerfParams(),
    ]);
    const accel = devices.some(d => d.deviceName?.startsWith('HTP'))
      ? 'npu'
      : devices.some(d => d.type === 'gpu')
        ? 'gpu'
        : 'cpu';
    setProbe({
      band: memoryBand(total),
      cores: cpu?.cores ?? 0,
      perfCores: cpu?.perfCoreCount,
      accel,
      rec,
    });
  }, []);

  useEffect(() => {
    runProbe().catch(e => console.warn('[PerformanceCheckCard] probe:', e));
  }, [runProbe]);

  const params = modelStore.contextInitParams;
  const matches =
    probe !== null &&
    params.n_ctx === probe.rec.n_ctx &&
    params.n_batch === probe.rec.n_batch &&
    params.n_ubatch === probe.rec.n_ubatch &&
    params.n_threads === probe.rec.n_threads;

  const handleApply = async () => {
    await modelStore.applyRecommendedPerfParams();
    setApplied(true);
  };

  const muted = {color: theme.colors.onSurfaceVariant};

  return (
    <Card elevation={0} style={styles.card} testID="perf-check-card">
      <Card.Title
        title={copy.title}
        titleStyle={styles.cardTitle}
        style={styles.cardTitleContainer}
      />
      <Card.Content>
        <View style={styles.settingItemContainer}>
          <Text style={muted}>{copy.subtitle}</Text>
          {modelStore.perfSteppedDown && (
            <Text testID="perf-stepped-down" style={styles.textDescription}>
              {copy.steppedDown}
            </Text>
          )}
          {probe && (
            <View testID="perf-probe">
              <Text>
                {t(copy.device, {
                  memory: probe.band,
                  cores: String(probe.cores),
                  perfCores: String(probe.perfCores ?? probe.cores),
                  accel: copy.accel[probe.accel],
                })}
              </Text>
              <Text style={muted}>
                {t(copy.recommended, {
                  ctx: String(probe.rec.n_ctx),
                  batch: String(probe.rec.n_batch),
                  threads: String(probe.rec.n_threads),
                })}
              </Text>
            </View>
          )}
          <Button
            testID="perf-apply"
            mode={matches ? 'outlined' : 'contained'}
            disabled={!probe}
            onPress={handleApply}
            style={[styles.menuButton, styles.cardActionButton]}>
            {matches || applied ? copy.applied : copy.apply}
          </Button>
        </View>
      </Card.Content>
    </Card>
  );
});
