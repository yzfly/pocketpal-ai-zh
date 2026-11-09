import {setHfMirrorEnabled} from '../../../config';
import {pickDownloadSource} from '../downloadSource';

const MIRROR =
  'https://hf-mirror.com/unsloth/Qwen3.5-0.8B-MTP-GGUF/resolve/main/Qwen3.5-0.8B-Q4_K_M.gguf';
const MS =
  'https://modelscope.cn/models/unsloth/Qwen3.5-0.8B-MTP-GGUF/resolve/master/Qwen3.5-0.8B-Q4_K_M.gguf';

describe('pickDownloadSource', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    (global as any).fetch = fetchMock;
    setHfMirrorEnabled(true);
  });

  afterAll(() => setHfMirrorEnabled(true));

  it('prefers ModelScope when the same file answers a range probe', async () => {
    fetchMock.mockResolvedValueOnce({status: 206});
    expect(await pickDownloadSource(MIRROR)).toBe(MS);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(MS);
    expect(init.headers.Range).toBe('bytes=0-0');
  });

  it('falls back to the mirror when ModelScope lacks the file', async () => {
    fetchMock.mockResolvedValueOnce({status: 404});
    expect(await pickDownloadSource(MIRROR)).toBe(MIRROR);
  });

  it('falls back to the mirror on a network error', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    expect(await pickDownloadSource(MIRROR)).toBe(MIRROR);
  });

  it('leaves authenticated or mirror-off requests alone', async () => {
    const hf = MIRROR.replace('hf-mirror.com', 'huggingface.co');
    expect(await pickDownloadSource(hf, 'token')).toBe(hf);
    setHfMirrorEnabled(false);
    expect(await pickDownloadSource(hf)).toBe(hf);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('leaves non-main revisions alone', async () => {
    const pinned = MIRROR.replace('/resolve/main/', '/resolve/abc123/');
    expect(await pickDownloadSource(pinned)).toBe(pinned);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
