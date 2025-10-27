from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import asynccontextmanager
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://challenge:challenge_2024@postgres:5432/challenge_db")

db_conn = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db_conn
    try:
        db_conn = psycopg2.connect(DATABASE_URL)
        yield
    finally:
        if db_conn:
            db_conn.close()

app = FastAPI(lifespan=lifespan)

class CustomerRFM(BaseModel):
    customer_name: Optional[str]
    phone_number: Optional[str]
    email: Optional[str]
    frequencia: int
    recencia: int
    valor: float
    segmento_cliente: str

class CustomerSegmentResponse(BaseModel):
    total_count: int
    segment_name: str
    customers: List[CustomerRFM]

@app.get("/api/v1/segments/em-risco", response_model=CustomerSegmentResponse)
async def get_segmento_em_risco():
    segment_name = "Em Risco"
    
    if not db_conn:
        raise HTTPException(status_code=503, detail="Database connection not available")

    query = """
        SELECT customer_name, phone_number, email, frequencia, recencia, valor, segmento_cliente
        FROM analytics.mart_customer_rfm
        WHERE segmento_cliente = %s
        ORDER BY recencia DESC;
    """
    
    try:
        with db_conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (segment_name,))
            customers = cursor.fetchall()
        
        return CustomerSegmentResponse(
            total_count=len(customers),
            segment_name=segment_name,
            customers=customers
        )
    except psycopg2.errors.UndefinedTable:
        raise HTTPException(status_code=500, detail="O Data Mart 'analytics.mart_customer_rfm' ainda não foi criado. Rode o dbt primeiro.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")

@app.get("/")
def read_root():
    return {"status": "NOLA Analytics Backend está online"}