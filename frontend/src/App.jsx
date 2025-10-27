import React, { useState, useEffect } from 'react';

const API_URL = '/api/v1/segments/em-risco';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        const response = await fetch(API_URL);
        
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.detail || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (e) {
        setError(e.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-md" role="alert">
          <p className="font-bold text-lg mb-2">Erro ao carregar dados</p>
          <p>{error}</p>
          <p className="mt-4 text-sm">
            <strong>Nota:</strong> Se o erro mencionar "analytics.mart_customer_rfm", 
            certifique-se de que o dbt foi executado (<code>dbt build</code>) para criar o Data Mart.
          </p>
        </div>
      );
    }

    if (data) {
      return (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 w-full md:w-1/3">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Clientes "Em Risco"</h2>
            <p className="text-5xl font-extrabold text-red-600 mt-2">{data.total_count}</p>
            <p className="text-gray-600 mt-2">Compraram 3+ vezes e não voltam há mais de 30 dias.</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <h3 className="text-xl font-semibold text-gray-800 p-6">Lista de Clientes ({data.total_count})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Cliente</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Contato</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Recência (Dias)</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Frequência (Pedidos)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.customers.map((customer, index) => (
                    <tr key={customer.email || customer.phone_number || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{customer.customer_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{customer.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{customer.phone_number || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-red-100 text-red-800">
                          {customer.recencia} dias
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center">{customer.frequencia}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900">NOLA Analytics</h1>
        <p className="text-lg text-gray-600 mt-2">Dashboard de Retenção de Clientes</p>
      </header>
      <main>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;

