💻 Roteiro - Vídeo Demo NOLA Analytics (5-7 Minutos)

Objetivo: Apresentar a solução, justificar as decisões de arquitetura e mostrar como ela resolve as 3 dores da Maria.
Audiência: Time técnico da Nola (AVALIACAO.md).
Tom: Profissional, direto e focado em engenharia e solução de produto.

(0:00 - 0:45) Abertura: O Problema e a Dor

(Cena: Eu na câmera, com a tela mostrando o PROBLEMA.md)

"Olá, time Nola. Meu nome é [Seu Nome] e esta é a minha solução para o God Level Challenge.

O problema da Maria é um clássico de BI: ela tem um volume massivo de dados transacionais, mas não consegue extrair insights acionáveis.

As perguntas dela - 'Qual produto vende mais na quinta à noite no iFood?', 'Meu tempo de entrega piorou, onde?' e 'Quais clientes não voltam há 30 dias?' - exigem queries analíticas pesadas.

O AVALIACAO.md é claro: performance é chave. Rodar JOINs complexos em 500k de linhas no banco de produção é inviável e arriscado. A minha solução ataca esse problema de frente."

(0:45 - 2:00) A Solução: A Arquitetura de 3 Camadas

(Cena: Mostrando o ARCHITECTURE.md)

"Para garantir performance, projetei uma arquitetura de 3 camadas que separa a carga de trabalho transacional (OLTP) da analítica (OLAP).

(Aponta para a Camada 1 no doc)
1. A Camada de Transformação (o 'Cozinheiro'): Eu uso o dbt para transformar os dados brutos. Ele roda offline, lendo do banco de produção (public) e criando Data Marts pré-agregados em um novo schema, o analytics.

(Mostra o código do mart_customer_rfm.sql no VS Code)
Por exemplo, este modelo SQL do dbt já calcula a Recência, Frequência e Valor para cada cliente e cria segmentos como 'Em Risco'. Todo o processamento pesado acontece aqui, uma vez por hora (ou noite), e não quando a Maria clica no botão.

(Aponta para a Camada 2 no doc)
2. A Camada de API (o 'Garçom'): Eu uso FastAPI (Python) pela sua performance. O papel dela é simples: servir esses Data Marts já prontos.

(Mostra o código do backend/main.py)
Este endpoint /api/v1/customers/rfm-segments não faz JOINs. Ele faz um SELECT simples e direto do mart_customer_rfm que o dbt criou. Isso garante uma resposta em milissegundos.

(Aponta para a Camada 3 no doc)
3. A Camada de Frontend (o 'Salão'): Eu uso React com TypeScript para a interface da Maria. Ele consome a API do FastAPI."

(2:00 - 4:30) A Demo: Resolvendo as Dores da Maria

(Cena: Mostrando o App React rodando no localhost:3000)

"Vamos ver a solução funcionando. Este é o dashboard da Maria.

(Aponta para o KPI 'Clientes em Risco')
"Aqui, de cara, respondemos a Pergunta 3: 'Quais clientes estão em risco?'. Este card mostra [Número] clientes. Esse número não é falso, ele vem diretamente da nossa API FastAPI, que leu o mart do dbt.

(Scrolla para a tabela 'Clientes em Risco')
"E aqui está a lista detalhada. A Maria pode ver o nome, o contato, e que o 'Cliente X' não compra há 42 dias. Ela pode exportar isso e criar uma campanha de reativação no WhatsApp agora. A query para carregar isso levou menos de 100ms.

(Aponta para o gráfico de barras 'Vendas por Produto e Canal')
"Para a Pergunta 1 ('Produto mais vendido...'), a solução é a flexibilidade de uma 'pivot table'. Eu simulei o componente aqui. A Maria selecionaria a métrica 'Total Vendido', a dimensão 'Produto' e 'Canal', e filtraria por 'Quinta-feira' e '19h-23h'. O frontend montaria essa query, o backend a executaria contra o mart_product_performance_hourly. Rápido e intuitivo.

(Aponta para o gráfico placeholder 'Tempo de Entrega')
"O mesmo vale para a Pergunta 2 ('Tempo de entrega por região'). Seria um gráfico de mapa ou barras lendo do mart_delivery_performance_daily. A arquitetura é a mesma: o dbt calcula o tempo médio por bairro offline, e o frontend apenas exibe."

(4:30 - 5:00) Conclusão e Próximos Passos

(Cena: Voltando para a câmera)

"Em resumo, esta arquitetura resolve os requisitos do desafio:

Resolve o Problema: A Maria tem respostas acionáveis.

Performance: As queries são < 1s, pois são SELECTs em tabelas pré-agregadas.

UX: A interface é limpa e focada nas respostas, escondendo a complexidade.

Escala: O dbt escala para milhões de linhas, e o backend/frontend não sentirão a diferença.

Os próximos passos seriam implementar os Data Marts restantes (produtos e entrega) e construir a UI de 'pivot table' completa no React.

Obrigado pelo seu tempo."