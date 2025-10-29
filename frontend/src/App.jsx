import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const API_URL = 'http://127.0.0.1:8000';

function App() {
  const [kpiData, setKpiData] = useState({ total_amount: 0, total_orders: 0 });
  const [rfmClients, setRfmClients] = useState([]);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [chartTitle, setChartTitle] = useState('Análise Customizada');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [metric, setMetric] = useState('total_amount');
  const [dimension, setDimension] = useState('product_name');
  const [channel, setChannel] = useState('Todos');

  const metricMap = {
    'total_amount': 'Vendas Totais',
    'total_orders': 'Total de Pedidos'
  };

  const dimensionMap = {
    'product_name': 'Produto',
    'channel_name': 'Canal',
    'store_name': 'Loja',
    'neighborhood': 'Região'
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const kpiResponse = await fetch(`${API_URL}/api/v1/kpis/rfm_count`);
      if (!kpiResponse.ok) throw new Error('Falha ao buscar KPIs');
      const kpiResult = await kpiResponse.json();
      setKpiData(kpiResult);

      const clientsResponse = await fetch(`${API_URL}/api/v1/clients/rfm_list`);
      if (!clientsResponse.ok) throw new Error('Falha ao buscar lista de clientes');
      const clientsResult = await clientsResponse.json();
      setRfmClients(clientsResult);

      await handleAnalysis();

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalysis = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        metric: metric,
        dimension: dimension,
        channel: channel
      });
      
      const response = await fetch(`${API_URL}/api/v1/custom_query/?${params}`);
      if (!response.ok) throw new Error('Falha ao buscar dados da análise');
      const data = await response.json();

      setChartTitle(`${metricMap[metric]} por ${dimensionMap[dimension]}${channel !== 'Todos' ? ` (Canal: ${channel})` : ''}`);
      setChartData({
        labels: data.map(d => d.dimension),
        datasets: [
          {
            label: metricMap[metric],
            data: data.map(d => d.metric),
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
            borderColor: 'rgba(99, 102, 241, 1)',
            borderWidth: 1,
            borderRadius: 8,
          },
        ],
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#000',
        titleFont: { size: 16 },
        bodyFont: { size: 14 },
        cornerRadius: 4,
        displayColors: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: '#e5e7eb',
        },
        ticks: {
          color: '#6b7280',
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6b7280',
        }
      },
    },
  };


  return (
    <div className="min-h-screen bg-gray-100 font-inter">
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">NOLA Analytics</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">Olá, Maria</span>
              <select className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                <option>Últimos 6 meses</option>
                <option>Últimos 30 dias</option>
                <option>Este mês</option>
              </select>
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h3 className="text-gray-500 font-medium">Vendas Totais</h3>
            <p className="text-4xl font-bold text-gray-900 mt-2">
              {kpiData.total_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <h3 className="text-gray-500 font-medium">Pedidos</h3>
            <p className="text-4xl font-bold text-gray-900 mt-2">
              {kpiData.total_orders.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-red-200">
            <h3 className="text-red-600 font-medium">Clientes em Risco</h3>
            <p className="text-4xl font-bold text-red-600 mt-2">
              {kpiData.rfm_count || 0}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Análise Customizada</h2>
          <p className="text-gray-600 mb-4">Responda às suas perguntas. Comece selecionando uma métrica e uma dimensão para explorar.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              {/* Etiqueta removida para um design mais limpo */}
              <select
                id="metric"
                name="metric"
                aria-label="Seleção de Métrica"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
              >
                <option value="total_amount">Vendas Totais</option>
                <option value="total_orders">Total de Pedidos</option>
              </select>
            </div>
            
            <div>
              {/* Etiqueta removida para um design mais limpo */}
              <select
                id="dimension"
                name="dimension"
                aria-label="Seleção de Dimensão"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                value={dimension}
                onChange={(e) => setDimension(e.target.value)}
              >
                <option value="product_name">Produto</option>
                <option value="channel_name">Canal</option>
                <option value="store_name">Loja</option>
                <option value="neighborhood">Região</option>
              </select>
            </div>

            <div>
              {/* Etiqueta removida para um design mais limpo */}
              <select
                id="channel"
                name="channel"
                aria-label="Seleção de Canal"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                <option value="Todos">Todos</option>
                <option value="iFood">iFood</option>
                <option value="Rappi">Rappi</option>
                <option value="Presencial">Presencial</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="App Próprio">App Próprio</option>
                <option value="Uber Eats">Uber Eats</option>
              </select>
            </div>

            <button
              onClick={handleAnalysis}
              disabled={isLoading}
              className="w-full text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 transition duration-150 ease-in-out disabled:bg-indigo-300"
            >
              {isLoading ? 'Analisando...' : 'Analisar'}
            </button>
          </div>
        </div>

        {error && <div className="text-red-500 text-center mb-4">Erro: {error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 min-h-[400px]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{chartTitle}</h3>
            <div className="relative h-80">
              {isLoading ? <p>Carregando gráfico...</p> : <Bar options={chartOptions} data={chartData} />}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 min-h-[400px]">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Clientes em Risco ({rfmClients.length})</h3>
            <div className="overflow-y-auto h-80">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Última Compra (Dias)</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequência</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rfmClients.map((client) => (
                    <tr key={client.customer_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.customer_name || 'Cliente Anónimo'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{client.dias_desde_ultima_compra}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{client.frequencia}</td>
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

export default App;

