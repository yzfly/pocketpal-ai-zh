import type {Voice} from '../../types';

/**
 * 口袋AI：Kokoro v1.1-zh 的中文声音（精选 4 女 4 男）。
 * 上游共 100 个编号声音，这里只放听感较稳的几个，按需再加。
 */
const zh = (id: string, name: string, gender: 'f' | 'm'): Voice => ({
  id,
  name,
  engine: 'kokoroZh',
  language: 'zh',
  gender,
});

export const KOKORO_ZH_VOICES: Voice[] = [
  zh('zf_001', '女声 1', 'f'),
  zh('zf_002', '女声 2', 'f'),
  zh('zf_003', '女声 3', 'f'),
  zh('zf_004', '女声 4', 'f'),
  zh('zm_009', '男声 1', 'm'),
  zh('zm_010', '男声 2', 'm'),
  zh('zm_011', '男声 3', 'm'),
  zh('zm_012', '男声 4', 'm'),
];
