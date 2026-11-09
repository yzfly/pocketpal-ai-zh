import {
  AccountError,
  accountAuth,
  describeAccountError,
} from '../SupabaseAuthClient';

const mockFetch = jest.fn();

describe('SupabaseAuthClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    (global as any).fetch = mockFetch;
  });

  const respond = (status: number, body: unknown) =>
    mockFetch.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      text: async () => (body === undefined ? '' : JSON.stringify(body)),
    });

  const session = {
    access_token: 'a',
    refresh_token: 'r',
    expires_in: 3600,
    token_type: 'bearer',
    user: {id: 'u1', email: 'u@example.com'},
  };

  it('signs in with the password grant through the domestic relay', async () => {
    respond(200, session);
    const tokens = await accountAuth.signIn('u@example.com', 'pw12345678');
    expect(tokens).toEqual({
      access_token: 'a',
      refresh_token: 'r',
      expires_in: 3600,
      token_type: 'bearer',
    });
    const [url, init] = mockFetch.mock.calls[0];
    // 末尾多余的 / 会被去掉，避免 //auth
    expect(url).toBe(
      'https://203.0.113.10:18443/pw/auth/v1/token?grant_type=password',
    );
    expect(init.method).toBe('POST');
    expect(init.headers.apikey).toBe('test-publishable-key');
    expect(init.headers.Authorization).toBeUndefined();
    expect(JSON.parse(init.body)).toEqual({
      email: 'u@example.com',
      password: 'pw12345678',
    });
  });

  it('signs up and returns the session directly (no email confirmation)', async () => {
    respond(200, session);
    const tokens = await accountAuth.signUp('u@example.com', 'pw12345678');
    expect(tokens.access_token).toBe('a');
    expect(mockFetch.mock.calls[0][0]).toBe(
      'https://203.0.113.10:18443/pw/auth/v1/signup',
    );
  });

  it('reports a signup without a session as email_not_confirmed', async () => {
    respond(200, {id: 'u1', email: 'u@example.com'});
    await expect(
      accountAuth.signUp('u@example.com', 'pw12345678'),
    ).rejects.toMatchObject({code: 'email_not_confirmed'});
  });

  it('refreshes with the refresh_token grant', async () => {
    respond(200, session);
    await accountAuth.refresh('r0');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('/auth/v1/token?grant_type=refresh_token');
    expect(JSON.parse(init.body)).toEqual({refresh_token: 'r0'});
  });

  it('loads the user with a bearer token', async () => {
    respond(200, {id: 'u1', email: 'u@example.com'});
    const user = await accountAuth.me('tok');
    expect(user.email).toBe('u@example.com');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://203.0.113.10:18443/pw/auth/v1/user');
    expect(init.method).toBe('GET');
    expect(init.headers.Authorization).toBe('Bearer tok');
  });

  it('signs out with an empty 204 response', async () => {
    respond(204, undefined);
    await expect(accountAuth.signOut('tok')).resolves.toBeUndefined();
    expect(mockFetch.mock.calls[0][0]).toContain('/auth/v1/logout');
  });

  it('maps GoTrue error_code to AccountError', async () => {
    respond(400, {
      code: 400,
      error_code: 'invalid_credentials',
      msg: 'Invalid login credentials',
    });
    await expect(
      accountAuth.signIn('u@example.com', 'x'),
    ).rejects.toMatchObject({code: 'invalid_credentials', status: 400});
  });

  it('maps a bare 429 to the rate-limit code', async () => {
    respond(429, undefined);
    await expect(
      accountAuth.signIn('u@example.com', 'x'),
    ).rejects.toMatchObject({code: 'over_request_rate_limit', status: 429});
  });

  it('wraps network failures', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(
      accountAuth.signIn('u@example.com', 'x'),
    ).rejects.toMatchObject({code: 'network_error'});
  });

  it.each([
    ['invalid_credentials', '邮箱或密码不正确'],
    ['user_already_exists', '该邮箱已注册，请直接登录'],
    ['email_exists', '该邮箱已注册，请直接登录'],
    ['weak_password', '密码太简单，请换一个更复杂的密码'],
    ['over_request_rate_limit', '操作太频繁，请稍后再试'],
    ['network_error', '网络连接失败，请检查网络'],
    ['something_else', '操作失败，请稍后重试'],
  ])('describes %s in Chinese', (code, text) => {
    expect(describeAccountError(new AccountError(code, code, 400))).toBe(text);
  });
});
