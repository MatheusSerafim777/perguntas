# Perguntas principais para a reunião — arquitetura de dados e BI

## Objetivo

Identificar o caminho real dos dados, localizar o atraso estimado de 24 horas entre sua geração ou alteração e sua disponibilidade no BI e reunir informações para definir o escopo da melhoria.

**Roteiro consolidado:** 20 perguntas principais. As **10 marcadas com ★** são prioritárias; comece por elas se o tempo for limitado. Os desdobramentos servem para esclarecer respostas curtas e não precisam ser lidos como perguntas separadas.

**Premissas:** o uso de Nérus/API, TOTVS, Prometheus, BI e planilhas foi informado. A participação de cada tecnologia no mesmo fluxo e a existência de um Data Warehouse ainda precisam ser confirmadas. Nenhuma solução foi escolhida.

---

## 1. Problema, prioridade e caminho dos dados

- [ ] **1. ★ Qual relatório ou processo mais sofre com o atraso, qual decisão depende dele e qual seria o prazo aceitável para o dado aparecer?**
  - Esclarecer se as 24 horas são uma estimativa ou uma medição, quais tipos de dados são afetados e se há variação por horário, loja ou canal.

- [ ] **2. ★ Podemos escolher um registro recente desse relatório e acompanhar seu caminho completo, com horários, desde a origem até o BI?**
  - Pode ser pedido, nota, movimentação ou outro registro relevante. Desenhar os sistemas e etapas envolvidos; usar a tabela de rastreamento ao final.

- [ ] **3. ★ Onde cada informação é gerada, qual sistema é sua fonte oficial e quem responde por cada etapa do fluxo?**
  - Quando Nérus, TOTVS, planilha e BI divergem, identificar quem valida o valor correto e qual definição de negócio deve prevalecer.

## 2. Banco de dados e consumo pelo BI

- [ ] **4. ★ De qual fonte o relatório realmente lê: banco operacional, réplica, Data Warehouse, API ou arquivo?**
  - Confirmar se existe DW, qual tecnologia é utilizada e se há uma área intermediária de importação ou Data Lake antes da camada consultada. Distinguir dado recebido de dado pronto para análise.

- [ ] **5. ★ Qual ferramenta de BI é utilizada e ela consulta a fonte diretamente, importa uma cópia dos dados ou combina os dois modos?**
  - Identificar também onde ficam os cálculos e as regras do relatório: banco, transformação ou modelo do BI.

- [ ] **6. ★ Quando o dado já está pronto na fonte consultada, quanto tempo leva para aparecer no BI e o que ocorre nesse intervalo?**
  - Conferir agenda e histórico de atualizações, duração, falhas, cache, gateway e eventuais limites da configuração ou licença utilizada.

## 3. Cargas, integrações e trabalho manual

- [ ] **7. ★ Quais rotinas transferem e transformam os dados, com quais ferramentas, horários e dependências?**
  - Pedir o histórico do agendador. Separar tempo aguardando início de tempo em execução e verificar se as etapas começam por horário, dependência ou evento.

- [ ] **8. ★ As cargas processam tudo ou apenas o que mudou? Como identificam alterações posteriores, exclusões, cancelamentos e devoluções?**
  - Verificar o significado do campo de data utilizado e como a equipe confere a completude e a correção do resultado, inclusive após mudanças em registros antigos.

- [ ] **9. ★ Alguma etapa depende de envio de planilha, conferência, aprovação ou fechamento? Qual é o tempo de espera nessa etapa?**
  - Identificar quem gera e recebe os arquivos, por que eles existem e quais regras contêm. Distinguir espera operacional de fechamento necessário ao indicador; verificar se uma visão provisória seria útil.

## 4. Participação efetiva da Nérus e da TOTVS

- [ ] **10. ★ A Nérus e a TOTVS participam do caminho desse relatório? Qual é o papel de cada uma e existe troca de dados entre elas?**
  - Identificar direção, mecanismo e frequência das conexões. Se algum sistema estiver fora do fluxo, registrar isso explicitamente.

- [ ] **11. Quais produtos, versões e módulos da Nérus e da TOTVS estão instalados, e quem mantém suas customizações e integrações?**
  - Confirmar se a documentação pública da NerusAPI corresponde à instalação utilizada e quais endpoints o consumidor realmente chama.

- [ ] **12. Quais interfaces estão disponíveis e são suportadas para obter os dados necessários, e quais limites ou restrições possuem?**
  - Considerar APIs, conectores, arquivos, leitura de banco ou captura de alterações. Verificar cobertura dos dados, paginação, lotes, autenticação, limites de chamadas e condições de suporte.

- [ ] **13. Já existem webhooks, filas, eventos ou integrações de baixa latência que possam ser aproveitados nesse fluxo?**
  - Identificar eventos cobertos, consumidores, atraso observado e mecanismos de recuperação. Se existirem caches de pendências, esclarecer se a confirmação de um consumidor afeta os demais.

## 5. Desempenho, falhas e monitoramento

- [ ] **14. Qual o volume diário e de pico do fluxo escolhido, quantas fontes e tabelas ele envolve e quais etapas têm evidência de lentidão?**
  - Levantar tamanho histórico e crescimento. Verificar infraestrutura compartilhada, consultas, bloqueios, recursos, rede e conflitos com backup ou manutenção, sem presumir a causa pelo tamanho do banco.

- [ ] **15. O que o Prometheus monitora hoje e quais evidências permitem saber em que etapa um dado atrasou ou deixou de chegar?**
  - Procurar métricas de último sucesso, duração, idade dos dados e filas, além de logs e alertas. Identificar quem investiga as falhas e por quanto tempo essas evidências são mantidas.

- [ ] **16. Quando uma integração falha, como ela retoma o processamento sem perder ou duplicar dados?**
  - Verificar tentativas automáticas, ponto de retomada, reprocessamento e se a recuperação precisa esperar a próxima janela agendada.

## 6. Limites e viabilidade da melhoria

- [ ] **17. Quais acessos, documentos e ambientes de teste podem ser disponibilizados para medir o fluxo, e quem autoriza cada um?**
  - Priorizar evidências e acessos somente leitura compatíveis com as políticas internas. Identificar requisitos de proteção dos dados, credenciais, auditoria e segregação de ambientes.

- [ ] **18. Que partes podem mudar e quais restrições de negócio, contrato, disponibilidade ou projeto em andamento precisam ser respeitadas?**
  - Incluir processos críticos, limites aceitáveis de interrupção ou perda de dados, homologação e possibilidade de reversão. Identificar sistemas previstos para migração ou desativação.

- [ ] **19. Qual equipe sustentaria a melhoria e quais prazo, orçamento e ferramentas existentes devem orientar seu desenvolvimento?**
  - Verificar capacidade de operar integrações adicionais e oportunidades de reaproveitamento antes de propor novos componentes.

## 7. Fechamento e próximo passo

- [ ] **20. O que já foi tentado, qual gargalo a equipe suspeita que exista e qual fluxo podemos escolher para validar essa hipótese?**
  - Encerrar com um responsável, evidências pendentes e um critério de sucesso que inclua atraso, correção e completude dos dados.

---

## Atividade central — rastrear um registro

Escolher um registro identificável do relatório priorizado, com os acessos adequados e dados anonimizados quando necessário. Usar a mesma transação ou versão do registro em todas as etapas e conferir fusos e relógios.

**Relatório:** ____________________  
**Registro ou identificador:** ____________________  
**Tipo de ocorrência — criação, alteração ou cancelamento:** ____________________

| Marco | O que registrar | Data/hora | Evidência ou responsável |
|---|---|---|---|
| T0 | Fato ou alteração ocorre na operação. | | |
| T1 | Registro é confirmado no sistema de origem. | | |
| T2 | Registro fica disponível para extração. | | |
| T3 | Registro chega ao destino ou à área intermediária. | | |
| T4 | Dado fica correto e consultável na camada analítica. | | |
| T5 | Modelo ou cópia do BI é atualizado, se existir. | | |
| T6 | Usuário consegue consultar o dado no relatório. | | |

**Atraso de ponta a ponta: T6 − T0.** Separar espera de execução em cada trecho. Adaptar os marcos ao fluxo real; não somar etapas executadas em paralelo. Um registro ajuda a entender o caminho, mas são necessárias amostras de diferentes momentos para avaliar a frequência e a variação dos atrasos.

## Evidências prioritárias para levar da reunião

- Histórico e configuração dos jobs: horários, duração, dependências e falhas.
- Histórico e configuração das atualizações do BI.
- Diagrama do caminho efetivo do relatório, com sistemas e responsáveis.
- Horários e identificadores de um registro rastreado.
- Documentação das interfaces utilizadas e regras das planilhas envolvidas.
- Lista de pendências, responsáveis e acessos necessários para a próxima etapa.

## Modelo de anotação

| Pergunta | Resposta | Situação: comprovada, relatada ou hipótese | Evidência | Responsável / próximo passo |
|---|---|---|---|---|
| | | | | |

## Cuidados na interpretação das respostas

- Atualização diária pode contribuir para o atraso; é necessário medir também disponibilidade da origem e tempo das demais etapas.
- Compartilhar servidor pode gerar disputa por recursos, mas isso exige evidência de contenção.
- Webhooks só ajudam nos eventos cobertos e não eliminam esperas posteriores.
- Planilhas podem exigir automação, integração ou mudança de processo; sua existência não determina uma única solução.
- Monitoramento identifica sintomas e ajuda no diagnóstico; sua ausência não explica sozinha a causa do atraso.
- Processamento assíncrono pode ter baixa latência. Definir o prazo aceitável por processo é mais útil do que pedir tempo real para tudo.

## Origem e revisão do roteiro

Consolidado a partir de:

- [Perguntas do arquivo indicado](perguntas-reuniao.md).
- [Roteiro anterior de arquitetura e BI](perguntas-reuniao-arquitetura-bi.md).
- [Análise inicial da Nérus](analise-inicial-nerus.md).

A revisão preservou as perguntas úteis dos dois roteiros, reuniu repetições e retirou conclusões antecipadas sobre gargalos, custos e soluções. Limites específicos de produtos e licenças devem ser verificados após a identificação do ambiente real.
