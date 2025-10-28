{{ config(
    materialized='table',
    schema='analytics'
) }}

WITH sales AS (
    SELECT * FROM {{ source('public', 'sales') }}
    WHERE sale_status_desc = 'COMPLETED'
),
product_sales AS (
    SELECT * FROM {{ source('public', 'product_sales') }}
),
products AS (
    SELECT id, name AS product_name FROM {{ source('public', 'products') }}
),
channels AS (
    SELECT id, name AS channel_name FROM {{ source('public', 'channels') }}
),
delivery_addresses AS (
    SELECT sale_id, neighborhood AS region FROM {{ source('public', 'delivery_addresses') }}
)

SELECT
    s.id AS sale_id,
    s.created_at,
    
    EXTRACT(HOUR FROM s.created_at) AS hour_of_day,
    EXTRACT(DOW FROM s.created_at) AS day_of_week,
    
    p.product_name,
    c.channel_name,
    COALESCE(da.region, 'N/A') AS region,
    
    s.total_amount,
    s.delivery_seconds,
    ps.quantity,
    ps.total_price AS product_total_price

FROM sales s
LEFT JOIN product_sales ps ON s.id = ps.sale_id
LEFT JOIN products p ON ps.product_id = p.id
LEFT JOIN channels c ON s.channel_id = c.id
LEFT JOIN delivery_addresses da ON s.id = da.sale_id