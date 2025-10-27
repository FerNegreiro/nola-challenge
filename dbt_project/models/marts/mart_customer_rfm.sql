
{{ config(schema='analytics') }}

WITH sales AS (
    
    
    SELECT
        id AS sale_id,
        customer_id,
        created_at,
        total_amount
    FROM
        {{ source('public', 'sales') }} 
    WHERE
        sale_status_desc = 'COMPLETED'
        AND customer_id IS NOT NULL
),

customer_agg AS (
    
    SELECT
        customer_id,
        COUNT(sale_id) AS total_order_count,
        SUM(total_amount) AS total_lifetime_value,
        MAX(created_at) AS last_order_date,
        
        
        DATE_PART('day', NOW() - MAX(created_at)) AS days_since_last_order
    FROM
        sales
    GROUP BY
        customer_id
),

final AS (
    
    SELECT
        c.customer_name,
        c.phone_number,
        c.email,
        agg.total_order_count AS frequencia,
        agg.days_since_last_order AS recencia,
        agg.total_lifetime_value AS valor,

        
        CASE
            WHEN agg.total_order_count >= 3 AND agg.days_since_last_order > 30 AND agg.days_since_last_order <= 90 THEN 'Em Risco'
            WHEN agg.total_order_count >= 5 AND agg.days_since_last_order <= 30 THEN 'Leal'
            WHEN agg.total_order_count = 1 THEN 'Novo'
            WHEN agg.days_since_last_order > 90 THEN 'Perdido'
            ELSE 'Regular'
        END AS segmento_cliente
        
    FROM
        customer_agg agg
    LEFT JOIN
        {{ source('public', 'customers') }} c ON agg.customer_id = c.id 
)


SELECT * FROM final

