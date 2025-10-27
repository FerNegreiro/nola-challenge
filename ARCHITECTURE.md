🚀 Decisões de Arquitetura: NOLA Analytics

Este documento descreve a arquitetura escolhida para a plataforma de analytics "NOLA", resolvendo o desafio de fornecer uma ferramenta "Power BI para Restaurantes".

1. O Problema Central: OLTP vs. OLAP

O banco de dados de um restaurante (o schema PostgreSQL fornecido) é um sistema OLTP (Online Transaction Processing). Ele é otimizado para escritas rápidas: registrar um pedido, cadastrar um cliente, fechar uma conta.

As perguntas da Maria são OLAP (Online Analytical Processing). Elas são otimizadas para leituras complexas: agregar milhões de linhas, comparar períodos, calcular médias.

Decisão Principal: Nunca rodaremos queries OLAP diretamente no banco OLTP. Isso causaria lentidão na operação do restaurante e as análises seriam lentas.

Nossa Solução: Vamos criar um Data Warehouse (DW) simples. Para este desafio, será um schema separado (analytics) dentro do mesmo PostgreSQL, contendo tabelas pré-agregadas.

2. A Stack Escolhida (A Trindade de Dados)

Escolhemos uma stack moderna, flexível e de alta performance, dividida em 3 camadas:

Camada 1: Data Transformation (O Cozinheiro)

Tecnologia: dbt (Data Build Tool)

Por quê? O dbt é a melhor ferramenta do mercado para transformar dados "crus" (OLTP) em "marts" analíticos limpos (OLAP) usando apenas SQL.

O que ele faz: Ele irá rodar de tempos em tempos (ex: a cada 30 minutos) e atualizar nossas tabelas analíticas. Ele será responsável por criar o mart_customer_rfm (Recency, Frequency, Monetary) e o mart_hourly_sales, que respondem diretamente às perguntas da Maria.

Camada 2: Backend API (O Garçom)

Tecnologia: Python (FastAPI)

Por quê? É incrivelmente rápido, leve e perfeito para servir dados. O frontend irá pedir: "Me dê os dados do gráfico de vendas por hora", e o FastAPI irá buscar esses dados já prontos no nosso Data Warehouse.

O que ele faz: Expõe endpoints como /api/v1/query. Ele recebe um JSON do frontend (ex: { "metric": "total_sales", "dimension": "product_name", ... }) e constrói uma query SQL simples e segura contra os marts do dbt.

Camada 3: Frontend (O Salão do Restaurante)

Tecnologia: React (com TypeScript)

Por quê? É a biblioteca líder para criar interfaces de usuário ricas e interativas.

O que ele faz: Esta é a interface "No-Code" onde a Maria realmente trabalha.

Gráficos: Usaremos Chart.js ou Recharts para visualizações.

Dashboard: Usaremos react-grid-layout para permitir que ela arraste, solte e redimensione widgets.

Estado: Usaremos Zustand ou React Context para gerenciar o estado global (como filtros de data).

3. Resolvendo as Perguntas da Maria (Na Prática)

| Pergunta da Maria | Solução com a Arquitetura NOLA |
| "Qual produto vende mais na quinta à noite no iFood?" | dbt cria o mart mart_hourly_product_sales. O React permite que Maria filtre por dia=Quinta, canal=iFood e hora=19-23h. O FastAPI serve os dados deste mart. A query é instantânea. |
| "Meu tempo de entrega piorou. Em quais regiões?" | dbt cria o mart mart_daily_delivery_performance. O React mostra um gráfico de linha com avg_delivery_time por region, com comparação de períodos. A query é instantânea. |
| "Quais clientes compraram 3+ vezes mas não voltam há 30 dias?" | dbt cria o mart mart_customer_rfm. O React tem um card "Clientes em Risco" que é apenas um SELECT COUNT(*) deste mart. Clicar nele mostra a lista de clientes. A query é instantânea. |

4. Próximos Passos (MVP)

Para entregar uma solução funcional rapidamente, vamos construir um protótipo de alta fidelidade em um único arquivo index.html.

Este protótipo irá simular essa arquitetura completa:

O JavaScript irá gerar dados mockados (simulando o banco OLTP).

Funções JavaScript irão processar esses dados (simulando o dbt e o FastAPI).

O HTML/Tailwind e Chart.js irão renderizar a interface (simulando o React).

Isso nos permite validar a UX e a lógica de negócios de forma extremamente rápida.