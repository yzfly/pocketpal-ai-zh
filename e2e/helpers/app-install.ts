/**
 * App identity and reinstall helpers shared by specs that need a fresh
 * install (for example onboarding).
 */

import * as path from 'path';

declare const driver: WebdriverIO.Browser;
declare const browser: WebdriverIO.Browser;

export const IOS_BUNDLE_ID = 'com.pocketwisdom';
export const ANDROID_PACKAGE = 'com.pocketwisdom.e2e';

export const appId = (): string =>
  driver.isAndroid ? ANDROID_PACKAGE : IOS_BUNDLE_ID;

export async function reinstallApp(): Promise<void> {
  const appPath = (browser.requestedCapabilities as any)['appium:app'];
  await (driver as any).removeApp(appId());
  await (driver as any).installApp(path.resolve(appPath));
  await (driver as any).activateApp(appId());
}
