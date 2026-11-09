import React, {useContext, useEffect, useState} from 'react';
import {Image, Pressable, View} from 'react-native';
import {Button, HelperText, Text} from 'react-native-paper';
import {observer} from 'mobx-react';

import {Sheet} from '../Sheet';
import {TextInput} from '../TextInput';
import {useTheme} from '../../hooks';
import {t} from '../../locales';
import {L10nContext} from '../../utils';
import {accountService, describeAccountError} from '../../services';

import {createStyles} from './styles';

type Mode = 'signIn' | 'signUp';

interface AccountSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 60;

export const isStrongPassword = (pw: string) =>
  pw.length >= 8 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw);

export const AccountSheet: React.FC<AccountSheetProps> = observer(
  ({isVisible, onClose}) => {
    const theme = useTheme();
    const styles = createStyles(theme);
    const l10n = useContext(L10nContext);
    const copy = l10n.settings.account;

    const [mode, setMode] = useState<Mode>('signIn');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [verificationId, setVerificationId] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(0);
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (countdown <= 0) {
        return;
      }
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }, [countdown]);

    const busy = accountService.busy;
    const captcha = accountService.captcha;
    const emailOk = EMAIL_RE.test(email.trim());

    const fail = (e: unknown) => setError(describeAccountError(e));

    const switchMode = (next: Mode) => {
      setMode(next);
      setError(null);
      setCode('');
      setVerificationId(null);
    };

    const handleSendCode = async () => {
      setError(null);
      if (!emailOk) {
        setError(copy.invalidEmail);
        return;
      }
      try {
        const id = await accountService.startSignUp(email);
        setVerificationId(id);
        setCountdown(RESEND_SECONDS);
      } catch (e) {
        fail(e);
      }
    };

    const handleSubmit = async () => {
      setError(null);
      if (!emailOk) {
        setError(copy.invalidEmail);
        return;
      }
      try {
        if (mode === 'signIn') {
          await accountService.signIn(email, password);
        } else {
          if (!isStrongPassword(password)) {
            setError(copy.weakPassword);
            return;
          }
          if (!verificationId) {
            return;
          }
          await accountService.completeSignUp(
            email,
            password,
            verificationId,
            code,
          );
        }
        setPassword('');
        setCode('');
        onClose();
      } catch (e) {
        fail(e);
      }
    };

    const handleCaptcha = async () => {
      try {
        await accountService.solveCaptcha(captchaAnswer.trim());
        setCaptchaAnswer('');
        setError(null);
      } catch (e) {
        setCaptchaAnswer('');
        accountService.refreshCaptcha().catch(() => undefined);
        fail(e);
      }
    };

    const canSubmit =
      mode === 'signIn'
        ? emailOk && password.length > 0
        : emailOk &&
          !!verificationId &&
          code.trim().length > 0 &&
          password.length > 0;

    return (
      <Sheet
        isVisible={isVisible}
        onClose={onClose}
        title={mode === 'signIn' ? copy.signIn : copy.signUp}
        snapPoints={['85%']}>
        <Sheet.ScrollView contentContainerStyle={styles.container}>
          {!accountService.isConfigured ? (
            <Text style={styles.subtitle}>{copy.notConfigured}</Text>
          ) : (
            <View style={styles.form}>
              <Text style={styles.subtitle}>{copy.subtitle}</Text>
              <TextInput
                testID="account-email-input"
                label={copy.email}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
              />
              {mode === 'signUp' && (
                <View style={styles.codeRow}>
                  <View style={styles.codeInput}>
                    <TextInput
                      testID="account-code-input"
                      label={copy.code}
                      value={code}
                      onChangeText={setCode}
                      keyboardType="number-pad"
                      textContentType="oneTimeCode"
                      autoComplete="one-time-code"
                      maxLength={8}
                    />
                  </View>
                  <Button
                    testID="account-send-code"
                    mode="outlined"
                    onPress={handleSendCode}
                    disabled={busy || countdown > 0 || !emailOk}
                    style={styles.codeButton}>
                    {countdown > 0
                      ? t(copy.resendCode, {seconds: String(countdown)})
                      : copy.sendCode}
                  </Button>
                </View>
              )}
              {mode === 'signUp' && verificationId && (
                <Text style={styles.hint}>
                  {t(copy.codeSent, {email: email.trim()})}
                </Text>
              )}
              <TextInput
                testID="account-password-input"
                label={copy.password}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
              />
              {mode === 'signUp' && (
                <Text style={styles.hint}>{copy.passwordHint}</Text>
              )}

              {captcha && (
                <View style={styles.captchaBox} testID="account-captcha">
                  <Text style={styles.hint}>{copy.captchaHint}</Text>
                  <Pressable
                    onPress={() =>
                      accountService.refreshCaptcha().catch(() => undefined)
                    }
                    accessibilityRole="button"
                    accessibilityLabel={copy.captchaRefresh}>
                    <Image
                      source={{uri: captcha.image}}
                      style={styles.captchaImage}
                      resizeMode="contain"
                    />
                  </Pressable>
                  <View style={styles.codeRow}>
                    <View style={styles.codeInput}>
                      <TextInput
                        testID="account-captcha-input"
                        label={copy.captcha}
                        value={captchaAnswer}
                        onChangeText={setCaptchaAnswer}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                    <Button
                      mode="outlined"
                      onPress={handleCaptcha}
                      disabled={!captchaAnswer.trim()}
                      style={styles.codeButton}>
                      {copy.captchaConfirm}
                    </Button>
                  </View>
                </View>
              )}

              {error && (
                <HelperText type="error" visible testID="account-error">
                  {error}
                </HelperText>
              )}

              <Button
                testID="account-submit"
                mode="contained"
                onPress={handleSubmit}
                loading={busy}
                disabled={busy || !canSubmit || !!captcha}
                style={styles.submit}
                contentStyle={styles.submitContent}>
                {mode === 'signIn' ? copy.signIn : copy.signUp}
              </Button>
              <Button
                testID="account-switch-mode"
                mode="text"
                onPress={() =>
                  switchMode(mode === 'signIn' ? 'signUp' : 'signIn')
                }>
                {mode === 'signIn' ? copy.toSignUp : copy.toSignIn}
              </Button>
            </View>
          )}
        </Sheet.ScrollView>
      </Sheet>
    );
  },
);
