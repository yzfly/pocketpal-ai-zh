// Mock for src/services/index.ts（账号服务）
const accountService = {
  user: null,
  ready: true,
  busy: false,
  isConfigured: true,
  isSignedIn: false,
  init: jest.fn().mockResolvedValue(undefined),
  signIn: jest.fn().mockResolvedValue(undefined),
  signUp: jest.fn().mockResolvedValue(undefined),
  signOut: jest.fn().mockResolvedValue(undefined),
};

class AccountError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const updateService = {
  status: 'idle',
  manifest: null,
  progress: 0,
  error: null,
  dialogVisible: false,
  supported: false,
  forced: false,
  currentVersionCode: 159,
  autoCheck: jest.fn().mockResolvedValue(undefined),
  check: jest.fn().mockResolvedValue(false),
  showDialog: jest.fn(),
  dismiss: jest.fn().mockResolvedValue(undefined),
  startDownload: jest.fn().mockResolvedValue(undefined),
  install: jest.fn().mockResolvedValue(undefined),
};

module.exports = {
  updateService,
  accountService,
  AccountService: jest.fn(),
  AccountError,
  describeAccountError: jest.fn(() => '操作失败，请稍后重试'),
  isAccountConfigured: jest.fn(() => true),
};
