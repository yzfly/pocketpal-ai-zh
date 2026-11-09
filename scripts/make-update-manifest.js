#!/usr/bin/env node
/**
 * 从构建好的 APK 生成应用内更新清单 update.json。
 *
 *   node scripts/make-update-manifest.js <apk> <apkUrl> [notes.txt] [--min <versionCode>]
 *
 * versionCode / versionName 读自 android/app/build.gradle；notes.txt 每行一条更新说明。
 * 输出到 stdout，把它和 APK 一起上传到国内可直连的地址（如 CloudBase 静态网站托管），
 * 再把 update.json 的地址写进 .env 的 UPDATE_MANIFEST_URL。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const args = process.argv.slice(2);
let min;
const minIdx = args.indexOf('--min');
if (minIdx >= 0) {
  min = Number(args[minIdx + 1]);
  args.splice(minIdx, 2);
}
const [apk, apkUrl, notesFile] = args;
if (!apk || !apkUrl || !/^https:\/\//.test(apkUrl)) {
  console.error(
    'usage: make-update-manifest.js <apk> <https apkUrl> [notes.txt] [--min <versionCode>]',
  );
  process.exit(1);
}

const gradle = fs.readFileSync(
  path.join(__dirname, '..', 'android', 'app', 'build.gradle'),
  'utf8',
);
const versionCode = Number(/versionCode\s+(\d+)/.exec(gradle)[1]);
const versionName = /versionName\s+"([^"]+)"/.exec(gradle)[1];

const sha256 = crypto
  .createHash('sha256')
  .update(fs.readFileSync(apk))
  .digest('hex');
const notes = notesFile
  ? fs
      .readFileSync(notesFile, 'utf8')
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
  : [];

const manifest = {
  versionCode,
  versionName,
  notes,
  apkUrl,
  sha256,
  size: fs.statSync(apk).size,
};
if (min) {
  manifest.minVersionCode = min;
}
process.stdout.write(JSON.stringify(manifest, null, 2) + '\n');
