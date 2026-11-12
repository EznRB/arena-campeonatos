# Arena

**Seu jogo. Sua arena.** Organizador mobile de campeonatos presenciais entre amigos, criado do zero com React Native, Expo Router e TypeScript para a avaliação de Mobile.

Repositório: [EznRB/arena-campeonatos](https://github.com/EznRB/arena-campeonatos).

Aplicação publicada: [arena-campeonatos.vercel.app](https://arena-campeonatos.vercel.app).

Uma pessoa organiza o torneio no próprio aparelho: cadastra participantes, confirma presenças, sorteia confrontos e registra resultados até o campeão. O fluxo principal funciona sem internet e sem conta.

## Galeria

### Interface reformulada em 11/11

Composição própria para desktop e adaptação mobile. Capturas reais, com campeonato demonstrativo identificado:

![Painel desktop reformulado](docs/images/v2-desktop-dashboard.png)

| Chaveamento completo | Central do campeonato |
|---|---|
| ![Árvore de confrontos](docs/images/v2-desktop-chaveamento.png) | ![Central](docs/images/v2-desktop-central.png) |

[Criar campeonato](docs/images/v2-desktop-criar.png) · [Versão mobile](docs/images/v2-mobile-dashboard.png) · [Notas da reformulação](docs/REDESIGN.md).

Na tela inicial, **Explorar demonstração** cria uma cópia local de um torneio com oito jogadores e confrontos prontos para continuar. Dados demonstrativos não entram nos indicadores dos campeonatos reais.

Capturas reais da versão web executada em viewport de 430 × 932. São evidência do fluxo e da interface; não substituem prints e testes do Expo Go em dispositivo físico.

| Início | Confrontos | Campeão |
|---|---|---|
| ![Início](docs/images/01-inicio.png) | ![Confrontos](docs/images/04-chaveamento.png) | ![Campeão](docs/images/06-campeao.png) |

Mais telas: [participantes](docs/images/02-participantes.png), [cartão QR](docs/images/03-cartao-qr.png), [placar](docs/images/05-resultado.png) e [histórico](docs/images/07-historico.png).

## Executar

### Pré-requisitos

- Node.js **24 LTS**, recomendado para o Expo SDK 58. A versão 25 instalada nesta máquina não atende aos engines do SDK. O projeto inclui `.nvmrc` e um iniciador PowerShell com alternativa automática usando Node 24.
- npm, computador e celular na mesma rede para Expo Go.
- Expo Go compatível com SDK 58. Consulte [a página oficial do Expo Go](https://expo.dev/go). Se a versão da loja for diferente, use a versão compatível para Android ou um development build; não atualize dependências individualmente para contornar incompatibilidade.

```powershell
cd "C:\Users\enzo\Desktop\dev mobile\arena"
npm ci
npx expo start
```

No Windows, também é possível executar:

```powershell
.\iniciar.ps1
```

O iniciador instala dependências se necessário e usa Node 24 quando a versão principal instalada é incompatível. Se a política de execução bloquear scripts, use os comandos npm acima com Node 24, ou:

```powershell
npm exec --yes --package=node@24 -- node node_modules/expo/bin/cli start
```

Leia o QR do Metro no Expo Go (Android) ou na câmera (iOS). No terminal, `w` abre a versão web. Problemas de rede: tente `npx expo start --tunnel` (pode solicitar instalação do adaptador de túnel). Android Studio e Xcode não são necessários para usar o Expo Go.

### Prévia web e verificações

```sh
npm test
npm run typecheck
npm run lint
npx expo-doctor
npx expo export --platform web
npm run preview
```

Prévia local: `http://127.0.0.1:4173`. Após iniciar a prévia, em outro terminal:

```sh
npm run test:e2e
```

O teste de interface usa `playwright-core` e Google Chrome instalado. No Windows, procura o caminho padrão de instalação. Em outro ambiente, informe `CHROME_PATH` com o executável do navegador. As capturas são regeneradas em `docs/images`. A prévia serve somente em localhost; não é um servidor de produção.

Exportar o bundle Android:

```sh
npx expo export --platform android --output-dir dist-android
```

Exportar bundle não produz um APK e não comprova funcionamento do hardware. Para um build instalável, configure sua conta Expo/EAS e identificadores próprios antes de distribuir.

## Fluxo de demonstração

1. Criar “Copa do Campus”, escolher modalidade, local e horário.
2. Adicionar cinco participantes para demonstrar avanços automáticos.
3. Abrir e compartilhar o cartão QR de uma inscrição. Em um segundo aparelho ou papel, apresentar o cartão para leitura no aparelho organizador. Confirmar os demais manualmente.
4. Iniciar o torneio. O sorteio é persistido e não muda ao reabrir.
5. Registrar as quatro partidas reais, passando pelas abas de rodadas. Em um empate, informar o vencedor do desempate.
6. Mostrar o campeão e compartilhar o card. Reabrir o app e conferir o histórico.
7. Em outro torneio com data futura, autorizar e agendar o lembrete local.

## Funcionalidades e regras

- Eliminação simples com 4–16 jogadores ou equipes representados por um nome.
- Nomes de participantes únicos no campeonato, ignorando maiúsculas/minúsculas.
- Check-in manual ou por QR; todos os inscritos precisam estar presentes para iniciar.
- Sorteio Fisher–Yates e chave na próxima potência de dois; byes apenas na primeira rodada.
- Placar inteiro entre 0 e 999. Empate exige escolha explícita do vencedor conforme a modalidade.
- Correção permitida enquanto nenhum confronto dependente tiver resultado. Alterar uma semifinal já usada em uma final disputada é bloqueado.
- Participantes podem ser adicionados/removidos antes do início; após o sorteio, a lista fica fechada.
- Histórico, busca, exclusão com confirmação e estados de loading/error/empty.

## Recursos nativos

| Recurso | Uso e comportamento alternativo |
|---|---|
| Câmera | Scanner de QR de inscrição; negativa de permissão mantém check-in manual. |
| Notificações locais | Lembrete no horário de início, com canal Android e pedido de permissão. Sem push remoto. |
| Compartilhamento | Cartão QR e campeão como imagem no mobile; convite como texto. Na web, cartão pode ser impresso e o campeão compartilhado como texto. |
| Haptics | Retorno tátil em ações concluídas; falta de suporte não cancela a operação. |
| AsyncStorage | Dados locais validados e escritos em fila; a interface publica a mudança depois da gravação. |

O QR não é credencial de segurança: identifica um participante no torneio daquele aparelho. Compartilhar convite ou cartão não sincroniza campeonatos entre dispositivos. Notificações dependem de autorização e configurações do sistema.

## Arquitetura

```text
src/
  app/                 Rotas e layouts do Expo Router
    (tabs)/            Campeonatos, histórico e guia
    tournament/        Central e campeão
    participants/      Cadastro e presenças
    bracket/           Rodadas e confrontos
    match/             Placar e desempate
    ticket/            Cartão QR
    scanner/           Câmera para check-in
  components/          Componentes visuais e listas reutilizáveis
  domain.ts            Regras puras, tipos e validação dos dados
  store.tsx            Contexto, hidratação e fila de persistência
  use-tournament.ts    Custom hook de seleção por rota
  native.ts            Notificações e haptics
server/                Autenticação, autorização e backup no servidor
api/                   Handler Vercel /api/arena
database/migrations/   Migração SQL do backup privado
tests/                 Testes de domínio, payload e backend
scripts/               Prévia SPA e teste real de interface
docs/                  Plano, rubrica, quatro pilares e capturas
output/pdf/            Documento acadêmico
```

O fluxo principal usa dados locais e funciona sem conta. O backup opcional usa Neon Auth gerenciado e uma API própria na Vercel (`/api/arena`), com credenciais de banco apenas no servidor. Hooks usados: `useState`, `useEffect` com cleanup, `useRef`, `useCallback`, `useContext` e custom hooks. Listas usam `FlatList`. Componentes de texto usam `Text`.

## Dependências

As versões exatas estão em [package-lock.json](package-lock.json); as declaradas, em [package.json](package.json).

- **Base:** `expo`, `react`, `react-native`, `typescript`, `@types/react`.
- **Navegação:** `expo-router`, `expo-linking`, `expo-constants`, `react-native-screens`, `react-native-safe-area-context`.
- **Mobile:** `expo-camera`, `expo-crypto`, `expo-haptics`, `expo-notifications`, `expo-sharing`, `expo-status-bar`.
- **Persistência local:** `@react-native-async-storage/async-storage`.
- **Conta e servidor:** `expo-secure-store`, `@neondatabase/serverless`; tipos de funções Vercel em `@vercel/node`.
- **Cartões:** `react-native-qrcode-svg`, `react-native-svg`, `react-native-view-shot`.
- **Web:** `react-dom`, `react-native-web`.
- **Identidade visual:** `expo-font`, `@expo-google-fonts/inter`, `@expo-google-fonts/barlow-condensed`, `lucide-react-native`.
- **Qualidade:** `eslint`, `eslint-config-expo`, `playwright-core`; runner de testes nativo do Node.

## Evidências e limites

Consulte [VERIFICACAO.md](docs/VERIFICACAO.md) para resultados executados, limitações e avisos de dependências. O workflow `.github/workflows/ci.yml` executa as verificações a cada push; consulte o resultado remoto na aba Actions do repositório.

Os dados ficam neste dispositivo/navegador. Desinstalar, limpar dados do aplicativo ou armazenamento do navegador remove os campeonatos. O backup online é manual e opcional; usa a configuração Neon/API descrita abaixo. Não há sincronização automática. Dados corrompidos não são substituídos silenciosamente por uma lista vazia: a edição fica bloqueada e o conteúdo original é preservado.

## Entrega acadêmica e equipe

- [Plano de desenvolvimento e fontes](docs/PLANO.md).
- [Matriz da rubrica, checklist e QA manual](docs/AVALIACAO.md).
- [Quatro pilares em Markdown](docs/QUATRO-PILARES.md).
- [Quatro pilares em PDF](output/pdf/Arena-Quatro-Pilares.pdf).

Preencher com a equipe real antes da entrega:

| Nome completo | Matrícula | GitHub | Responsabilidade e contribuição real |
|---|---|---|---|
| A preencher | A preencher | A preencher | UI/UX e componentes |
| A preencher | A preencher | A preencher | Telas e navegação |
| A preencher | A preencher | A preencher | Regras, hooks e persistência |
| A preencher | A preencher | A preencher | QA e documentação |

Adapte as linhas à composição real do grupo. IA foi usada como apoio à implementação; cada integrante deve estudar e explicar o código. A divisão acima é sugerida e não comprova participação.

### GitHub

Publicado em `EznRB/arena-campeonatos`, com deploy na Vercel conectado ao GitHub. Conceda o acesso necessário ao professor e confira o `.gitignore`. O projeto não inclui histórico fictício de contribuição. Cada pessoa deve realizar e registrar seu trabalho com autoria própria. Não commitar `node_modules`, `.expo`, logs, segredos ou bundles gerados.

## Skills e referências de desenvolvimento

Skills instaladas em `.agents/skills`: Caveman, Ponytail, Expo Router e Expo UI. Foram aplicadas comunicação concisa, redução de abstrações e orientação de navegação; Expo UI foi avaliada, sem necessidade de adicionar seu runtime para os componentes usados. Não foram instalados proxies, hooks globais ou compressão automática de instruções. Não há porcentagem de economia de tokens comprovada.

Fontes: [Expo](https://github.com/expo/expo), [Expo Skills](https://github.com/expo/skills), [Caveman](https://github.com/JuliusBrussee/caveman), [Ponytail](https://github.com/DietrichGebert/ponytail) e [Brackets Manager](https://github.com/Drarig29/brackets-manager.js). O último foi avaliado como referência; o motor restrito de eliminação simples foi escrito neste projeto e testado, sem incorporar visualizadores web incompatíveis com React Native.


## Conta e backup online

A tela **Conta e backup** permite cadastro por e-mail/senha, entrada, envio e restauração manual de uma cópia dos torneios. O fluxo local funciona sem conta e sem internet. Restaurar exige confirmação e substitui os torneios locais; não combina listas nem sincroniza alterações automaticamente. Identificadores de notificações são removidos do payload validado: restaurar não transfere os lembretes de outro aparelho.

### Infraestrutura e configuração

O projeto Neon exclusivo do Arena já foi provisionado: `fragrant-hill-82542920`, branch `br-wandering-wind-bebhk06j`, plano Free, região `aws-us-east-2`. Projetos não relacionados permanecem fora do escopo. As migrações `database/migrations/001_arena_backups.sql` e `002_jsonb_storage_margin.sql` foram aplicadas ao banco remoto; a tabela `public.arena_backups` foi verificada com RLS habilitada e zero linhas antes do QA. Ela é privada, acessada por SQL somente no servidor, sem exposição pela Data API.

1. Executar `npm ci` com Node 24. Copiar `.env.example` para `.env.local` e manter apenas a configuração pública necessária ao cliente:

   ```dotenv
   EXPO_PUBLIC_ARENA_API_URL=https://arena-campeonatos.vercel.app/api/arena
   ```

2. No ambiente do servidor Vercel, configurar `DATABASE_URL`, `NEON_AUTH_BASE_URL` e `ARENA_ORIGIN`. A origem de produção é `https://arena-campeonatos.vercel.app`. Usar os valores privados do projeto autorizado; não inserir credenciais em código, screenshots, logs públicos ou variáveis `EXPO_PUBLIC_*`. O cliente recebe apenas a URL pública da API.
3. Em nova instalação de infraestrutura, executar `node scripts/migrate-neon.cjs` com a conexão correta em `.env.local` e verificar tabela/RLS. No projeto indicado, essa etapa já foi executada; não criar outro banco nem modificar projetos não relacionados.
4. Refazer a exportação/deploy quando mudar a URL pública. `npm run preview` serve a SPA local e não emula o handler Vercel. Para QA de conta, usar uma API implantada/configurada e uma origem aceita pelo servidor; não liberar origens indiscriminadamente para contornar configuração.
5. Executar `npm test`, `npm run typecheck` (cliente e servidor), `npm run lint` (`src`, `server` e `api`) e `npx expo export --platform web`.
6. Antes de declarar pronto em produção, validar cadastro/entrada, envio/restauração, logout e isolamento entre duas contas na implantação final. Estado e evidências finais: [NEON.md](docs/NEON.md).

### Sessão e autorização

A API valida a sessão Neon Auth em cada requisição protegida e obtém o proprietário exclusivamente do usuário autenticado; um ID enviado pelo cliente não concede acesso a outro backup. RLS permanece habilitada como defesa adicional, mas não substitui a autorização da API.

No navegador, a sessão usa cookie assinado `HttpOnly`, `Secure` e `SameSite=Lax`. No aplicativo nativo, a sessão assinada fica no Expo SecureStore e é enviada como Bearer; credenciais de sessão não ficam no AsyncStorage. A conexão SQL e a URL interna de Auth são configurações do servidor, nunca segredos embarcados no bundle.

Cadastro usa e-mail/senha, com mínimo de oito caracteres. A confirmação de e-mail está desabilitada na configuração gerenciada atual; portanto, o cadastro não comprova posse do endereço. A interface atual não oferece recuperação de senha nem fluxo OTP. Não use uma conta de avaliação como único meio de recuperar dados importantes.

O backup aceita até 2 MiB, com validação antes de gravar/restaurar. Alterações posteriores exigem novo envio. Desinstalar ou limpar dados locais perde campeonatos que não tenham uma cópia enviada; restaurar depende de rede e conta válida.

### Estado da verificação em 12/11/2026

25 testes unitários aprovados (nove de servidor e 16 de domínio/demo/payload/restauração), TypeScript de cliente/servidor, lint de `src/server/api` e exportação web aprovados. O provisionamento e a migração remota foram verificados. **Deploy e QA em produção com duas contas aprovados, incluindo restauração e isolamento.** Consulte [NEON.md](docs/NEON.md) e [VERIFICACAO.md](docs/VERIFICACAO.md) para atualização das evidências. Exportações atuais de Android/iOS aprovadas; não comprovam execução em aparelho físico. Câmera, notificações, haptics e sessão nativa ainda exigem QA físico.

O plugin/skill Neon foi consultado para o backend. A conexão MCP usa OAuth na configuração de projeto `.codex/config.toml`; o arquivo não deve conter senhas ou tokens literais.

Roteiro de produção: `node scripts/cloud-e2e.cjs`. Para conferir o torneio offline após a abertura inicial, defina `BASE_URL`, `OFFLINE=1` e `CAPTURE_SCREENSHOTS=0` ao executar `node scripts/e2e.cjs`. Na web, abrir inicialmente a página requer rede; hard reload offline não é garantido.
