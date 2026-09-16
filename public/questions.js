export const sections = [
  {
    "id": 1,
    "title": "Problema, prioridade e caminho dos dados",
    "short": "O problema"
  },
  {
    "id": 2,
    "title": "Banco de dados e consumo pelo BI",
    "short": "Bancos e BI"
  },
  {
    "id": 3,
    "title": "Cargas, integrações e trabalho manual",
    "short": "Cargas e processos"
  },
  {
    "id": 4,
    "title": "Participação efetiva da Nérus e da TOTVS",
    "short": "Nérus e TOTVS"
  },
  {
    "id": 5,
    "title": "Desempenho, falhas e monitoramento",
    "short": "Desempenho"
  },
  {
    "id": 6,
    "title": "Limites e viabilidade da melhoria",
    "short": "Limites e viabilidade"
  },
  {
    "id": 7,
    "title": "Fechamento e próximo passo",
    "short": "Próximos passos"
  }
];

export const questions = [
  {
    "id": 1,
    "section": 1,
    "priority": true,
    "title": "Qual relatório ou processo mais sofre com o atraso, qual decisão depende dele e qual seria o prazo aceitável para o dado aparecer?",
    "hint": "Esclarecer se as 24 horas são uma estimativa ou uma medição, quais tipos de dados são afetados e se há variação por horário, loja ou canal."
  },
  {
    "id": 2,
    "section": 1,
    "priority": true,
    "title": "Podemos escolher um registro recente desse relatório e acompanhar seu caminho completo, com horários, desde a origem até o BI?",
    "hint": "Pode ser pedido, nota, movimentação ou outro registro relevante. Desenhar os sistemas e etapas envolvidos; usar a tabela de rastreamento ao final."
  },
  {
    "id": 3,
    "section": 1,
    "priority": true,
    "title": "Onde cada informação é gerada, qual sistema é sua fonte oficial e quem responde por cada etapa do fluxo?",
    "hint": "Quando Nérus, TOTVS, planilha e BI divergem, identificar quem valida o valor correto e qual definição de negócio deve prevalecer."
  },
  {
    "id": 4,
    "section": 2,
    "priority": true,
    "title": "De qual fonte o relatório realmente lê: banco operacional, réplica, Data Warehouse, API ou arquivo?",
    "hint": "Confirmar se existe DW, qual tecnologia é utilizada e se há uma área intermediária de importação ou Data Lake antes da camada consultada. Distinguir dado recebido de dado pronto para análise."
  },
  {
    "id": 5,
    "section": 2,
    "priority": true,
    "title": "Qual ferramenta de BI é utilizada e ela consulta a fonte diretamente, importa uma cópia dos dados ou combina os dois modos?",
    "hint": "Identificar também onde ficam os cálculos e as regras do relatório: banco, transformação ou modelo do BI."
  },
  {
    "id": 6,
    "section": 2,
    "priority": true,
    "title": "Quando o dado já está pronto na fonte consultada, quanto tempo leva para aparecer no BI e o que ocorre nesse intervalo?",
    "hint": "Conferir agenda e histórico de atualizações, duração, falhas, cache, gateway e eventuais limites da configuração ou licença utilizada."
  },
  {
    "id": 7,
    "section": 3,
    "priority": true,
    "title": "Quais rotinas transferem e transformam os dados, com quais ferramentas, horários e dependências?",
    "hint": "Pedir o histórico do agendador. Separar tempo aguardando início de tempo em execução e verificar se as etapas começam por horário, dependência ou evento."
  },
  {
    "id": 8,
    "section": 3,
    "priority": true,
    "title": "As cargas processam tudo ou apenas o que mudou? Como identificam alterações posteriores, exclusões, cancelamentos e devoluções?",
    "hint": "Verificar o significado do campo de data utilizado e como a equipe confere a completude e a correção do resultado, inclusive após mudanças em registros antigos."
  },
  {
    "id": 9,
    "section": 3,
    "priority": true,
    "title": "Alguma etapa depende de envio de planilha, conferência, aprovação ou fechamento? Qual é o tempo de espera nessa etapa?",
    "hint": "Identificar quem gera e recebe os arquivos, por que eles existem e quais regras contêm. Distinguir espera operacional de fechamento necessário ao indicador; verificar se uma visão provisória seria útil."
  },
  {
    "id": 10,
    "section": 4,
    "priority": true,
    "title": "A Nérus e a TOTVS participam do caminho desse relatório? Qual é o papel de cada uma e existe troca de dados entre elas?",
    "hint": "Identificar direção, mecanismo e frequência das conexões. Se algum sistema estiver fora do fluxo, registrar isso explicitamente."
  },
  {
    "id": 11,
    "section": 4,
    "priority": false,
    "title": "Quais produtos, versões e módulos da Nérus e da TOTVS estão instalados, e quem mantém suas customizações e integrações?",
    "hint": "Confirmar se a documentação pública da NerusAPI corresponde à instalação utilizada e quais endpoints o consumidor realmente chama."
  },
  {
    "id": 12,
    "section": 4,
    "priority": false,
    "title": "Quais interfaces estão disponíveis e são suportadas para obter os dados necessários, e quais limites ou restrições possuem?",
    "hint": "Considerar APIs, conectores, arquivos, leitura de banco ou captura de alterações. Verificar cobertura dos dados, paginação, lotes, autenticação, limites de chamadas e condições de suporte."
  },
  {
    "id": 13,
    "section": 4,
    "priority": false,
    "title": "Já existem webhooks, filas, eventos ou integrações de baixa latência que possam ser aproveitados nesse fluxo?",
    "hint": "Identificar eventos cobertos, consumidores, atraso observado e mecanismos de recuperação. Se existirem caches de pendências, esclarecer se a confirmação de um consumidor afeta os demais."
  },
  {
    "id": 14,
    "section": 5,
    "priority": false,
    "title": "Qual o volume diário e de pico do fluxo escolhido, quantas fontes e tabelas ele envolve e quais etapas têm evidência de lentidão?",
    "hint": "Levantar tamanho histórico e crescimento. Verificar infraestrutura compartilhada, consultas, bloqueios, recursos, rede e conflitos com backup ou manutenção, sem presumir a causa pelo tamanho do banco."
  },
  {
    "id": 15,
    "section": 5,
    "priority": false,
    "title": "O que o Prometheus monitora hoje e quais evidências permitem saber em que etapa um dado atrasou ou deixou de chegar?",
    "hint": "Procurar métricas de último sucesso, duração, idade dos dados e filas, além de logs e alertas. Identificar quem investiga as falhas e por quanto tempo essas evidências são mantidas."
  },
  {
    "id": 16,
    "section": 5,
    "priority": false,
    "title": "Quando uma integração falha, como ela retoma o processamento sem perder ou duplicar dados?",
    "hint": "Verificar tentativas automáticas, ponto de retomada, reprocessamento e se a recuperação precisa esperar a próxima janela agendada."
  },
  {
    "id": 17,
    "section": 6,
    "priority": false,
    "title": "Quais acessos, documentos e ambientes de teste podem ser disponibilizados para medir o fluxo, e quem autoriza cada um?",
    "hint": "Priorizar evidências e acessos somente leitura compatíveis com as políticas internas. Identificar requisitos de proteção dos dados, credenciais, auditoria e segregação de ambientes."
  },
  {
    "id": 18,
    "section": 6,
    "priority": false,
    "title": "Que partes podem mudar e quais restrições de negócio, contrato, disponibilidade ou projeto em andamento precisam ser respeitadas?",
    "hint": "Incluir processos críticos, limites aceitáveis de interrupção ou perda de dados, homologação e possibilidade de reversão. Identificar sistemas previstos para migração ou desativação."
  },
  {
    "id": 19,
    "section": 6,
    "priority": false,
    "title": "Qual equipe sustentaria a melhoria e quais prazo, orçamento e ferramentas existentes devem orientar seu desenvolvimento?",
    "hint": "Verificar capacidade de operar integrações adicionais e oportunidades de reaproveitamento antes de propor novos componentes."
  },
  {
    "id": 20,
    "section": 7,
    "priority": false,
    "title": "O que já foi tentado, qual gargalo a equipe suspeita que exista e qual fluxo podemos escolher para validar essa hipótese?",
    "hint": "Encerrar com um responsável, evidências pendentes e um critério de sucesso que inclua atraso, correção e completude dos dados."
  }
];
