// 口袋AI：中文分词（带词性），移植 jieba 的词典最大概率路径切分（MIT）。
// 不含 HMM 新词发现：词典外的连续单字按单字切分。词典为 jieba dict.txt
// 的精简版（见 jiebaDict.ts），格式与原文件相同：每行 “词 词频 词性”。

export interface SegToken {
  word: string;
  pos: string;
}

export class JiebaSegmenter {
  private freq = new Map<string, number>();
  private tag = new Map<string, string>();
  private logTotal = 0;
  private maxLen = 1;

  constructor(dictText: string) {
    let total = 0;
    for (const line of dictText.split('\n')) {
      if (!line) {
        continue;
      }
      const parts = line.split(' ');
      const word = parts[0];
      const f = Number(parts[1]);
      if (!word || !Number.isFinite(f)) {
        continue;
      }
      this.freq.set(word, f);
      if (parts[2]) {
        this.tag.set(word, parts[2]);
      }
      total += f;
      if (word.length > this.maxLen) {
        this.maxLen = word.length;
      }
    }
    this.logTotal = Math.log(total || 1);
  }

  /** 词频 > 0 即视为词典词（对应 jieba 的 FREQ.get(w)） */
  has(word: string): boolean {
    return (this.freq.get(word) ?? 0) > 0;
  }

  private route(sentence: string): number[] {
    const n = sentence.length;
    const best = new Array<number>(n + 1).fill(0);
    const next = new Array<number>(n + 1).fill(0);
    for (let idx = n - 1; idx >= 0; idx--) {
      let bestProb = -Infinity;
      let bestEnd = idx;
      const limit = Math.min(n, idx + this.maxLen);
      for (let end = idx; end < limit; end++) {
        const w = sentence.slice(idx, end + 1);
        const f = this.freq.get(w);
        // DAG 只含词典词；单字永远是候选
        if (end !== idx && !(f && f > 0)) {
          continue;
        }
        const prob =
          Math.log(f && f > 0 ? f : 1) - this.logTotal + best[end + 1];
        // 与 Python max((prob, x)) 一致：概率相同取更长的 x
        if (prob > bestProb || (prob === bestProb && end > bestEnd)) {
          bestProb = prob;
          bestEnd = end;
        }
      }
      best[idx] = bestProb;
      next[idx] = bestEnd;
    }
    return next;
  }

  /** jieba.cut(sentence, HMM=False) 对一个汉字/字母数字块的切分 */
  private cutBlock(block: string): string[] {
    const next = this.route(block);
    const out: string[] = [];
    let buf = '';
    let x = 0;
    while (x < block.length) {
      const y = next[x] + 1;
      const w = block.slice(x, y);
      if (y - x === 1 && /[a-zA-Z0-9]/.test(w)) {
        buf += w;
      } else {
        if (buf) {
          out.push(buf);
          buf = '';
        }
        out.push(w);
      }
      x = y;
    }
    if (buf) {
      out.push(buf);
    }
    return out;
  }

  /** 不带词性的切分（用于 jieba.cut_for_search 的子词拆分） */
  cut(sentence: string): string[] {
    const out: string[] = [];
    for (const tk of this.posCut(sentence)) {
      out.push(tk.word);
    }
    return out;
  }

  /** 近似 jieba.posseg.lcut(sentence) */
  posCut(sentence: string): SegToken[] {
    const out: SegToken[] = [];
    const re = /([一-鿕a-zA-Z0-9+#&._]+)/;
    for (const blk of sentence.split(re)) {
      if (!blk) {
        continue;
      }
      if (re.test(blk) && blk.match(re)![0] === blk) {
        for (const w of this.cutBlock(blk)) {
          let pos = this.tag.get(w);
          if (!pos) {
            if (/^[0-9.]+$/.test(w)) {
              pos = 'm';
            } else if (/^[a-zA-Z0-9]+$/.test(w)) {
              pos = 'eng';
            } else {
              pos = 'x';
            }
          }
          out.push({word: w, pos});
        }
      } else {
        for (const piece of blk.split(/(\r\n|\s)/)) {
          if (!piece) {
            continue;
          }
          if (/^(\r\n|\s)$/.test(piece)) {
            out.push({word: piece, pos: 'x'});
          } else {
            for (const ch of piece) {
              out.push({
                word: ch,
                pos: /[0-9]/.test(ch) ? 'm' : /[a-zA-Z]/.test(ch) ? 'eng' : 'x',
              });
            }
          }
        }
      }
    }
    return out;
  }

  /** jieba.cut_for_search(word) */
  cutForSearch(sentence: string): string[] {
    const out: string[] = [];
    for (const w of this.cut(sentence)) {
      if (w.length > 2) {
        for (let i = 0; i < w.length - 1; i++) {
          const g = w.slice(i, i + 2);
          if (this.has(g)) {
            out.push(g);
          }
        }
      }
      if (w.length > 3) {
        for (let i = 0; i < w.length - 2; i++) {
          const g = w.slice(i, i + 3);
          if (this.has(g)) {
            out.push(g);
          }
        }
      }
      out.push(w);
    }
    return out;
  }
}
