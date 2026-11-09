import {
  CloudBaseError,
  cloudBaseAuth,
  describeAccountError,
} from '../CloudBaseAuthClient';

const mockFetch = jest.fn();

describe('CloudBaseAuthClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    (global as any).fetch = mockFetch;
  });

  const respond = (status: number, body: unknown) =>
    mockFetch.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      text: async () => JSON.stringify(body),
    });

  it('signs in with the email as username against the domestic gateway', async () => {
    respond(200, {access_token: 'a', refresh_token: 'r', expires_in: 7200});
    const tokens = await cloudBaseAuth.signIn('u@example.com', 'pw12345678');
    expect(tokens.access_token).toBe('a');
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe(
      'https://test-env.api.tcloudbasegateway.com/auth/v1/signin',
    );
    expect(JSON.parse(init.body)).toEqual({
      username: 'u@example.com',
      password: 'pw12345678',
    });
    expect(init.headers.Authorization).toBe('Bearer test-publishable-key');
    expect(init.headers['x-device-id']).toBeTruthy();
  });

  it('sends the captcha token header when given', async () => {
    respond(200, {access_token: 'a', refresh_token: 'r', expires_in: 1});
    await cloudBaseAuth.signIn('u@example.com', 'pw', 'cap');
    expect(mockFetch.mock.calls[0][1].headers['x-captcha-token']).toBe('cap');
  });

  it('turns error responses into CloudBaseError with the server code', async () => {
    respond(400, {error: 'invalid_username_or_password'});
    await expect(
      cloudBaseAuth.signIn('u@example.com', 'x'),
    ).rejects.toMatchObject({
      code: 'invalid_username_or_password',
      status: 400,
    });
  });

  it('signs up with username = email', async () => {
    respond(200, {access_token: 'a', refresh_token: 'r', expires_in: 1});
    await cloudBaseAuth.signUp('u@example.com', 'pw12345678', 'vt');
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toMatchObject({
      email: 'u@example.com',
      username: 'u@example.com',
      verification_token: 'vt',
    });
  });

  it('maps error codes to Chinese messages', () => {
    expect(
      describeAccountError(
        new CloudBaseError('invalid_username_or_password', '', 400),
      ),
    ).toBe('邮箱或密码不正确');
    expect(describeAccountError(new Error('x'))).toBe('操作失败，请稍后重试');
  });
});
