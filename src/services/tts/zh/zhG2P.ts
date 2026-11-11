// 口袋AI：Kokoro v1.1-zh 的中文音素化，移植自 misaki 0.9.4 的 ZHG2P(version='1.1')
// 与 ZHFrontend / ToneSandhi（Apache-2.0，源自 PaddleSpeech）。
//
// 输出格式与 misaki 相同：每个汉字写成“声母 + 韵母 + 声调数字”，韵母里的复合
// 韵母用 Kokoro 词表里的专用字（言、万、应……）；同一词内连写，词与词之间用 “/”，
// 标点保留为 ASCII。拼音来自 pinyin-pro（取未变调的字典读音），分词用精简
// jieba 词典，变调、儿化规则照搬 misaki。

import {customPinyin, pinyin} from 'pinyin-pro';

import {JiebaSegmenter, type SegToken} from './jiebaSegmenter';
import {
  MUST_NEUTRAL_TONE_WORDS,
  MUST_NOT_NEUTRAL_TONE_WORDS,
} from './neutralToneWords';
import {an2cn} from './zhNumbers';

const ZH_MAP: Record<string, string> = {
  b: 'ㄅ',
  p: 'ㄆ',
  m: 'ㄇ',
  f: 'ㄈ',
  d: 'ㄉ',
  t: 'ㄊ',
  n: 'ㄋ',
  l: 'ㄌ',
  g: 'ㄍ',
  k: 'ㄎ',
  h: 'ㄏ',
  j: 'ㄐ',
  q: 'ㄑ',
  x: 'ㄒ',
  zh: 'ㄓ',
  ch: 'ㄔ',
  sh: 'ㄕ',
  r: 'ㄖ',
  z: 'ㄗ',
  c: 'ㄘ',
  s: 'ㄙ',
  a: 'ㄚ',
  o: 'ㄛ',
  e: 'ㄜ',
  ie: 'ㄝ',
  ai: 'ㄞ',
  ei: 'ㄟ',
  ao: 'ㄠ',
  ou: 'ㄡ',
  an: 'ㄢ',
  en: 'ㄣ',
  ang: 'ㄤ',
  eng: 'ㄥ',
  er: 'ㄦ',
  i: 'ㄧ',
  u: 'ㄨ',
  v: 'ㄩ',
  ii: 'ㄭ',
  iii: '十',
  ve: '月',
  ia: '压',
  ian: '言',
  iang: '阳',
  iao: '要',
  in: '阴',
  ing: '应',
  iong: '用',
  iou: '又',
  ong: '中',
  ua: '穵',
  uai: '外',
  uan: '万',
  uang: '王',
  uei: '为',
  uen: '文',
  ueng: '瓮',
  uo: '我',
  van: '元',
  vn: '云',
};
for (const p of ';:,.!?/—…"()“” 12345R') {
  ZH_MAP[p] = p;
}

const PUNC = new Set(';:,.!?—…"()“”');
const SANDHI_PUNC = "、：，；。？！“”‘’':,;.?!";
const X_ENG = new Set(['x', 'eng']);
const BU = '不';
const YI = '一';

const MUST_ERHUA = new Set([
  '小院儿',
  '胡同儿',
  '范儿',
  '老汉儿',
  '撒欢儿',
  '寻老礼儿',
  '妥妥儿',
  '媳妇儿',
]);
const NOT_ERHUA = new Set(
  (
    '虐儿 为儿 护儿 瞒儿 救儿 替儿 有儿 一儿 我儿 俺儿 妻儿 拐儿 聋儿 乞儿 患儿 幼儿 孤儿 ' +
    '婴儿 婴幼儿 连体儿 脑瘫儿 流浪儿 体弱儿 混血儿 蜜雪儿 舫儿 祖儿 美儿 应采儿 可儿 侄儿 ' +
    '孙儿 侄孙儿 女儿 男儿 红孩儿 花儿 虫儿 马儿 鸟儿 猪儿 猫儿 狗儿 少儿'
  ).split(' '),
);

/** misaki ZHFrontend 的特例读音（词 → 每字 [声母, 带调韵母]） */
const PHRASE_OVERRIDES: Record<string, string[]> = {
  开户行: ['kai1', 'hu4', 'hang2'],
  发卡行: ['fa4', 'ka3', 'hang2'],
  放款行: ['fang4', 'kuan3', 'hang2'],
  茧行: ['jian3', 'hang2'],
  行号: ['hang2', 'hao4'],
  各地: ['ge4', 'di4'],
  借还款: ['jie4', 'huan2', 'kuan3'],
  时间为: ['shi2', 'jian1', 'wei2'],
  为准: ['wei2', 'zhun3'],
  色差: ['se4', 'cha1'],
  嗲: ['dia3'],
  呗: ['bei5'],
  不: ['bu4'],
  咗: ['zuo5'],
  嘞: ['lei5'],
  掺和: ['chan1', 'huo5'],
};

const INITIALS = [
  'zh',
  'ch',
  'sh',
  'b',
  'p',
  'm',
  'f',
  'd',
  't',
  'n',
  'l',
  'g',
  'k',
  'h',
  'j',
  'q',
  'x',
  'r',
  'z',
  'c',
  's',
];

const Y_FINALS: Record<string, string> = {
  yi: 'i',
  ya: 'ia',
  yan: 'ian',
  yang: 'iang',
  yao: 'iao',
  ye: 'ie',
  yin: 'in',
  ying: 'ing',
  yong: 'iong',
  you: 'iou',
  yu: 'v',
  yue: 've',
  yuan: 'van',
  yun: 'vn',
  yo: 'o',
  wu: 'u',
  wa: 'ua',
  wo: 'uo',
  wai: 'uai',
  wei: 'uei',
  wan: 'uan',
  wen: 'uen',
  wang: 'uang',
  weng: 'ueng',
};

/**
 * 带数字调的拼音（ü 写作 v，轻声为 0 或 5）拆成 pypinyin 严格模式的
 * [声母, 韵母+调]，如 zhong1 → ['zh', 'ong1']，you3 → ['', 'iou3']。
 */
export function splitSyllable(py: string): [string, string] {
  const m = /^([a-zü:v]+)([0-5]?)$/.exec(
    py.toLowerCase().replace(/ü|u:/g, 'v'),
  );
  if (!m) {
    return ['', ''];
  }
  const base = m[1];
  const tone = !m[2] || m[2] === '0' ? '5' : m[2];
  if (base in Y_FINALS) {
    return ['', Y_FINALS[base] + tone];
  }
  if (base === 'n' || base === 'ng' || base === 'm' || base === 'hm') {
    // 嗯/呣：misaki 统一写作 n2
    return ['', 'n2'];
  }
  if (base === 'er') {
    return ['', 'er' + tone];
  }
  const ini = INITIALS.find(i => base.startsWith(i) && base.length > i.length);
  if (!ini) {
    return ['', base + tone];
  }
  let fin = base.slice(ini.length);
  if (ini === 'j' || ini === 'q' || ini === 'x') {
    if (fin.startsWith('u')) {
      fin = 'v' + fin.slice(1);
    }
  }
  if (fin === 'iu') {
    fin = 'iou';
  } else if (fin === 'ui') {
    fin = 'uei';
  } else if (fin === 'un') {
    fin = 'uen';
  }
  if (fin === 'i') {
    if (ini === 'z' || ini === 'c' || ini === 's') {
      fin = 'ii';
    } else if (ini === 'zh' || ini === 'ch' || ini === 'sh' || ini === 'r') {
      fin = 'iii';
    }
  }
  return [ini, fin + tone];
}

/**
 * pinyin-pro 读错的常用词（与 pypinyin/规范读音对照语料核出），首次使用时注册。
 * 只收确定的词级读音；单字多音（为、长、调…）仍交给上下文判断。
 */
const PINYIN_FIXES: Record<string, string> = {
  任务: 'rèn wù',
  向量: 'xiàng liàng',
  量化: 'liàng huà',
  重置: 'chóng zhì',
  重试: 'chóng shì',
  重启: 'chóng qǐ',
  重连: 'chóng lián',
  重新: 'chóng xīn',
  重复: 'chóng fù',
  重命名: 'chóng mìng míng',
  重写: 'chóng xiě',
  重做: 'chóng zuò',
  重建: 'chóng jiàn',
  重装: 'chóng zhuāng',
  重来: 'chóng lái',
  并重: 'bìng zhòng',
  命令行: 'mìng lìng háng',
  排行榜: 'pái háng bǎng',
  排行: 'pái háng',
  银行: 'yín háng',
  只读: 'zhǐ dú',
  只能: 'zhǐ néng',
  只是: 'zhǐ shì',
  只有: 'zhǐ yǒu',
  只要: 'zhǐ yào',
  只需: 'zhǐ xū',
  只会: 'zhǐ huì',
  只在: 'zhǐ zài',
  只用: 'zhǐ yòng',
  只留: 'zhǐ liú',
  只想: 'zhǐ xiǎng',
  只好: 'zhǐ hǎo',
  提供: 'tí gōng',
  以供: 'yǐ gōng',
  粘贴: 'zhān tiē',
  切换: 'qiē huàn',
  文件夹: 'wén jiàn jiā',
  留空: 'liú kòng',
  调整: 'tiáo zhěng',
  调节: 'tiáo jié',
  调低: 'tiáo dī',
  调高: 'tiáo gāo',
  调用: 'diào yòng',
  华为: 'huá wéi',
  转为: 'zhuǎn wéi',
  身处: 'shēn chǔ',
  指数: 'zhǐ shù',
  数据: 'shù jù',
  分析: 'fēn xī',
  分享: 'fēn xiǎng',
  分块: 'fēn kuài',
};
let pinyinFixesRegistered = false;
function ensurePinyinFixes() {
  if (!pinyinFixesRegistered) {
    customPinyin(PINYIN_FIXES);
    pinyinFixesRegistered = true;
  }
}

/** 词尾“量”表示数量时读 liàng（pinyin-pro 常读成 liáng） */
const LIANG2_WORDS = new Set([
  '测量',
  '丈量',
  '商量',
  '思量',
  '打量',
  '估量',
  '衡量',
  '较量',
  '酌量',
  '掂量',
  '度量',
]);

const isHan = (c: string) => c >= '\u4E00' && c <= '\u9FFF';
const isNumeric = (c: string) =>
  /[0-9]/.test(c) || '零一二三四五六七八九十百千万亿两〇'.includes(c);
const setTone = (f: string, tone: string) => f.slice(0, -1) + tone;
const allToneThree = (fs: string[]) => fs.every(f => f.endsWith('3'));

/** 一句里每个字的字典读音（未变调），用整句上下文判多音字 */
function sentencePinyin(text: string): string[] {
  ensurePinyinFixes();
  const items = pinyin(text, {
    type: 'all',
    toneType: 'num',
    v: true,
    toneSandhi: false,
  }) as Array<{origin: string; pinyin: string; num: number; isZh: boolean}>;
  // 按 UTF-16 码元对齐（表情等代理对占两位），与 string.slice 的下标一致
  const out: string[] = [];
  for (const it of items) {
    out.push(it.isZh && it.pinyin ? it.pinyin : '');
    for (let k = 1; k < it.origin.length; k++) {
      out.push('');
    }
  }
  return out;
}

export class ZhG2P {
  constructor(private seg: JiebaSegmenter) {}

  // ---------------- 分词后合并（tone_sandhi.pre_merge_for_modify） ----------

  private mergeBu(seg: SegToken[]): SegToken[] {
    const out: SegToken[] = [];
    for (let i = 0; i < seg.length; i++) {
      let {word} = seg[i];
      const {pos} = seg[i];
      if (!X_ENG.has(pos) && i > 0 && seg[i - 1].word === BU) {
        word = BU + word;
      }
      const nextPos = i + 1 < seg.length ? seg[i + 1].pos : null;
      if (word !== BU || nextPos === null || X_ENG.has(nextPos)) {
        out.push({word, pos});
      }
    }
    return out;
  }

  private mergeYi(seg: SegToken[]): SegToken[] {
    let out: SegToken[] = [];
    let skip = false;
    for (let i = 0; i < seg.length; i++) {
      if (skip) {
        skip = false;
        continue;
      }
      const {word, pos} = seg[i];
      if (
        i - 1 >= 0 &&
        word === YI &&
        i + 1 < seg.length &&
        seg[i - 1].word === seg[i + 1].word &&
        seg[i - 1].pos === 'v' &&
        !X_ENG.has(seg[i + 1].pos)
      ) {
        const last = out[out.length - 1];
        out[out.length - 1] = {
          word: last.word + YI + seg[i + 1].word,
          pos: last.pos,
        };
        skip = true;
      } else {
        out.push({word, pos});
      }
    }
    const second: SegToken[] = [];
    for (const {word, pos} of out) {
      const last = second[second.length - 1];
      if (last && last.word === YI && !X_ENG.has(pos)) {
        second[second.length - 1] = {word: last.word + word, pos: last.pos};
      } else {
        second.push({word, pos});
      }
    }
    out = second;
    return out;
  }

  private mergeReduplication(seg: SegToken[]): SegToken[] {
    const out: SegToken[] = [];
    for (const {word, pos} of seg) {
      const last = out[out.length - 1];
      if (last && word === last.word && !X_ENG.has(pos)) {
        last.word += word;
      } else {
        out.push({word, pos});
      }
    }
    return out;
  }

  private wordFinals(word: string, pys: string[]): string[] {
    return [...word].map((c, i) =>
      c === '嗯' ? 'n2' : splitSyllable(pys[i] || '')[1] || '0',
    );
  }

  private mergeThree(
    seg: SegToken[],
    pyOf: (w: string) => string[],
    both: boolean,
  ): SegToken[] {
    const finals = seg.map(({word, pos}) =>
      X_ENG.has(pos) ? ['0'] : this.wordFinals(word, pyOf(word)),
    );
    const out: SegToken[] = [];
    const mergedLast = new Array(seg.length).fill(false);
    for (let i = 0; i < seg.length; i++) {
      const {word, pos} = seg[i];
      const cond =
        !X_ENG.has(pos) &&
        i - 1 >= 0 &&
        !mergedLast[i - 1] &&
        (both
          ? allToneThree(finals[i - 1]) && allToneThree(finals[i])
          : finals[i - 1][finals[i - 1].length - 1].endsWith('3') &&
            finals[i][0].endsWith('3'));
      if (cond) {
        const prev = seg[i - 1].word;
        const redup = prev.length === 2 && prev[0] === prev[1];
        if (!redup && prev.length + word.length <= 3) {
          out[out.length - 1].word += word;
          mergedLast[i] = true;
          continue;
        }
      }
      out.push({word, pos});
    }
    return out;
  }

  private mergeEr(seg: SegToken[]): SegToken[] {
    const out: SegToken[] = [];
    for (let i = 0; i < seg.length; i++) {
      const {word, pos} = seg[i];
      const last = out[out.length - 1];
      if (i - 1 >= 0 && word === '儿' && last && !X_ENG.has(last.pos)) {
        last.word += word;
      } else {
        out.push({word, pos});
      }
    }
    return out;
  }

  // ---------------- 变调（tone_sandhi.modified_tone） ----------------------

  private splitWord(word: string): [string, string] {
    const list = this.seg.cutForSearch(word);
    // Python sorted(key=len) 是稳定排序
    const sorted = list
      .map((w, i) => ({w, i}))
      .sort((a, b) => a.w.length - b.w.length || a.i - b.i)
      .map(x => x.w);
    const first = sorted[0] ?? word;
    if (word.indexOf(first) === 0) {
      return [first, word.slice(first.length)];
    }
    return [word.slice(0, word.length - first.length), first];
  }

  /** 规则修正：词尾数量“量”、单独的结构助词“的/地”、数字里的“一” */
  private fixReadings(
    word: string,
    initials: string[],
    finals: string[],
  ): string[] {
    const n = word.length;
    if (n > 1 && word[n - 1] === '量' && !LIANG2_WORDS.has(word.slice(-2))) {
      finals[n - 1] = 'iang4';
    }
    if (word === '的' || word === '地') {
      initials[0] = 'd';
      finals[0] = 'e5';
    }
    const chars = [...word];
    if (word.includes(YI) && chars.filter(c => c !== YI).every(isNumeric)) {
      for (let i = 0; i + 1 < n; i++) {
        if (word[i] === YI && '百千万亿'.includes(word[i + 1])) {
          finals[i] = '万亿'.includes(word[i + 1]) ? 'i2' : 'i4';
        }
      }
    }
    return finals;
  }

  private buSandhi(word: string, finals: string[]): string[] {
    if (word.length === 3 && word[1] === BU) {
      finals[1] = setTone(finals[1], '5');
    } else {
      for (let i = 0; i < word.length; i++) {
        if (
          word[i] === BU &&
          i + 1 < word.length &&
          finals[i + 1].endsWith('4')
        ) {
          finals[i] = setTone(finals[i], '2');
        }
      }
    }
    return finals;
  }

  private yiSandhi(word: string, finals: string[]): string[] {
    const chars = [...word];
    if (word.includes(YI) && chars.filter(c => c !== YI).every(isNumeric)) {
      return finals;
    }
    if (word.length === 3 && word[1] === YI && word[0] === word[2]) {
      finals[1] = setTone(finals[1], '5');
    } else if (word.startsWith('第一')) {
      finals[1] = setTone(finals[1], '1');
    } else {
      for (let i = 0; i < word.length; i++) {
        if (word[i] === YI && i + 1 < word.length) {
          const t = finals[i + 1].slice(-1);
          if (t === '4' || t === '5') {
            finals[i] = setTone(finals[i], '2');
          } else if (!SANDHI_PUNC.includes(word[i + 1])) {
            finals[i] = setTone(finals[i], '4');
          }
        }
      }
    }
    return finals;
  }

  private neutralSandhi(word: string, pos: string, finals: string[]): string[] {
    if (MUST_NOT_NEUTRAL_TONE_WORDS.has(word)) {
      return finals;
    }
    for (let j = 1; j < word.length; j++) {
      if (word[j] === word[j - 1] && 'nva'.includes(pos[0])) {
        finals[j] = setTone(finals[j], '5');
      }
    }
    const geIdx = word.indexOf('个');
    const last = word[word.length - 1];
    const n = finals.length - 1;
    if ('吧呢啊呐噻嘛吖嗨呐哦哒滴哩哟喽啰耶喔诶'.includes(last)) {
      finals[n] = setTone(finals[n], '5');
    } else if ('的地得'.includes(last)) {
      finals[n] = setTone(finals[n], '5');
    } else if (
      word.length === 1 &&
      '了着过'.includes(word) &&
      ['ul', 'uz', 'ug'].includes(pos)
    ) {
      finals[n] = setTone(finals[n], '5');
    } else if (
      word.length > 1 &&
      '们子'.includes(last) &&
      ['r', 'n'].includes(pos)
    ) {
      finals[n] = setTone(finals[n], '5');
    } else if (
      word.length > 1 &&
      '上下'.includes(last) &&
      ['s', 'l', 'f'].includes(pos)
    ) {
      finals[n] = setTone(finals[n], '5');
    } else if (
      word.length > 1 &&
      '来去'.includes(last) &&
      '上下进出回过起开'.includes(word[word.length - 2])
    ) {
      finals[n] = setTone(finals[n], '5');
    } else if (
      (geIdx >= 1 &&
        (isNumeric(word[geIdx - 1]) ||
          '几有两半多各整每做是'.includes(word[geIdx - 1]))) ||
      word === '个'
    ) {
      finals[geIdx] = setTone(finals[geIdx], '5');
    } else if (
      MUST_NEUTRAL_TONE_WORDS.has(word) ||
      MUST_NEUTRAL_TONE_WORDS.has(word.slice(-2))
    ) {
      finals[n] = setTone(finals[n], '5');
    }

    const [w0, w1] = this.splitWord(word);
    const parts = [finals.slice(0, w0.length), finals.slice(w0.length)];
    [w0, w1].forEach((w, i) => {
      if (
        (MUST_NEUTRAL_TONE_WORDS.has(w) ||
          MUST_NEUTRAL_TONE_WORDS.has(w.slice(-2))) &&
        parts[i].length
      ) {
        const k = parts[i].length - 1;
        parts[i][k] = setTone(parts[i][k], '5');
      }
    });
    return [...parts[0], ...parts[1]];
  }

  private threeSandhi(word: string, finals: string[]): string[] {
    if (word.length === 2 && allToneThree(finals)) {
      finals[0] = setTone(finals[0], '2');
    } else if (word.length === 3) {
      const [w0] = this.splitWord(word);
      if (allToneThree(finals)) {
        if (w0.length === 2) {
          finals[0] = setTone(finals[0], '2');
          finals[1] = setTone(finals[1], '2');
        } else if (w0.length === 1) {
          finals[1] = setTone(finals[1], '2');
        }
      } else {
        const parts = [finals.slice(0, w0.length), finals.slice(w0.length)];
        for (let i = 0; i < 2; i++) {
          const sub = parts[i];
          if (allToneThree(sub) && sub.length === 2) {
            sub[0] = setTone(sub[0], '2');
          } else if (
            i === 1 &&
            !allToneThree(sub) &&
            sub.length &&
            sub[0].endsWith('3') &&
            parts[0].length &&
            parts[0][parts[0].length - 1].endsWith('3')
          ) {
            parts[0][parts[0].length - 1] = setTone(
              parts[0][parts[0].length - 1],
              '2',
            );
          }
        }
        finals = [...parts[0], ...parts[1]];
      }
    } else if (word.length === 4) {
      const parts = [finals.slice(0, 2), finals.slice(2)];
      finals = [];
      for (const sub of parts) {
        if (allToneThree(sub)) {
          sub[0] = setTone(sub[0], '2');
        }
        finals.push(...sub);
      }
    }
    return finals;
  }

  // ---------------- 儿化（ZHFrontend._merge_erhua） ------------------------

  private mergeErhua(
    initials: string[],
    finals: string[],
    word: string,
    pos: string,
  ): [string[], string[]] {
    for (let i = 0; i < finals.length; i++) {
      if (i === finals.length - 1 && word[i] === '儿' && finals[i] === 'er1') {
        finals[i] = 'er2';
      }
    }
    if (
      !MUST_ERHUA.has(word) &&
      (NOT_ERHUA.has(word) || ['a', 'j', 'nr'].includes(pos))
    ) {
      return [initials, finals];
    }
    if (finals.length !== word.length) {
      return [initials, finals];
    }
    const ni: string[] = [];
    const nf: string[] = [];
    for (let i = 0; i < finals.length; i++) {
      const phn = finals[i];
      if (
        i === finals.length - 1 &&
        word[i] === '儿' &&
        (phn === 'er2' || phn === 'er5') &&
        !NOT_ERHUA.has(word.slice(-2)) &&
        nf.length
      ) {
        const prev = nf[nf.length - 1];
        nf[nf.length - 1] = prev.slice(0, -1) + 'R' + prev.slice(-1);
      } else {
        ni.push(initials[i]);
        nf.push(phn);
      }
    }
    return [ni, nf];
  }

  // ---------------- 前端主流程（ZHFrontend.__call__） ----------------------

  /** 纯中文片段（不含拉丁字母）→ Kokoro v1.1-zh 音素 */
  frontend(text: string): string {
    const pys = sentencePinyin(text);
    let raw = this.seg.posCut(text);
    const wordPy = (w: string): string[] => {
      const o = PHRASE_OVERRIDES[w];
      if (o) {
        return o;
      }
      return sentencePinyin(w);
    };

    // 合并（只改词边界、不改字序，之后按文本位置取整句读音）
    raw = this.mergeBu(raw);
    raw = this.mergeYi(raw);
    raw = this.mergeReduplication(raw);
    raw = this.mergeThree(raw, wordPy, true);
    raw = this.mergeThree(raw, wordPy, false);
    raw = this.mergeEr(raw);

    // 重新按顺序对齐整句读音（合并只改变边界，不改变字符顺序）
    const seq: Array<{tk: SegToken; py: string[]}> = [];
    {
      let at = 0;
      for (const tk of raw) {
        seq.push({tk, py: pys.slice(at, at + tk.word.length)});
        at += tk.word.length;
      }
    }

    type Out = {phonemes: string | null; tag: string; whitespace: string};
    const tokens: Out[] = [];
    for (const {tk, py} of seq) {
      let {pos} = tk;
      const {word} = tk;
      const chars = [...word];
      if (pos === 'x' && chars.every(isHan)) {
        pos = 'X';
      } else if (pos !== 'x' && PUNC.has(word)) {
        pos = 'x';
      }
      if (pos === 'x' || pos === 'eng') {
        if (!/^\s+$/.test(word)) {
          if (pos === 'x' && PUNC.has(word)) {
            tokens.push({phonemes: word, tag: pos, whitespace: ''});
          }
          // 其他符号（%、~、表情等）丢弃，不输出未知符号
        } else if (tokens.length) {
          tokens[tokens.length - 1].whitespace += word;
        }
        continue;
      }
      const prev = tokens[tokens.length - 1];
      if (prev && prev.tag !== 'x' && prev.tag !== 'eng' && !prev.whitespace) {
        prev.whitespace = '/';
      }

      // 读音：特例词优先，否则用整句上下文读音
      const override = PHRASE_OVERRIDES[word];
      const sylls = override ?? py;
      let initials: string[] = [];
      let finals: string[] = [];
      chars.forEach((c, i) => {
        const [ini, fin] =
          c === '嗯' ? ['', 'n2'] : splitSyllable(sylls[i] || '');
        initials.push(ini);
        finals.push(fin || '');
      });
      if (finals.some(f => !f)) {
        // 读不出的字（生僻字/符号），跳过该字
        const keep = finals.map(f => !!f);
        initials = initials.filter((_, i) => keep[i]);
        finals = finals.filter((_, i) => keep[i]);
        if (!finals.length) {
          continue;
        }
      } else {
        finals = this.fixReadings(word, initials, finals);
        finals = this.buSandhi(word, finals);
        finals = this.yiSandhi(word, finals);
        finals = this.neutralSandhi(word, pos, finals);
        finals = this.threeSandhi(word, finals);
        [initials, finals] = this.mergeErhua(initials, finals, word, pos);
      }

      const phones: string[] = [];
      initials.forEach((c, i) => {
        if (c) {
          phones.push(c);
        }
        const v = finals[i];
        if (v && (!PUNC.has(v) || v !== c)) {
          phones.push(v);
        }
      });
      const joined = phones
        .join('_')
        .replace(/_eR/g, '_er')
        .replace(/R/g, '_R')
        .replace(/(?=\d)/g, '_')
        .split('_');
      const ph = joined.map(p => ZH_MAP[p] ?? '').join('');
      tokens.push({phonemes: ph, tag: pos, whitespace: ''});
    }
    return tokens.map(t => (t.phonemes ?? '') + t.whitespace).join('');
  }
}

export function mapPunctuation(text: string): string {
  return text
    .replace(/、/g, ', ')
    .replace(/，/g, ', ')
    .replace(/。/g, '. ')
    .replace(/．/g, '. ')
    .replace(/！/g, '! ')
    .replace(/：/g, ': ')
    .replace(/；/g, '; ')
    .replace(/？/g, '? ')
    .replace(/«/g, ' “')
    .replace(/»/g, '” ')
    .replace(/《/g, ' “')
    .replace(/》/g, '” ')
    .replace(/「/g, ' “')
    .replace(/」/g, '” ')
    .replace(/【/g, ' “')
    .replace(/】/g, '” ')
    .replace(/（/g, ' (')
    .replace(/）/g, ') ')
    .trim();
}

export type EnPhonemize = (text: string) => string | Promise<string>;

/**
 * ZHG2P(version='1.1').__call__：数字转中文 → 标点映射 → 中英分段，
 * 中文走前端，英文交给 enPhonemize（Kokoro 自带的英文音素化）。
 */
export async function zhPhonemize(
  g2p: ZhG2P,
  text: string,
  enPhonemize?: EnPhonemize,
): Promise<string> {
  if (!text.trim()) {
    return '';
  }
  const t = mapPunctuation(an2cn(text));
  const segments: string[] = [];
  const re = /([A-Za-z '-]*[A-Za-z][A-Za-z '-]*)|([^A-Za-z]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const en = (m[1] ?? '').trim();
    const zh = (m[2] ?? '').trim();
    if (zh) {
      const ph = g2p.frontend(zh);
      if (ph) {
        segments.push(ph);
      }
    } else if (en && enPhonemize) {
      const ph = (await enPhonemize(en)).trim();
      if (ph) {
        segments.push(ph);
      }
    }
  }
  return segments.join(' ');
}
