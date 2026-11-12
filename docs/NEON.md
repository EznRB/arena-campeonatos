# Neon e produção - Arena

Estado verificado em 12/11/2026. [Aplicação](https://arena-campeonatos.vercel.app) · [GitHub](https://github.com/EznRB/arena-campeonatos).

## Configuração entregue

- Projeto exclusivo `arena-campeonatos` / `fragrant-hill-82542920`, organização no plano **Free**, região `aws-us-east-2`, branch `main` / `br-wandering-wind-bebhk06j`. Nenhum projeto de outro sistema foi pausado ou modificado; nenhum plano pago foi contratado.
- Neon Auth gerenciado, e-mail/senha, domínio de produção autorizado. A API Vercel `/api/arena` valida a sessão no servidor antes de ler/gravar um backup.
- Tabela privada `public.arena_backups`, RLS habilitada e privilégio SELECT do papel PUBLIC recusado. A API deriva o proprietário da sessão e usa parâmetros SQL; não há Data API pública. RLS sem políticas bloqueia papéis comuns; o papel de servidor é proprietário da tabela, portanto a autorização de cada operação na API é indispensável.
- Sessões web em cookie assinado HttpOnly/Secure/SameSite=Lax; sessões nativas em Expo SecureStore, enviadas como Bearer. Senhas são encaminhadas ao Neon Auth; o Arena não implementa armazenamento de senhas. Logout revoga a sessão no serviço.
- Backup manual validado e limitado a 2 MiB de JSON compacto UTF-8, com versão do formato. A migração `002_jsonb_storage_margin.sql` deixa até 4 MiB para a representação JSONB no banco, que acrescenta espaços; o limite público não aumentou. Restaurar substitui a lista local após confirmação. IDs de notificações do outro aparelho são removidos. A restauração persiste antes de cancelar alarmes antigos; falha ao salvar preserva os lembretes, e falhas de cancelamento são relatadas separadamente. Sem sincronização automática ou combinação de listas.
- `X-Arena-User` detecta uma conta trocada em outra aba: conflito retorna 409 e não altera a cópia da nova conta. O cabeçalho nunca concede acesso a outro proprietário.

## Ambientes e manutenção

Somente `EXPO_PUBLIC_ARENA_API_URL` vai ao bundle Expo. `DATABASE_URL`, `NEON_AUTH_BASE_URL` e `ARENA_ORIGIN` ficam no servidor Vercel; a cópia local de configuração está em `.env.local`, ignorada pelo Git. A inspeção do bundle não encontrou a URL de conexão nem a senha do banco.

As quatro variáveis estão cadastradas em **Production** na Vercel. O GitHub está conectado ao deploy automático. Preview/development não recebem automaticamente as credenciais de produção. A prévia SPA (`npm run preview`) não executa a API; para o roteiro de conta use o domínio publicado. Não libere CORS indiscriminadamente.

Para uma nova instalação autorizada, configure `.env.local` com o banco exclusivo correto e execute `node scripts/migrate-neon.cjs`. As migrações usam uma transação e verificam RLS; o script evita usar um DATABASE_URL de outro projeto herdado no ambiente. Para sobrescrever explicitamente o alvo, use `ARENA_MIGRATION_DATABASE_URL`. Não altere a migração antiga para representar futuras mudanças: crie uma migração nova e revise o alvo antes de aplicar.

As sete skills Neon já estavam disponíveis pelo plugin. O arquivo `.codex/config.toml` acrescenta o endpoint MCP oficial com OAuth, sem chaves literais. O CLI autenticado foi usado na configuração. MCP e CLI podem exigir logins independentes; renovar uma sessão não equivale a renovar a outra.

## Evidências executadas

| Verificação | Resultado e evidência |
| --- | --- |
| Unitários | 25 aprovados: 16 de domínio/demo/payload/restauração, oito do handler e um do adaptador HTTP; `logs/neon-unit.log` |
| TypeScript | Cliente e servidor aprovados; `logs/neon-types.log` |
| Lint | `src`, `server`, `api` aprovados; `logs/neon-lint.log` |
| Expo Doctor | 20/20; `logs/neon-doctor.log` |
| Exportações | Web, Android e iOS aprovadas; `logs/neon-all-export.log` (três plataformas no código final) |
| Banco | Duas migrações aplicadas, RLS e ausência de SELECT público verificados por SQL |
| Limite real | Envio/leitura de 10.036 torneios válidos: 2.096.451 bytes compactos e 2.277.098 bytes JSONB; cópia original restaurada depois; `logs/neon-backup-boundary.json` |
| Entradas HTTP inválidas | JSON malformado 400, excesso de tamanho 413, acesso anônimo 401 e método incorreto 405; `logs/neon-negative-requests.json` |
| Contas em produção | 12 verificações reais aprovadas em desktop e mobile web; `logs/neon-cloud-e2e.log`, `logs/cloud-e2e-result.json` |
| Offline em produção | Cinco participantes, quatro partidas até o campeão sem rede após carregar o app; reconexão, reload, persistência e recuperação de corrupção aprovados; `logs/neon-production-offline.log` |
| Dependências | Oito avisos moderados, zero altos/críticos; `logs/neon-audit-final.json`. Não foi aplicado downgrade incompatível para silenciar avisos |
| PDF | Quatro pilares atualizados; páginas renderizadas e revisadas; gerador em `scripts/generate-pdf.py` |

O roteiro remoto exercitou cadastro, login, senha errada, logout, sessão após reload, cookies seguros, envio pela interface, segunda conta inicialmente sem cópia, restauração da primeira conta em navegador mobile novo, preservação após payload inválido, tentativa de forjar proprietário, conflito de conta esperada, CSRF e Bearer com revogação. Houve zero erros de runtime no roteiro aprovado. O teste de API nativa não equivale a teste do SecureStore no aparelho.

Os logs completos ficam ignorados pelo Git. O resumo acima e o CI são evidências públicas; credenciais temporárias de QA não são publicadas. As contas de teste são criadas com endereços fictícios e removidas por IDs registrados, sem filtros amplos nem exclusão de dados de usuários reais.

## Incidentes corrigidos

1. A Vercel emitia `.js`, mas imports internos preservavam `.ts`; o build passava e a função falhava ao iniciar. `rewriteRelativeImportExtensions` corrigiu o carregamento, verificado no código emitido e por HTTPS.
2. O Expo SDK 58 habilita rotas web assíncronas por padrão; sem rede, a primeira navegação não conseguia baixar uma tela. Desabilitar `asyncRoutes` trouxe as telas ao bundle inicial. O torneio inteiro sem rede passou no navegador de produção.
3. O parser automático de JSON da Vercel podia lançar antes do handler e virar 503. O adaptador agora trata a falha como entrada inválida (400), com teste de regressão e sem expor detalhes internos.

## Limites reais

- Hardware físico não foi testado: câmera, notificações, haptics, compartilhamento e SecureStore precisam de QA em Android/iOS. Exportar bundles não produz APK nem comprova hardware.
- Na web, a primeira abertura exige internet. Não há service worker ou garantia de um hard reload completamente offline. O uso sem rede foi validado com o app já aberto.
- Confirmação de e-mail está desabilitada: cadastrar não comprova posse do endereço. Não há recuperação de senha/OTP na interface. Use contas de avaliação e mantenha outra cópia dos dados importantes.
- O plano gratuito tem cotas; não é capacidade ilimitada. Compute suspenso pode adicionar latência ao primeiro acesso. Consulte [os limites oficiais](https://neon.com/pricing) antes de ampliar o uso.
- Equipe, matrículas e contribuição acadêmica real precisam ser preenchidas pelos alunos. Não foi fabricado histórico de colaboração.

Referências: [Neon Auth](https://neon.com/docs/auth/overview), [rotas assíncronas Expo](https://docs.expo.dev/router/web/async-routes/).
