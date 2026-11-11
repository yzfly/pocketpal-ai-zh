// 口袋AI：阿拉伯数字转中文读法，移植自 cn2an 的 transform(text, 'an2cn')（MIT）。
// Kokoro 中文前端（misaki）在音素化前先做这一步，规则保持一致：
// 年份逐位读（2026年 → 二零二六年），其余按数值读（15 → 十五）。

const DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const UNITS = [
  '',
  '十',
  '百',
  '千',
  '万',
  '十',
  '百',
  '千',
  '亿',
  '十',
  '百',
  '千',
  '万',
  '十',
  '百',
  '千',
];

const MEASURE_WORDS =
  '斤|克|千克|公斤|吨|米|厘米|毫米|公里|升|毫升|元|角|分|个|只|条|张|块|瓶|杯|份|本|' +
  '辆|台|匹|头|位|亩|小时|分钟|秒|天|半';

function direct(digits: string): string {
  let out = '';
  for (const d of digits) {
    out += d === '.' ? '点' : DIGITS[Number(d)];
  }
  return out;
}

function integerLow(intPart: string): string {
  const s = String(BigInt(intPart));
  const n = s.length;
  if (n > UNITS.length) {
    // 超出范围：逐位读
    return direct(s);
  }
  let out = '';
  for (let i = 0; i < n; i++) {
    const d = Number(s[i]);
    const unitIdx = n - i - 1;
    if (d) {
      out += DIGITS[d] + UNITS[unitIdx];
    } else {
      if (unitIdx % 4 === 0) {
        out += DIGITS[d] + UNITS[unitIdx];
      }
      if (i > 0 && out[out.length - 1] !== '零') {
        out += DIGITS[d];
      }
    }
  }
  out = out
    .replace(/零零/g, '零')
    .replace(/零万/g, '万')
    .replace(/零亿/g, '亿')
    .replace(/亿万/g, '亿');
  out = out.replace(/^零+|零+$/g, '');
  out = out.replace(/([万亿])零([一二三四五六七八九][千])/g, '$1$2');
  if (out.startsWith('一十')) {
    out = out.slice(1);
  }
  return out || '零';
}

/** 数值读法（cn2an 的 low 模式），支持负数与小数 */
export function numberToChinese(input: string): string {
  let s = input;
  let sign = '';
  if (s.startsWith('-')) {
    sign = '负';
    s = s.slice(1);
  }
  const [intPart, decPart] = s.split('.');
  let out = integerLow(intPart || '0');
  if (decPart !== undefined && decPart.length) {
    out += '点' + direct(decPart.slice(0, 16));
  }
  return sign + out;
}

/** 文本里的阿拉伯数字转中文（对应 cn2an.transform(text, 'an2cn')） */
export function an2cn(text: string): string {
  let t = text;
  // 范围：3-5个 → 三到五个
  t = t.replace(
    new RegExp(`\\d+(\\.\\d+)?-\\d+(\\.\\d+)?(?=(${MEASURE_WORDS}))`, 'g'),
    m => {
      const [a, b] = m.split('-');
      return `${numberToChinese(a)}到${numberToChinese(b)}`;
    },
  );
  // 日期：年份逐位读，月日按数值读
  t = t.replace(/(\d{2,4}年)?(\d{1,2}月)?(\d{1,2}日)?/g, m => {
    if (!m) {
      return m;
    }
    return m
      .replace(/\d+(?=年)/g, d => direct(d))
      .replace(/\d+/g, d => numberToChinese(d));
  });
  // 分数：1/2 → 二分之一
  t = t.replace(/\d+\/\d+/g, m => {
    const [a, b] = m.split('/');
    return `${numberToChinese(b)}分之${numberToChinese(a)}`;
  });
  // 百分数
  t = t.replace(
    /-?(\d+\.)?\d+%/g,
    m => '百分之' + numberToChinese(m.slice(0, -1)),
  );
  // 摄氏度
  t = t.replace(/\d+℃/g, m => numberToChinese(m.slice(0, -1)) + '摄氏度');
  // 其余数字
  t = t.replace(/-?(\d+\.)?\d+/g, m => numberToChinese(m));
  return t;
}
