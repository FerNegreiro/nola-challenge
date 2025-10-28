import React, { useState, useEffect, useRef } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

const API_URL = "http://localhost:8000";

const kpiData = {
  vendasTotais: 17109.00,
  pedidos: 854,
};

function App() {
  const [riskyCustomers, setRiskyCustomers] = useState([]);
  const [riskyCustomersCount, setRiskyCustomersCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [metric, setMetric] = useState("Vendas Totais");
  const [dimension, setDimension] = useState("Canal");
  const [channel, setChannel] = useState("Todos");
  
  const [chartData, setChartData] = useState(null);
  const [chartTitle, setChartTitle] = useState("");
  const chartRef = useRef(null);

  const dimensionsOptions = {
    "Vendas Totais": ["Canal", "Região", "Produto", "Hora do Dia"],
    "Total de Pedidos": ["Canal", "Região", "Produto", "Hora do Dia"],
    "Tempo Médio de Entrega": ["Canal", "Região", "Hora do Dia"],
  };

  useEffect(() => {
    const fetchRiskyCustomers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/v1/rfm/risky-customers`);
        if (!response.ok) {
          throw new Error('Falha ao buscar dados da API');
        }
        const data = await response.json();
        setRiskyCustomers(data);
        setRiskyCustomersCount(data.length);
      } catch (err) {
        setError(err.message);
        setRiskyCustomersCount(88);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRiskyCustomers();
    handleAnalyze();
  }, []);

  useEffect(() => {
    if (!dimensionsOptions[metric].includes(dimension)) {
      setDimension(dimensionsOptions[metric][0]);
    }
  }, [metric]);


  const handleAnalyze = async () => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    
    setIsLoading(true);
    setError(null);
    setChartTitle(`Analisando: ${metric} por ${dimension}...`);

    try {
      const params = new URLSearchParams({
        metric: metric,
        dimension: dimension,
        channel: channel,
      });
      
      const response = await fetch(`${API_URL}/api/v1/custom_query/?${params.toString()}`);
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Falha ao buscar dados da query customizada');
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        setChartData(null);
        setChartTitle(`Sem dados para: ${metric} por ${dimension}`);
        return;
      }

      const newChartData = {
        labels: data.map(d => d.dimension),
        datasets: [
          {
            label: metric,
            data: data.map(d => d.metric),
            backgroundColor: 'rgba(79, 70, 229, 0.8)',
            borderColor: 'rgba(79, 70, 229, 1)',
            borderWidth: 1,
            fill: false,
          },
        ],
      };
      
      setChartData(newChartData);
      setChartTitle(`${metric} por ${dimension}${channel !== 'Todos' ? ` (Canal: ${channel})` : ''}`);

    } catch (err) {
      setError(err.message);
      setChartData(null);
      setChartTitle(`Erro ao buscar dados`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getChartType = () => {
    return dimension === 'Hora do Dia' ? Line : Bar;
  };
  
  const ChartComponent = getChartType();

  return (
    <div className="min-h-screen bg-gray-100 font-inter">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">NOLA Analytics</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Olá, Maria</span>
            <select className="border-none text-sm text-gray-600 font-medium focus:ring-0">
              <option>Últimos 30 dias</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <KpiCard title="Vendas Totais" value={`R$ ${kpiData.vendasTotais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
          <KpiCard title="Pedidos" value={kpiData.pedidos} />
          <KpiCard title="Clientes em Risco" value={isLoading ? '...' : riskyCustomersCount} isAlert />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Análise Customizada</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <SelectMenu label="Métrica" value={metric} onChange={e => setMetric(e.target.value)} options={Object.keys(dimensionsOptions)} />
            <SelectMenu label="Dimensão" value={dimension} onChange={e => setDimension(e.target.value)} options={dimensionsOptions[metric]} />
            <SelectMenu label="Canal" value={channel} onChange={e => setChannel(e.target.value)} options={["Todos", "iFood", "Rappi", "Presencial", "App Próprio", "WhatsApp", "Uber Eats"]} />
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 disabled:bg-gray-400"
            >
              {isLoading ? 'Analisando...' : 'Analisar'}
            </button>
          </div>
        </div>
        
        {error && <div className="text-red-600 bg-red-100 p-4 rounded-lg mb-8">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">{chartTitle}</h3>
            <div className="h-96">
              {chartData && <ChartComponent ref={chartRef} data={chartData} options={chartOptions} />}
              {!chartData && !isLoading && <div className="flex items-center justify-center h-full text-gray-500">Sem dados para exibir.</div>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Clientes em Risco (RFM)</h3>
            <div className="overflow-y-auto h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dias S/ Compra</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pedidos</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading && <tr><td colSpan="3" className="p-4 text-center text-gray-500">Carregando...</td></tr>}
                  {!isLoading && riskyCustomers.map((customer, index) => (
                    <tr key={customer.customer_id || index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{customer.customer_name || `ID: ${customer.customer_id}`}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 text-center">{customer.days_since_last_order}</td>
                      <td className="px-4 py-3 whitespace-n
owrap text-sm text-gray-700 text-center">{customer.frequency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const KpiCard = ({ title, value, isAlert = false }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
    <p className={`mt-1 text-3xl font-semibold ${isAlert ? 'text-red-600' : 'text-gray-900'}`}>
      {value}
    </p>
  </div>
);

const SelectMenu = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
    >
      {options.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  </div>
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        color: '#6b7280',
      },
      grid: {
        color: '#e5e7eb',
      }
    },
    x: {
      ticks: {
        color: '#6b7280',
      },
      grid: {
        display: false,
      }
    }
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: '#1f2937',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
    }
  },
};

export default App;

