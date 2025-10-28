import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="NOLA Analytics API",
    description="API para servir dados pré-agregados do DWH (dbt) para o frontend."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://challenge:challenge_2024@postgres:5432/challenge_db")

def get_db_connection():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Erro ao conectar ao banco de dados: {e}")
        raise HTTPException(status_code=500, detail="Não foi possível conectar ao banco de dados.")

class CustomerRFM(BaseModel):
    customer_id: int
    customer_name: Optional[str]
    days_since_last_order: int
    frequency: int
    total_value: float
    segment: str

class CustomQueryResponse(BaseModel):
    dimension: str
    metric: float

@app.get("/api/v1/rfm/risky-customers", response_model=List[CustomerRFM])
def get_risky_customers():
    query = """
    SELECT 
        customer_id, 
        customer_name, 
        days_since_last_order, 
        frequency, 
        total_value,
        segment
    FROM analytics.mart_customer_rfm
    WHERE segment = 'Em Risco'
    LIMIT 100;
    """
    
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query)
            results = cursor.fetchall()
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao consultar o Data Mart: {e}")
    finally:
        conn.close()

@app.get("/api/v1/custom_query/", response_model=List[CustomQueryResponse])
def get_custom_query(metric: str, dimension: str, channel: Optional[str] = None):
    
    metric_mapping = {
        "Vendas Totais": "SUM(total_amount)",
        "Total de Pedidos": "COUNT(DISTINCT sale_id)",
        "Tempo Médio de Entrega": "AVG(delivery_seconds / 60.0)"
    }
    
    dimension_mapping = {
        "Produto": "product_name",
        "Canal": "channel_name",
        "Região": "region",
        "Hora do Dia": "hour_of_day"
    }

    if metric not in metric_mapping or dimension not in dimension_mapping:
        raise HTTPException(status_code=400, detail="Métrica ou dimensão inválida.")

    metric_sql = metric_mapping[metric]
    dimension_sql = dimension_mapping[dimension]

    base_query = f"""
    SELECT 
        {dimension_sql} AS dimension,
        {metric_sql} AS metric
    FROM analytics.mart_sales_performance
    WHERE {dimension_sql} IS NOT NULL
    """
    
    params = []
    
    if channel and channel != 'Todos':
        base_query += " AND channel_name = %s"
        params.append(channel)

    if metric == "Tempo Médio de Entrega":
         base_query += " AND delivery_seconds IS NOT NULL"

    base_query += f" GROUP BY {dimension_sql} ORDER BY metric DESC LIMIT 20;"

    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(base_query, tuple(params))
            results = cursor.fetchall()
            
            if dimension == "Hora do Dia":
                results = sorted(results, key=lambda x: int(x['dimension']))
                
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao consultar o Data Mart: {e}")
    finally:
        conn.close()

