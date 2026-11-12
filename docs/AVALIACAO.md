# Arena - matriz da avaliação e QA

Aplicativo original em React Native, Expo, TypeScript e Expo Router para torneios presenciais de eliminação simples com 4 a 16 participantes. Um organizador conduz o evento em seu aparelho, sem backend. Prazo do enunciado: **07 de dezembro, às 23h59**; confirmar o ano com o professor.

## Cobertura da rubrica

| Critério | Peso | Evidências a apresentar | Verificação |
| --- | --- | --- | --- |
| Funcionalidade e usabilidade mobile | 30% | Cadastro do torneio, participantes, check-in, sorteio, chaveamento, placares, campeão e navegação de retorno | Executar roteiro físico abaixo; demonstrar fluxo completo sem crash |
| Qualidade técnica e hooks | 25% | Regras em `src/domain.ts`, contexto e custom hook em `src/store.tsx`, componentes reutilizáveis, FlatList, efeitos e hidratação controlados | Testes de domínio, TypeScript, lint e explicação do código pela equipe |
| Documento dos quatro pilares | 20% | Motivação, equipe identificada, desafios reais e comparação fundamentada | Revisar QUATRO-PILARES.md e PDF; resolver campos pendentes |
| Recursos nativos e diferencial web | 15% | Câmera com leitura QR, notificação local, compartilhamento, haptics e dados offline | Testar permissões, recusas e ações em aparelho compatível |
| GitHub e README | 10% | Código completo, instruções reproduzíveis, galeria real, .gitignore e commits de todos | Clone limpo, execução e conferência do histórico real |

Esta matriz descreve critérios e evidências; não concede uma nota nem comprova execução. Resultados automatizados constam em VERIFICACAO.md e nos logs, com comandos e resultados. Teste web ou exportação Android não comprova execução nativa no Expo Go.

## Verificações técnicas e de navegador

Foram aprovados testes de domínio, TypeScript, lint, Expo Doctor (20/20) e exportações web/Android/iOS. A exportação iOS terminou com código de saída 0 em logs/export-ios.log; isso não comprova execução física. Consultar VERIFICACAO.md para comandos e resultados. A contagem de testes pode evoluir com novas alterações e deve ser obtida do registro de verificação.

No navegador, foi exercitado um campeonato de cinco inscritos e quatro partidas até o campeão, com QR visível, persistência após reload e preservação/recuperação de armazenamento corrompido. O roteiro terminou sem erros de página. Sete screenshots reais web, viewport 430 x 932, ficam em `docs/images`. Essas evidências não validam hardware físico.

## Registro do QA físico

**Status inicial: pendente.** Registrar para cada caso: responsável, data, commit, aparelho, versão Android/iOS, versão Expo Go ou build, resultado, evidência e defeito encontrado. Não preencher como aprovado por inferência.

| ID | Ação | Resultado esperado |
| --- | --- | --- |
| QA-01 | Clone limpo, instalar dependências e abrir com `npx expo start` no Expo Go compatível | Sem falha de dependência, crash ou tela vermelha |
| QA-02 | Criar torneio válido; tentar nome vazio, data inválida e campos limites | Validação clara, sem persistir dados inválidos |
| QA-03 | Adicionar, editar e remover participantes antes de iniciar | Lista coerente; limites 4-16 respeitados ao iniciar |
| QA-04 | Tentar iniciar com 3 participantes e exceder 16 | Operações inválidas bloqueadas com orientação |
| QA-05 | Exibir cartão QR e ler em outro suporte/tela com a câmera do organizador | Participante correto recebe check-in; cadastro não duplica |
| QA-06 | Ler QR inválido, de outro torneio e repetir leitura do mesmo cartão | Erros claros; nenhuma associação incorreta ou efeito repetido |
| QA-07 | Negar câmera, voltar e realizar check-in manual | Sem crash; alternativa manual utilizável; recusa explicada |
| QA-08 | Iniciar torneio com 4, 5, 7, 8 e 16 participantes | Todos entram uma vez; byes avançam corretamente; nenhum confronto impossível |
| QA-09 | Fechar e reabrir após sorteio | Mesmo chaveamento; sorteio não é refeito silenciosamente |
| QA-10 | Informar placar válido, negativo, vazio, decimal e empate | Apenas entradas válidas são salvas; empate exige vencedor explícito |
| QA-11 | Corrigir resultado antes de disputar confronto dependente | Chaveamento dependente é atualizado de forma coerente |
| QA-12 | Tentar corrigir resultado após disputar fase dependente | Correção bloqueada, sem invalidar partidas já disputadas |
| QA-13 | Completar torneio e compartilhar campeão | Campeão correto; compartilhamento abre seletor nativo; cancelamento seguro |
| QA-14 | Colocar em modo avião, reiniciar app e continuar torneio | Dados e resultados mantidos; funções centrais independem de rede |
| QA-15 | Agendar lembrete futuro com permissão; app em segundo plano | Alerta local observado; registrar horário solicitado e real |
| QA-16 | Negar notificações ou tentar horário passado; reagendar e excluir torneio com lembrete | Falha visível e recuperável; exclusão cancela lembrete; não há botão separado para cancelar |
| QA-17 | Executar ação com feedback háptico | Vibração em aparelho com suporte; ausência de suporte não bloqueia ação |
| QA-18 | Fonte ampliada, aparelho pequeno, teclado e leitor de tela | Campos, botões, listas e retorno acessíveis sem sobreposição impeditiva |
| QA-19 | Encerrar app após salvar resultado e reabrir | Resultado persistido e campeonato consistente |
| QA-20 | Em ambiente de desenvolvimento, simular armazenamento inválido/falha de escrita | Erro e recuperação visíveis; dados corrompidos não sobrescritos silenciosamente |

O teste de corrupção deve usar cópia de dados de desenvolvimento, nunca dados reais do usuário. Testar Android e iOS quando disponíveis e registrar plataforma não verificada. Leitura QR requer cartão exibido fora da câmera do próprio aparelho. QR local não autentica identidade: alguém com cópia do cartão pode apresentá-lo.

Para notificações, testar com horário futuro próximo suportado pela interface. Permissão concedida não equivale a alerta entregue; economia de bateria, configurações e políticas do SO podem atrasar ou impedir entrega. Não há push remoto.

## Checklist obrigatório antes da submissão

- [ ] Confirmar que a camada mobile foi criada do zero nesta disciplina.
- [ ] Preencher nomes completos, matrículas e links GitHub em README e quatro pilares.
- [ ] Ajustar matriz de responsabilidades para refletir contribuição real.
- [ ] Garantir commits próprios e explicáveis de todos; não fabricar histórico.
- [ ] Publicar repositório ou conceder acesso ao professor.
- [ ] Conferir .gitignore, sem node_modules, .expo, segredos ou dados pessoais desnecessários.
- [x] Executar testes de domínio, TypeScript, lint, Expo Doctor e exportações web/Android.
- [x] Conferir exportação iOS aprovada (exit 0 em logs/export-ios.log); consultar VERIFICACAO.md.
- [ ] Executar QA em dispositivo físico e guardar evidências.
- [ ] Inserir imagens/GIFs reais no README, identificando plataforma.
- [x] Identificar dois apps similares nas lojas: Winner e Tournify, com links oficiais nos quatro pilares.
- [x] Registrar críticas públicas do Winner com data e limites, incluindo resposta do desenvolvedor.
- [ ] Complementar críticas recentes; coletar avaliações textuais do Tournify, não expostas na consulta pública.
- [ ] Documentar desafios efetivamente observados com reprodução, correção e reteste.
- [ ] Revisar PDF final e atualizar após preencher campos.
- [ ] Validar instruções do README em clone limpo.
- [ ] Enviar link do GitHub e PDF até 23h59 de 07/12.

## Demonstração sugerida (6-8 minutos)

1. Explicar organizador/persona e o problema dos eventos presenciais.
2. Criar campeonato, cadastrar participantes e mostrar QR/check-in manual.
3. Iniciar com quantidade ímpar e explicar bye e sorteio persistido.
4. Registrar resultados, resolver empate e demonstrar bloqueio de correção tardia.
5. Reabrir em modo avião, concluir e compartilhar o campeão.
6. Mostrar notificação e haptics em aparelho; apresentar domínio, hook e evidências técnicas.
7. Apresentar papéis, desafio real e benchmark com suas limitações.

## Limitações a declarar

Não há sincronização, login, pagamentos, chat, ligas ou vários organizadores simultâneos. Desinstalar/limpar dados pode eliminar campeonatos. AsyncStorage não é cofre criptografado. Compartilhar um resumo não transfere gestão do torneio. O sorteio não possui certificação de auditoria competitiva. QR é identificador local, sem autenticação. Demonstrações físicas e participação da equipe dependem de validação humana real.
