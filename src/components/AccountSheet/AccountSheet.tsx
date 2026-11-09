import React, {useContext, useState} from 'react';
import {View} from 'react-native';
import {
  Button,
  HelperText,
  Text,
  TextInput as PaperTextInput,
} from 'react-native-paper';
import {observer} from 'mobx-react';

import {Sheet} from '../Sheet';
import {TextInput} from '../TextInput';
import {useTheme} from '../../hooks';
import {L10nContext} from '../../utils';
import {accountService, describeAccountError} from '../../services';

import {createStyles} from './styles';

type Mode = 'signIn' | 'signUp';

interface AccountSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isStrongPassword = (pw: string) =>
  pw.length >= 8 && /[A-Za-z]/.test(pw) && /[0-9]/.test(pw);

/** 登录 / 注册：邮箱 + 密码（注册多一个确认密码），不需要验证码 */
export const AccountSheet: React.FC<AccountSheetProps> = observer(
  ({isVisible, onClose}) => {
    const theme = useTheme();
    const styles = createStyles(theme);
    const l10n = useContext(L10nContext);
    const copy = l10n.settings.account;

    const [mode, setMode] = useState<Mode>('signIn');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const busy = accountService.busy;
    const emailOk = EMAIL_RE.test(email.trim());

    const switchMode = (next: Mode) => {
      setMode(next);
      setError(null);
      setConfirm('');
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
          if (password !== confirm) {
            setError(copy.passwordMismatch);
            return;
          }
          await accountService.signUp(email, password);
        }
        setPassword('');
        setConfirm('');
        onClose();
      } catch (e) {
        setError(describeAccountError(e));
      }
    };

    const canSubmit =
      emailOk &&
      password.length > 0 &&
      (mode === 'signIn' || confirm.length > 0);

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
              <TextInput
                testID="account-password-input"
                label={copy.password}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                right={
                  <PaperTextInput.Icon
                    testID="account-password-toggle"
                    icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    accessibilityLabel={
                      showPassword ? copy.hidePassword : copy.showPassword
                    }
                    onPress={() => setShowPassword(v => !v)}
                  />
                }
                autoCapitalize="none"
                autoCorrect={false}
                textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
              />
              {mode === 'signUp' && (
                <>
                  <TextInput
                    testID="account-confirm-input"
                    label={copy.confirmPassword}
                    value={confirm}
                    onChangeText={setConfirm}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                  />
                  <Text style={styles.hint}>{copy.passwordHint}</Text>
                </>
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
                disabled={busy || !canSubmit}
                style={styles.submit}
                contentStyle={styles.submitContent}>
                {mode === 'signIn' ? copy.signIn : copy.signUp}
              </Button>
              <Button
                testID="account-switch-mode"
                mode="text"
                labelStyle={styles.switchLabel}
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
