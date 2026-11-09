import React, {useContext, useState} from 'react';
import {Alert, View} from 'react-native';

import {observer} from 'mobx-react-lite';
import {Button, Card, Text} from 'react-native-paper';

import {AccountSheet} from '../../components/AccountSheet';
import {useTheme} from '../../hooks';
import {t} from '../../locales';
import {L10nContext} from '../../utils';
import {accountService} from '../../services';

import {createStyles} from './styles';

export const AccountCard: React.FC = observer(() => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const l10n = useContext(L10nContext);
  const copy = l10n.settings.account;
  const [showSheet, setShowSheet] = useState(false);

  if (!accountService.isConfigured) {
    return null;
  }

  const user = accountService.user;

  const handleSignOut = () =>
    Alert.alert(copy.signOut, copy.signOutConfirm, [
      {text: l10n.common.cancel, style: 'cancel'},
      {
        text: copy.signOut,
        style: 'destructive',
        onPress: () => {
          accountService.signOut();
        },
      },
    ]);

  return (
    <Card elevation={0} style={styles.card} testID="account-card">
      <Card.Title title={copy.title} />
      <Card.Content>
        <View style={styles.settingItemContainer}>
          {user ? (
            <>
              <Text testID="account-signed-in-as">
                {t(copy.signedInAs, {
                  email: user.email || user.username || user.name || '',
                })}
              </Text>
              <Button
                testID="settings-sign-out"
                mode="outlined"
                onPress={handleSignOut}
                style={styles.menuButton}>
                {copy.signOut}
              </Button>
            </>
          ) : (
            <>
              <Text style={{color: theme.colors.onSurfaceVariant}}>
                {copy.subtitle}
              </Text>
              <Button
                testID="settings-sign-in"
                mode="contained"
                onPress={() => setShowSheet(true)}
                style={styles.menuButton}>
                {`${copy.signIn} / ${copy.signUp}`}
              </Button>
            </>
          )}
        </View>
      </Card.Content>
      {showSheet && (
        <AccountSheet
          isVisible={showSheet}
          onClose={() => setShowSheet(false)}
        />
      )}
    </Card>
  );
});
