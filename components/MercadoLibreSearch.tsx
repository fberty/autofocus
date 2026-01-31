'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { mercadolibre, MLSearchResult } from '@/lib/mercadolibre';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Search, ExternalLink, Plus, Loader2, ArrowUpDown } from 'lucide-react';

type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'km_asc' | 'km_desc';

interface MercadoLibreSearchProps {
  onSelectItem: (item: MLSearchResult) => void;
  onClose: () => void;
}

export default function MercadoLibreSearch({ onSelectItem, onClose }: MercadoLibreSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MLSearchResult[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [loading, setLoading] = useState(false);
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sortedResults = useMemo(() => {
    if (sortBy === 'relevance') return results;
    
    const sorted = [...results];
    
    switch (sortBy) {
      case 'price_asc':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price_desc':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'km_asc':
        return sorted.sort((a, b) => {
          const aKm = a.attributes?.find(attr => attr.id === 'KILOMETERS');
          const bKm = b.attributes?.find(attr => attr.id === 'KILOMETERS');
          const aVal = aKm && aKm.value_name ? parseInt(aKm.value_name.replace(/\D/g, '')) : 999999999;
          const bVal = bKm && bKm.value_name ? parseInt(bKm.value_name.replace(/\D/g, '')) : 999999999;
          return aVal - bVal;
        });
      case 'km_desc':
        return sorted.sort((a, b) => {
          const aKm = a.attributes?.find(attr => attr.id === 'KILOMETERS');
          const bKm = b.attributes?.find(attr => attr.id === 'KILOMETERS');
          const aVal = aKm && aKm.value_name ? parseInt(aKm.value_name.replace(/\D/g, '')) : 0;
          const bVal = bKm && bKm.value_name ? parseInt(bKm.value_name.replace(/\D/g, '')) : 0;
          return bVal - aVal;
        });
      default:
        return sorted;
    }
  }, [results, sortBy]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const searchResults = await mercadolibre.searchVehicles(query);
      setResults(searchResults);
    } catch (err) {
      setError('Error al buscar en MercadoLibre. Intenta nuevamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (item: MLSearchResult) => {
    setLoadingItem(item.id);
    // Data is already complete from search - just pass it directly
    onSelectItem(item);
    setLoadingItem(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col transition-colors">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Buscar en MercadoLibre
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ej: Toyota Corolla 2020, Ford Focus usado..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Buscando...
                </>
              ) : (
                'Buscar'
              )}
            </button>
          </form>

          {error && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {results.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Busca vehículos en MercadoLibre</p>
              <p className="text-sm mt-1">Los resultados aparecerán aquí</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {results.length} resultados encontrados
              </p>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="relevance">Más relevantes</option>
                  <option value="price_asc">Precio: menor a mayor</option>
                  <option value="price_desc">Precio: mayor a menor</option>
                  <option value="km_asc">Kilometraje: menor a mayor</option>
                  <option value="km_desc">Kilometraje: mayor a menor</option>
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedResults.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex gap-3">
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-24 h-24 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {item.price > 0 ? (
                        formatCurrency(item.price, item.currency_id)
                      ) : (
                        <span className="text-gray-400 text-sm">Consultar precio</span>
                      )}
                    </p>
                    
                    <div className="space-y-1 mb-2">
                      {(() => {
                        const yearAttr = item.attributes?.find(a => a.id === 'VEHICLE_YEAR');
                        const kmAttr = item.attributes?.find(a => a.id === 'KILOMETERS');
                        return (
                          <>
                            {yearAttr && yearAttr.value_name && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                📅 {yearAttr.value_name}
                              </p>
                            )}
                            {kmAttr && kmAttr.value_name && parseInt(kmAttr.value_name) > 0 && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                📊 {formatNumber(parseInt(kmAttr.value_name))} km
                              </p>
                            )}
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              🏷️ {item.condition === 'new' ? '0 km' : 'Usado'}
                            </p>
                          </>
                        );
                      })()}
                    </div>
                    
                    {item.location && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        📍 {item.location.city.name}, {item.location.state.name}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectItem(item)}
                        disabled={loadingItem === item.id}
                        className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {loadingItem === item.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Cargando...
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            Agregar
                          </>
                        )}
                      </button>
                      <a
                        href={item.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Ver
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
