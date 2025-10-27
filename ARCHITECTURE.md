Documentação de Decisões Arquiteturais

Projeto: NOLA Analytics (God Level Challenge)

1. O Problema Central: OLTP vs. OLAP

O database-schema.sql fornecido é um banco de dados transacional (OLTP) de 3ª Forma Normal. Ele é otimizado para ESCRITAS rápidas (registrar uma venda, um item, um pagamento).

As perguntas da Maria (PROBLEMA.md) são analíticas (OLAP). Elas exigem LEITURAS complexas e agregações em múltiplas tabelas (sales, product_sales, item_product_sales, delivery_addresses, channels).

Decisão Arquitetural Primária:
Nós NÃO iremos rodar as queries analíticas do frontend diretamente no banco OLTP.

Viola o requisito de Performance: Queries com JOINs em 5 tabelas e agregações em 500k+ linhas serão lentas (> 2s).

Risco Operacional: Queries analíticas pesadas podem causar locks e degradar a performance da operação do restaurante (o próprio ato de vender).

Solução: Implementaremos um Data Warehouse (DW). Para este desafio, usaremos um schema analytics dentro do mesmo PostgreSQL. Este schema conterá Data Marts (tabelas "achatadas" e pré-agregadas), otimizadas para leitura instantânea.

2. A Stack de 3 Camadas

Para executar essa estratégia, escolho uma arquitetura de 3 camadas:

Camada 1: Transformação (O "ETL" / Data Mart)

Tecnologia: dbt (Data Build Tool)

Por quê? É a ferramenta padrão do mercado para o "T" em ELT (Extract, Load, Transform). O dbt nos permite construir nossos Data Marts usando apenas SQL, de forma testável, documentada e idempotente. Ele é o "cozinheiro" que prepara os dados antes de servi-los.

Alternativa Recusada: Scripts Python puros. Seriam mais difíceis de manter, testar e documentar do que o dbt, que é feito para isso.

Camada 2: Backend API (O "Garçom")

Tecnologia: Python (FastAPI)

Por quê?

Performance: É um dos frameworks mais rápidos disponíveis, ideal para I/O (servir dados).

Ecossistema de Dados: Sendo Python, ele se integra nativamente com dbt (o dbt-core pode ser chamado via Python) e outras libs de dados (pandas, polars) se necessário.

Facilidade: A validação de dados com Pydantic é simples e robusta.

Alternativa Recusada: Node.js (Express/Nest). Seria rápido, mas a integração com o dbt e o ecossistema de dados é menos natural que no Python.

Camada 3: Frontend (O "Salão" da Maria)

Tecnologia: React (com TypeScript)

Por quê?

Ecossistema: Para construir uma UI de "pivot table" e dashboards "drag-and-drop", precisamos de bibliotecas maduras. Usaremos Recharts (gráficos) e react-grid-layout (dashboards).

UX Interativa: É a especialidade do React.

Tipagem: TypeScript é essencial para um projeto de dados, garantindo que os contratos entre o backend (FastAPI) e o frontend sejam mantidos.

Alternativa Recusada: Vue.js. Tão capaz quanto React, mas o ecossistema de bibliotecas de BI/dashboard é ligeiramente menor. A escolha aqui é por preferência de ecossistema.

3. Como a Arquitetura Resolve as Dores da Maria

O dbt (Camada 1) irá criar os Data Marts específicos para as perguntas da Maria. O FastAPI (Camada 2) irá apenas ler deles.

Pergunta da Maria (A Dor)

Data Mart (Modelo dbt no schema analytics)

Query do Backend (Rápida)

"Qual produto vende mais na quinta à noite no iFood?"

mart_product_performance_hourly (Tabela pré-agregada por product_id, channel_id, dia_semana, hora)

SELECT * FROM analytics.mart_product_performance_hourly WHERE dia_semana = 4 AND hora BETWEEN 19 AND 23 AND channel_name = 'iFood' ORDER BY total_vendido DESC

"Meu tempo de entrega piorou. Em quais regiões?"

mart_delivery_performance_daily (Tabela pré-agregada por bairro, cidade, data)

SELECT bairro, AVG(avg_delivery_minutes) FROM analytics.mart_delivery_performance_daily GROUP BY 1 ORDER BY 2 DESC

"Quais clientes compraram 3+ vezes mas não voltam há 30 dias?"

mart_customer_rfm (Tabela com Recência, Frequência, Valor por customer_id)

SELECT * FROM analytics.mart_customer_rfm WHERE frequencia >= 3 AND dias_desde_ultima_compra > 30

Conclusão: Esta arquitetura move a complexidade (os JOINs e GROUP BYs pesados) da "hora da consulta" (runtime) para a "hora da transformação" (batch, via dbt).

Quando Maria filtra o dashboard, ela não está consultando o banco OLTP. Ela está consultando um Data Mart leve e pré-processado. Isso garante a performance < 1s.