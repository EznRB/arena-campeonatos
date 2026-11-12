# Arena — meta de desenvolvimento

## Objetivo e critério de conclusão
Entregar aplicativo mobile original, executável com Expo, para organizar campeonatos presenciais de eliminação simples com 4–16 participantes. Cobrir o enunciado acadêmico com código modular, Expo Router, Hooks, FlatList, recursos nativos, documentação e PDF. O fluxo completo deve funcionar offline no aparelho do organizador.

Autorização: execução contínua solicitada pelo usuário. Arena adotado pela recomendação anterior; nenhum novo gate para decisões rotineiras. Não publicar repositório ou atribuir participação fictícia.

## Escopo fechado
Criar torneios com nome, modalidade, local e horário; gerenciar participantes antes do início; cartões QR para check-in; sorteio persistido; byes para números não potência de dois; placares e desempate explícito; correções bloqueadas quando fase dependente já foi disputada; campeão e compartilhamento; lembrete local; haptics; armazenamento local validado.

Sem pagamentos, backend, chat, múltiplos organizadores simultâneos ou ligas. QR identifica registro local, não autentica identidade. Resultados sem conexão não sincronizam com outros aparelhos.

## Arquitetura e arquivos
- `src/domain.ts`: tipos e regras puras, validação de persistência, sorteio, byes, resultados e QR.
- `tests/domain.test.ts`: regras e casos extremos, executados pelo runner do Node.
- `src/store.tsx`: contexto, custom hook, hidratação, fila de gravação e recuperação de falhas sem sobrescrever dados corrompidos.
- `src/components`: identidade visual, componentes reutilizáveis e estados de tela.
- `src/app`: abas, criação, detalhes, participantes, chaveamento, resultados e scanner com Expo Router.
- `src/native.ts`: notificações e feedback, sem push remoto.
- `docs`: README complementar, matriz da rubrica, quatro pilares, fontes, QA e checkpoint.

## Etapas e gates
- [x] 1. Preparação: Node compatível; pesquisar skills e repositórios; registrar decisões e versões.
- [x] 2. Domínio: escrever testes antes da implementação; conferir 4–16 participantes, byes, vencedor, empate, correção e persistência inválida.
- [x] 3. Aplicativo: persistência resistente a falhas, navegação, formulários validados, listas e estados de carregamento/erro/vazio.
- [x] 4. Implementação de hardware: QR/câmera com permissões, notificações locais, compartilhamento e haptics com falhas visíveis e alternativas manuais. QA físico permanece pendente.
- [x] 5. Verificação local: testes, TypeScript, lint, Expo Doctor e exportações web/Android/iOS; revisão independente focada em falhas de domínio e dados.
- [x] 6. Entregáveis: README com comandos/dependências, imagens reais identificadas por plataforma, PDF quatro pilares, equipe e QA pendentes explicitados.

## Economia sem perda de qualidade
Caveman para comunicação objetiva; Ponytail para menor implementação completa, preservando validação e acessibilidade. Skills instaladas no projeto, sem proxy, hooks globais ou reescrita automática de instruções. Carregar apenas referências necessárias. Logs completos em `logs/`, reportar exit codes e falhas. Não repetir gates aprovados sem mudança relevante. Delegar apenas tarefas independentes com arquivos exclusivos. Sem percentual prometido: não há medição contrafactual confiável da franquia Codex.

## Referências avaliadas
- Expo oficial: https://github.com/expo/expo e https://github.com/expo/skills — base e skills específicas.
- Caveman: https://github.com/JuliusBrussee/caveman — skill de estilo, sem instalar proxy.
- Ponytail: https://github.com/DietrichGebert/ponytail — simplificação preservando segurança e testes.
- Brackets Manager: https://github.com/Drarig29/brackets-manager.js — referência de regras; não incorporar visualizador DOM em React Native. Motor próprio restrito à eliminação simples mantém a explicação acadêmica direta; testes de invariantes compensam o risco.
- Challonge e Toornament — benchmark funcional, não código a reaproveitar.

## Limites da conclusão
Não alegar câmera, notificações ou haptics testados fisicamente sem aparelho. Nomes, matrículas, perfis GitHub, acesso do professor e contribuição real da equipe dependem dos alunos. Documento deve distinguir implementação, verificação automatizada e validação física pendente.

## Checkpoint final
Versão local implementada. 8 testes de domínio, E2E com cinco participantes/quatro partidas, persistência e recuperação de corrupção aprovados. TypeScript, lint, Expo Doctor 20/20 e exportação das três plataformas aprovados. Metro iniciou e prévia web disponível em localhost:4173 durante esta sessão. Veja `VERIFICACAO.md` para evidências e 10 avisos moderados transitivos. Próximo passo externo: QA físico, dados reais do grupo e publicação do GitHub.
