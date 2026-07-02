import {
  applyHfMirror,
  canonicalizeHfUrl,
  isHfMirrorEnabled,
  resolveHfRequest,
  setHfMirrorEnabled,
  urls,
} from '../urls';

describe('HF 镜像改写', () => {
  afterEach(() => {
    setHfMirrorEnabled(true);
  });

  describe('applyHfMirror', () => {
    it('镜像开启时改写 huggingface.co 域名', () => {
      expect(
        applyHfMirror('https://huggingface.co/a/b/resolve/main/f.gguf'),
      ).toBe('https://hf-mirror.com/a/b/resolve/main/f.gguf');
      expect(applyHfMirror('https://huggingface.co')).toBe(
        'https://hf-mirror.com',
      );
    });

    it('镜像关闭时原样返回', () => {
      setHfMirrorEnabled(false);
      expect(applyHfMirror('https://huggingface.co/a/b')).toBe(
        'https://huggingface.co/a/b',
      );
      expect(isHfMirrorEnabled()).toBe(false);
    });

    it('只匹配 URL 开头的规范域名，不误伤其他 URL', () => {
      expect(applyHfMirror('https://cdn.jsdelivr.net/gh/x')).toBe(
        'https://cdn.jsdelivr.net/gh/x',
      );
      expect(applyHfMirror('https://example.com/huggingface.co/x')).toBe(
        'https://example.com/huggingface.co/x',
      );
      // 域名前缀相似但不同的 host 不能被改写
      expect(applyHfMirror('https://huggingface.co.evil.com/x')).toBe(
        'https://huggingface.co.evil.com/x',
      );
    });
  });

  describe('canonicalizeHfUrl', () => {
    it('把镜像 URL 归一为规范域名，且与开关无关', () => {
      setHfMirrorEnabled(false);
      expect(canonicalizeHfUrl('https://hf-mirror.com/a/b')).toBe(
        'https://huggingface.co/a/b',
      );
      expect(canonicalizeHfUrl('https://huggingface.co/a/b')).toBe(
        'https://huggingface.co/a/b',
      );
    });
  });

  describe('resolveHfRequest（token 不变量）', () => {
    it('镜像开启：走镜像且剥离 token', () => {
      const req = resolveHfRequest('https://huggingface.co/a/b', 'hf_secret');
      expect(req.url).toBe('https://hf-mirror.com/a/b');
      expect(req.authToken).toBeNull();
    });

    it('镜像关闭：直连并携带 token', () => {
      setHfMirrorEnabled(false);
      const req = resolveHfRequest('https://huggingface.co/a/b', 'hf_secret');
      expect(req.url).toBe('https://huggingface.co/a/b');
      expect(req.authToken).toBe('hf_secret');
    });

    it('已是镜像域名的 URL（如分页 Link header）绝不与 token 组合', () => {
      setHfMirrorEnabled(false);
      const req = resolveHfRequest(
        'https://hf-mirror.com/api/models?p=1',
        'hf_secret',
      );
      // 先归一再决定：token 只能发给规范域名
      expect(req.url).toBe('https://huggingface.co/api/models?p=1');
      expect(req.authToken).toBe('hf_secret');

      setHfMirrorEnabled(true);
      const req2 = resolveHfRequest(
        'https://hf-mirror.com/api/models?p=1',
        'hf_secret',
      );
      expect(req2.url).toBe('https://hf-mirror.com/api/models?p=1');
      expect(req2.authToken).toBeNull();
    });
  });

  describe('urls.modelWebPage', () => {
    it('数据层 URL 始终保持规范域名（镜像在打开浏览器处才改写）', () => {
      expect(urls.modelWebPage('a/b')).toBe('https://huggingface.co/a/b');
      setHfMirrorEnabled(false);
      expect(urls.modelWebPage('a/b')).toBe('https://huggingface.co/a/b');
    });
  });
});
