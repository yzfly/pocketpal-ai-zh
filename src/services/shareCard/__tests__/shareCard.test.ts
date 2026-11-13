import {toPlainText} from '../shareCard';

describe('toPlainText', () => {
  it('strips markdown marks but keeps the words and line breaks', () => {
    const md = [
      '## 标题',
      '',
      '这是**重点**和*强调*，还有 `代码`。',
      '- 第一条',
      '* 第二条',
      '> 引用',
      '[链接](https://example.com)',
    ].join('\n');

    expect(toPlainText(md)).toBe(
      [
        '标题',
        '',
        '这是重点和强调，还有 代码。',
        '• 第一条',
        '• 第二条',
        '引用',
        '链接',
      ].join('\n'),
    );
  });

  it('drops code fences and collapses extra blank lines', () => {
    expect(toPlainText('a\n\n\n\n```js\nconst x = 1;\n```\nb')).toBe(
      'a\n\nconst x = 1;\n\nb',
    );
  });

  it('returns an empty string for blank input', () => {
    expect(toPlainText('  \n ')).toBe('');
  });
});
