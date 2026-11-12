# Atualização de verificação - Neon/API - 12/11/2026

| Verificação da integração | Resultado registrado |
| --- | --- |
| Unitários | 25 aprovados: nove de servidor e 16 de domínio/demo/payload/restauração |
| TypeScript | Cliente e servidor aprovados (`npm run typecheck`) |
| ESLint | src, server e api aprovados (`npm run lint`) |
| Exportação web | Aprovada |
| Banco remoto | Migrações `001_arena_backups.sql` e `002_jsonb_storage_margin.sql` aplicadas; tabela `public.arena_backups`, RLS habilitada, zero linhas antes do QA |
| Deploy e QA com duas contas | Aprovados em produção; ver NEON.md |
| Sessão nativa e hardware físico | Pendente de aparelho |

Projeto exclusivo `fragrant-hill-82542920`, branch `br-wandering-wind-bebhk06j`, Free, `aws-us-east-2`. Banco privado acessível por SQL somente no servidor, sem exposição Data API. Projetos não relacionados não foram alterados. A API Vercel `/api/arena` valida sessão Neon Auth e deriva o proprietário apenas da identidade autenticada. Web usa cookie assinado HttpOnly/Secure/SameSite=Lax; nativo usa Expo SecureStore + Bearer assinado, sem AsyncStorage para autenticação.

Backup manual de até 2 MiB, validado e sem IDs de notificações; restauração substitui a lista mediante confirmação, sem merge ou sincronização automática. Fluxo local offline preservado. Confirmação de e-mail desabilitada; interface sem recuperação de senha/OTP. Consultar [NEON.md](NEON.md) para evidências finais e configuração, sem registrar credenciais reais aqui.

As aprovações de exportações Android/iOS e E2E abaixo pertencem a versões anteriores; não provam esta integração em aparelho físico. O PDF foi atualizado para o escopo Neon.

---

# Verificação da versão local

**Registro histórico da interface (12/11/2026, anterior ao backend Neon):** a interface foi reformulada e revalidada. Naquele registro, havia 10 testes aprovados, TypeScript/lint sem falhas, Expo Doctor 20/20, exportações das três plataformas e E2E/checagem visual aprovados. Veja o [registro da reformulação](REDESIGN.md). O conteúdo abaixo preserva a verificação histórica de 10/11.

Data: 10/11/2026. Resultados locais, não execução do CI remoto. Logs completos preservados em `logs/`, ignorados pelo Git.

| Gate | Resultado observado | Evidência local |
|---|---|---|
| Domínio | 8 testes, 8 aprovados, 0 falhas; ciclos RED/GREEN registrados | `logs/domain.log` |
| TypeScript | `tsc --noEmit`, exit 0 após implementação final | `logs/typecheck-final.log` |
| ESLint | `eslint src`, exit 0, sem erros/avisos | `logs/lint-final.log` |
| Expo Doctor | 20/20 verificações aprovadas | `logs/doctor.log`, conferência final em `logs/doctor-final.log` |
| Exportação conjunta | Web, Android e iOS, exit 0 após edição de participantes | `logs/export-final.log` |
| Metro | Iniciou em `http://localhost:8083`, endpoint `/status` respondeu | `logs/metro-start.log` |
| Revisão independente | Sem achados altos ou médios na revisão estática de domínio, store e telas | Revisão realizada nesta sessão, sem alteração de arquivos |

## Interface real

Teste automatizado no Google Chrome instalado, via Playwright, viewport 430 × 932. O fluxo cobre criação, cinco inscrições, edição de nome, presença manual, cartão QR renderizado, sorteio com byes, quatro partidas reais, campeão, reabertura, histórico e dados corrompidos preservados/recuperados. O resultado fica em `logs/e2e-final.log`. Capturas reais: `docs/images/01-inicio.png` até `07-historico.png`.

O teste anterior ao último ajuste de edição também aprovou o fluxo completo, corrupção e recuperação, com zero erros JavaScript (`logs/e2e.log`). Os testes de navegador não leem um QR com câmera física nem confirmam seletor nativo de compartilhamento, vibração ou entrega de notificação.

## Falhas encontradas e corrigidas

- Node 25.7.0 do ambiente não atende aos engines do SDK58. Execuções do Expo e compilador usaram Node24.22.2, e o iniciador oferece essa alternativa sem trocar a instalação global.
- A primeira tentativa de instalar módulos ocorreu antes de a instalação base terminar. A instalação foi aguardada e os módulos foram instalados pela CLI Expo com versões compatíveis.
- React Native0.88 altera os tipos de referência da View: capturas passaram a usar `ComponentRef<typeof View>`.
- Lint detectou atualização de estado na chamada direta do efeito inicial. A hidratação passou a publicar dados no callback assíncrono, com cleanup para impedir atualizações depois de desmontar.
- A primeira espera do teste de interface selecionava um SVG oculto da navegação. O seletor foi corrigido para a tela do cartão e SVG visível; o fluxo então passou.
- `expo lint` instalou a configuração mas falhou na detecção de ESLint neste ambiente. O comando oficial do ESLint foi executado diretamente; `npm run lint` usa `eslint src` e passou com a configuração Expo.

## Dependências: resultado que permanece aberto

`npm audit --json` retornou exit1 com **10 avisos moderados, 0 altos e 0 críticos** (`logs/audit-final.json`). A cadeia envolve `glob`, `minimatch`, ferramentas Expo e ferramentas ESLint/TypeScript. `npm audit fix` sem `--force` foi tentado; atualizou dependências compatíveis, mas os avisos permaneceram.

A sugestão automática inclui downgrade incompatível de Expo58 para52. Não foi aplicada. Também não foram forçadas versões major de dependências transitivas sem comprovar compatibilidade. Isso não equivale a afirmar ausência de risco: revisar avisos e atualizações oficiais antes de distribuir publicamente. A lista/lockfile do projeto refletem o estado testado.

## Validação externa ainda necessária

1. Executar checklist em Android/iOS físico com Expo Go compatível: câmera, negativa de permissão, leitura de QR, notificações em primeiro/segundo plano, haptics, compartilhamento de imagens, acessibilidade e reabertura offline.
2. Preencher equipe, matrícula, perfis e atribuições reais no README/documento.
3. Publicar o repositório no GitHub e verificar acesso do professor. Git local inicializado, sem commits ou autoria fabricados. O workflow remoto está preparado, mas não foi executado no GitHub.
4. Acrescentar evidências físicas e relatos reais do grupo ao PDF antes da entrega. Não apresentar desafios previstos como incidentes vivenciados pela equipe.

## Economia aplicada

Caveman foi usado para reduzir cerimônia nas respostas; Ponytail para evitar backend, abstrações e funcionalidades extras. Skills específicas foram instaladas no projeto e lidas sob demanda; não houve proxy, interceptação de tráfego ou alteração global de configurações. Domínio, documentação e revisão foram delegados com arquivos exclusivos. Saídas extensas ficaram em logs; gates só foram repetidos após mudanças ou falhas relevantes.

Não existe medição contrafactual confiável do consumo de tokens desta execução. Portanto, nenhuma porcentagem de economia é declarada. Sucesso de testes e exportações é evidência de qualidade técnica local, não uma prova estatística de que uma skill economiza a franquia Codex.
