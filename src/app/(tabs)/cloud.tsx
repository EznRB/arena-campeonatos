import { useEffect, useState } from 'react';
import { AppState, Platform, Text, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { cloudClient, cloudConfigured, loadCloudBackup, saveCloudBackup } from '../../cloud';
import { useTournaments } from '../../store';
import { cancelReminder } from '../../native';
import { Button, Card, colors, confirmAction, Field, Heading, Loading, Screen, styles } from '../../components/ui';
import { Icon } from '../../components/icon';

export default function CloudScreen() {
  const { tournaments, update, saving, loading, error: storageError } = useTournaments();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(cloudConfigured);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!cloudClient) return;
    let active = true;
    cloudClient.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setError('Não foi possível recuperar a sessão. Entre novamente.');
      setSession(data.session); setAuthLoading(false);
    }).catch(() => { if (active) { setError('Não foi possível recuperar a sessão.'); setAuthLoading(false); } });
    const { data } = cloudClient.auth.onAuthStateChange((_event, current) => { if (active) { setSession(current); setAuthLoading(false); } });
    const subscription = Platform.OS !== 'web' ? AppState.addEventListener('change', state => {
      if (state === 'active') cloudClient?.auth.startAutoRefresh(); else cloudClient?.auth.stopAutoRefresh();
    }) : null;
    return () => { active = false; data.subscription.unsubscribe(); subscription?.remove(); };
  }, []);
  async function perform<T>(action: () => Promise<T>): Promise<T | undefined> {
    setBusy(true); setError(''); setMessage('');
    try { return await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível concluir. Tente novamente.'); }
    finally { setBusy(false); }
  }
  async function authenticate(create: boolean) {
    await perform(async () => {
      if (!cloudClient) throw new Error('O serviço de backup ainda não está configurado.');
      const address = email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || !password) throw new Error('Informe um e-mail válido e sua senha.');
      if (create && password.length < 8) throw new Error('Use uma senha com pelo menos 8 caracteres.');
      const response = create ? await cloudClient.auth.signUp({ email: address, password }) : await cloudClient.auth.signInWithPassword({ email: address, password });
      if (response.error) throw new Error(create ? `Não foi possível criar a conta. ${response.error.message}` : 'Não foi possível entrar. Confira e-mail, senha e a confirmação do cadastro.');
      setPassword('');
      setMessage(create && !response.data.session ? 'Confira o e-mail de confirmação. Depois de confirmar, volte à Arena e entre com sua senha.' : 'Conta conectada. Seus campeonatos locais continuam preservados.');
    });
  }
  function save() {
    confirmAction('Atualizar backup online?', 'A cópia online desta conta será substituída pelos campeonatos deste aparelho. Esta ação não modifica seus dados locais.', () => void perform(async () => {
      const result = await saveCloudBackup(tournaments);
      setMessage(`${result.count} campeonato(s) salvos online em ${new Date(result.updatedAt).toLocaleString('pt-BR')}.`);
    }));
  }
  async function restore() {
      const backup = await perform(loadCloudBackup);
      if (!backup) { if (backup === null) setMessage('Esta conta ainda não tem backup. Salve seus campeonatos primeiro.'); return; }
      confirmAction('Substituir campeonatos locais?', `O backup de ${new Date(backup.updatedAt).toLocaleString('pt-BR')} tem ${backup.tournaments.length} campeonato(s). Ele substituirá a lista deste aparelho. Lembretes locais serão cancelados e precisam ser reagendados.`, () => void perform(async () => {
        await Promise.all(tournaments.flatMap(item => item.notificationId ? [cancelReminder(item.notificationId)] : []));
        await update(() => backup.tournaments);
        setMessage('Backup restaurado neste aparelho. Reagende os lembretes que quiser receber.');
      }));
  }
  return <Screen maxWidth={900}>
    <Heading eyebrow="CONTA E BACKUP" title="Sua arena, protegida." description="Jogue offline e guarde uma cópia online para recuperar em outro aparelho." />
    {!cloudConfigured ? <Card><Icon name="shield" color={colors.lime} size={30} /><Text style={styles.heading}>Configuração do banco pendente</Text><Text style={styles.subtitle}>O Arena continua funcionando localmente. O backup será liberado quando o projeto Supabase e as variáveis de ambiente estiverem configurados.</Text></Card> : authLoading ? <Loading /> : session ? <Card>
      <Text style={styles.label}>CONTA CONECTADA</Text><Text style={styles.heading}>{session.user.email ?? 'Conta Arena'}</Text>
      <Text style={styles.subtitle}>Os backups pertencem a esta conta. Salve antes de trocar de aparelho e restaure depois de entrar no novo dispositivo.</Text>
      <View style={{ gap: 12, marginTop: 8 }}><Button title="Salvar campeonatos na nuvem" icon="shield" disabled={busy || saving || loading || !!storageError} onPress={save} /><Button title="Restaurar backup online" icon="arrowRight" secondary disabled={busy || saving || loading || !!storageError} onPress={() => void restore()} /><Button title="Sair da conta" secondary disabled={busy} onPress={() => void perform(async () => { const result = await cloudClient!.auth.signOut(); if (result.error) throw result.error; setMessage('Você saiu da conta. Os campeonatos locais foram mantidos.'); })} /></View>
    </Card> : <Card>
      <Text style={styles.heading}>Entre para guardar seus campeonatos</Text><Text style={styles.subtitle}>O cadastro é opcional. Você pode continuar usando os torneios locais sem conta.</Text>
      <Field label="E-mail da conta" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="seu@email.com" maxLength={254} />
      <Field label="Senha da conta" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoComplete="current-password" placeholder="Sua senha" />
      <Button title={busy ? 'Aguarde…' : 'Entrar na conta'} disabled={busy} onPress={() => void authenticate(false)} /><Button title="Criar conta com este e-mail" secondary disabled={busy} onPress={() => void authenticate(true)} />
      <Text style={styles.small}>Para uma nova conta, use pelo menos 8 caracteres e confirme o cadastro pelo e-mail recebido.</Text>
    </Card>}
    {error && <Card style={{ borderColor: colors.red }}><Text accessibilityRole="alert" style={{ color: colors.red, lineHeight: 22 }}>{error}</Text></Card>}
    {message && <Card><Text accessibilityLiveRegion="polite" style={styles.text}>{message}</Text></Card>}
    <Card><Text style={styles.heading}>Como funciona</Text><Text style={styles.subtitle}>O backup é manual. Alterações feitas offline não são enviadas automaticamente, e restaurar não combina duas listas: substitui os campeonatos locais pela cópia escolhida.</Text><Text style={styles.small}>Limite por backup: 2 MiB. Lembretes são específicos de cada aparelho e não são transferidos. Senhas e tokens de sessão não fazem parte do backup dos campeonatos.</Text></Card>
  </Screen>;
}
