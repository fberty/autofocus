'use client';

import { FilterState } from '@/types';
import { Search, X } from 'lucide-react';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  marcas: string[];
  modelos: string[];
}

export default function FilterBar({ filters, onFilterChange, marcas, modelos }: FilterBarProps) {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      marca: '',
      modelo: '',
      añoMin: '',
      añoMax: '',
      kilometrajeMin: '',
      kilometrajeMax: '',
      precioMin: '',
      precioMax: '',
      condicion: 'todos',
    });
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => 
    key !== 'condicion' ? value !== '' : value !== 'todos'
  );

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
          <Search className="w-4 h-4" />
          Filtros
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-3 h-3" />
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 transition-colors">Marca</label>
          <select
            value={filters.marca}
            onChange={(e) => updateFilter('marca', e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="">Todas</option>
            {marcas.map((marca) => (
              <option key={marca} value={marca}>{marca}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 transition-colors">Modelo</label>
          <select
            value={filters.modelo}
            onChange={(e) => updateFilter('modelo', e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="">Todos</option>
            {modelos.map((modelo) => (
              <option key={modelo} value={modelo}>{modelo}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 transition-colors">Condición</label>
          <select
            value={filters.condicion}
            onChange={(e) => updateFilter('condicion', e.target.value as FilterState['condicion'])}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="todos">Todos</option>
            <option value="0km">0 km</option>
            <option value="usado">Usado</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 transition-colors">Año desde</label>
            <input
              type="number"
              value={filters.añoMin}
              onChange={(e) => updateFilter('añoMin', e.target.value)}
              placeholder="2000"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 transition-colors">Año hasta</label>
            <input
              type="number"
              value={filters.añoMax}
              onChange={(e) => updateFilter('añoMax', e.target.value)}
              placeholder="2024"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 transition-colors">Km desde</label>
            <input
              type="number"
              value={filters.kilometrajeMin}
              onChange={(e) => updateFilter('kilometrajeMin', e.target.value)}
              placeholder="0"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 transition-colors">Km hasta</label>
            <input
              type="number"
              value={filters.kilometrajeMax}
              onChange={(e) => updateFilter('kilometrajeMax', e.target.value)}
              placeholder="200000"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 transition-colors">Precio desde</label>
            <input
              type="number"
              value={filters.precioMin}
              onChange={(e) => updateFilter('precioMin', e.target.value)}
              placeholder="0"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 transition-colors">Precio hasta</label>
            <input
              type="number"
              value={filters.precioMax}
              onChange={(e) => updateFilter('precioMax', e.target.value)}
              placeholder="50000000"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
