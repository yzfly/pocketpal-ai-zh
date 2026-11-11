import {JiebaSegmenter} from '../jiebaSegmenter';
import {an2cn, numberToChinese} from '../zhNumbers';
import {ZhG2P, mapPunctuation, splitSyllable, zhPhonemize} from '../zhG2P';

const DICT: string = require('../jiebaDict').default;

const g2p = new ZhG2P(new JiebaSegmenter(DICT));
const say = (text: string) => zhPhonemize(g2p, text, en => `[${en}]`);

describe('zhNumbers', () => {
  it('reads numbers by value', () => {
    expect(numberToChinese('15')).toBe('十五');
    expect(numberToChinese('105')).toBe('一百零五');
    expect(numberToChinese('10000')).toBe('一万');
    expect(numberToChinese('-3.14')).toBe('负三点一四');
  });

  it('reads years digit by digit and handles units', () => {
    expect(an2cn('2026年11月9日')).toBe('二零二六年十一月九日');
    expect(an2cn('50%')).toBe('百分之五十');
    expect(an2cn('1/3')).toBe('三分之一');
    expect(an2cn('3-5个')).toBe('三到五个');
    expect(an2cn('15℃')).toBe('十五摄氏度');
  });
});

describe('splitSyllable', () => {
  it('splits initials and finals like pypinyin strict mode', () => {
    expect(splitSyllable('zhong1')).toEqual(['zh', 'ong1']);
    expect(splitSyllable('yi1')).toEqual(['', 'i1']);
    expect(splitSyllable('wu3')).toEqual(['', 'u3']);
    expect(splitSyllable('yu2')).toEqual(['', 'v2']);
    expect(splitSyllable('ju4')).toEqual(['j', 'v4']);
  });
});

describe('mapPunctuation', () => {
  it('maps full-width punctuation to ASCII', () => {
    expect(mapPunctuation('你好，世界！')).toBe('你好, 世界!');
  });
});

describe('zhPhonemize (matches misaki ZHG2P v1.1)', () => {
  it('handles basic words', async () => {
    expect(await say('你好世界。')).toBe('ㄋㄧ2ㄏㄠ3/ㄕ十4ㄐㄝ4.');
  });

  it('applies 不 sandhi and neutral tones', async () => {
    expect(await say('我不知道这个问题的答案。')).toBe(
      '我3/ㄅㄨ4ㄓ十1ㄉㄠ4/ㄓㄜ4ㄍㄜ5/文4ㄊㄧ2/ㄉㄜ5/ㄉㄚ2ㄢ4.',
    );
  });

  it('applies 一 sandhi', async () => {
    expect(await say('一个人，一起走，一样好。')).toBe(
      'ㄧ2ㄍㄜ5/ㄖㄣ2, ㄧ4ㄑㄧ3ㄗㄡ3, ㄧ2阳4/ㄏㄠ3.',
    );
  });

  it('keeps erhua', async () => {
    expect(await say('小孩儿在玩儿。')).toBe('ㄒ要3ㄏㄞR2/ㄗㄞ4/万R2.');
  });

  it('passes embedded English to the English phonemizer', async () => {
    const out = await say('请打开设置，选择 Kokoro 中文声音。');
    expect(out).toContain('[Kokoro]');
    expect(out.startsWith('ㄑ应2ㄉㄚ3ㄎㄞ1/ㄕㄜ4ㄓ十4, ')).toBe(true);
  });

  it('returns empty for blank input', async () => {
    expect(await say('  ')).toBe('');
  });
});
