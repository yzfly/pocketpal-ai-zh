import {
  ONBOARDING_PALS,
  TOPIC_TO_PAL,
  entryId,
  resolvePalForTopic,
} from '../onboardingPals';
import {TOPIC_KEYS} from '../types';
import {chineseExtraCandidates} from '../../chineseModelPresets';
import {chinesePals} from '../../chinesePals';

const ID_PATTERN = /^[^/]+\/[^/]+\/[^/]+\.gguf$/;

const allEntries = ONBOARDING_PALS.flatMap(p =>
  p.models.map(m => [p.key, m.tier, m] as const),
);

describe('onboardingPals', () => {
  it('exposes five pals (pip/codie/sage/echo/muse)', () => {
    expect(ONBOARDING_PALS.map(p => p.key)).toEqual([
      'pip',
      'codie',
      'sage',
      'echo',
      'muse',
    ]);
  });

  it('maps every topic key to a pal; else falls back to pip', () => {
    for (const key of TOPIC_KEYS) {
      expect(TOPIC_TO_PAL[key]).toBeDefined();
    }
    expect(TOPIC_TO_PAL.else.key).toBe('pip');
    expect(TOPIC_TO_PAL.smartchat.key).toBe('pip');
  });

  it('resolvePalForTopic handles null (treated as else → pip)', () => {
    expect(resolvePalForTopic(null).key).toBe('pip');
  });

  it.each(ONBOARDING_PALS.map(p => [p.key, p] as const))(
    'pal %s has 3 tiers in quick/balanced/best order with exactly one recommended (quick)',
    (_key, pal) => {
      expect(pal.models).toHaveLength(3);
      expect(pal.models.map(m => m.tier)).toEqual([
        'quick',
        'balanced',
        'best',
      ]);
      const recommended = pal.models.filter(m => m.recommended);
      expect(recommended).toHaveLength(1);
      expect(recommended[0].tier).toBe('quick');
    },
  );

  it.each(allEntries)(
    '%s/%s entry has non-empty repo/filename and id matches the canonical shape',
    (_palKey, _tier, entry) => {
      expect(entry.repo.length).toBeGreaterThan(0);
      expect(entry.filename.length).toBeGreaterThan(0);
      expect(entryId(entry)).toMatch(ID_PATTERN);
    },
  );

  it.each(allEntries)(
    '%s/%s entry downloadUrl equals huggingface.co/<repo>/resolve/main/<filename>',
    (_palKey, _tier, entry) => {
      expect(entry.downloadUrl).toBe(
        `https://huggingface.co/${entry.repo}/resolve/main/${entry.filename}`,
      );
    },
  );

  it.each(allEntries)(
    '%s/%s entry has populated picker fields (sizeBytes, params, displayName, author)',
    (_palKey, _tier, entry) => {
      expect(entry.sizeBytes).toBeGreaterThan(0);
      expect(entry.params).toBeGreaterThan(0);
      expect(entry.displayName.length).toBeGreaterThan(0);
      expect(entry.author.length).toBeGreaterThan(0);
    },
  );

  describe('中文版引导页选型', () => {
    const curatedIds = new Set(
      Object.values(chineseExtraCandidates)
        .flat()
        .map(c => `${c.hfRepo}/${c.hfFilename}`),
    );

    it.each(allEntries)(
      '%s/%s 条目来自中文版推荐列表（与推荐预设的 id 一致）',
      (_palKey, _tier, entry) => {
        expect(curatedIds.has(entryId(entry))).toBe(true);
      },
    );

    it.each(ONBOARDING_PALS.map(p => [p.key, p] as const))(
      'pal %s 三档按体积递增，且名称与提示词使用中文版',
      (_key, pal) => {
        const sizes = pal.models.map(m => m.sizeBytes);
        expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
        expect(pal.name).toBe(chinesePals[pal.key].name);
        expect(pal.systemPrompt).toBe(chinesePals[pal.key].systemPrompt);
      },
    );
  });
});
