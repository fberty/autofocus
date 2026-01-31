'use client';

import { useState, useEffect, useMemo } from 'react';
import { Vehicle, FilterState, SortField, SortDirection } from '@/types';
import { storage } from '@/lib/storage';
import { mercadolibre, MLSearchResult } from '@/lib/mercadolibre';
import FilterBar from '@/components/FilterBar';
import VehicleTable from '@/components/VehicleTable';
import VehicleModal from '@/components/VehicleModal';
import PriceHistoryModal from '@/components/PriceHistoryModal';
import DarkModeToggle from '@/components/DarkModeToggle';
import MercadoLibreSearch from '@/components/MercadoLibreSearch';
import MercadoLibreUrlInput from '@/components/MercadoLibreUrlInput';
import { Plus, Search, Link2, ChevronDown } from 'lucide-react';

export default function Home() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filters, setFilters] = useState<FilterState>({
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
  const [sortState, setSortState] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'marca',
    direction: 'asc',
  });
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMLSearch, setShowMLSearch] = useState(false);
  const [showMLUrlInput, setShowMLUrlInput] = useState(false);
  const [mlInitialData, setMlInitialData] = useState<Partial<Vehicle> | undefined>(undefined);
  const [historyVehicle, setHistoryVehicle] = useState<Vehicle | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  useEffect(() => {
    setVehicles(storage.getVehicles());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAddMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('.add-menu-container')) {
          setShowAddMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAddMenu]);

  const marcas = useMemo(() => {
    const unique = new Set(vehicles.map(v => v.marca));
    return Array.from(unique).sort();
  }, [vehicles]);

  const modelos = useMemo(() => {
    const unique = new Set(vehicles.map(v => v.modelo));
    return Array.from(unique).sort();
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      if (filters.marca && vehicle.marca !== filters.marca) return false;
      if (filters.modelo && vehicle.modelo !== filters.modelo) return false;
      if (filters.añoMin && vehicle.año < parseInt(filters.añoMin)) return false;
      if (filters.añoMax && vehicle.año > parseInt(filters.añoMax)) return false;
      if (filters.kilometrajeMin && vehicle.kilometraje < parseInt(filters.kilometrajeMin)) return false;
      if (filters.kilometrajeMax && vehicle.kilometraje > parseInt(filters.kilometrajeMax)) return false;
      if (filters.precioMin && vehicle.precio < parseInt(filters.precioMin)) return false;
      if (filters.precioMax && vehicle.precio > parseInt(filters.precioMax)) return false;
      if (filters.condicion !== 'todos' && vehicle.condicion !== filters.condicion) return false;
      return true;
    });
  }, [vehicles, filters]);

  const sortedVehicles = useMemo(() => {
    const sorted = [...filteredVehicles];
    sorted.sort((a, b) => {
      let aVal: any = a[sortState.field];
      let bVal: any = b[sortState.field];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortState.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortState.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredVehicles, sortState]);

  const handleSort = (field: SortField) => {
    setSortState(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleAddVehicle = (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'priceHistory'>) => {
    storage.addVehicle(vehicleData);
    setVehicles(storage.getVehicles());
    setShowAddModal(false);
    setMlInitialData(undefined);
  };

  const handleMLItemSelect = (item: MLSearchResult) => {
    const vehicleData = mercadolibre.extractVehicleData(item);
    setMlInitialData(vehicleData as Partial<Vehicle>);
    setShowMLSearch(false);
    setShowAddModal(true);
  };

  const handleMLUrlLoad = (vehicleData: Partial<Vehicle>) => {
    setMlInitialData(vehicleData);
    setShowMLUrlInput(false);
    setShowAddModal(true);
  };

  const handleEditVehicle = (vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'priceHistory'>) => {
    if (editingVehicle) {
      storage.updateVehicle(editingVehicle.id, vehicleData);
      setVehicles(storage.getVehicles());
      setEditingVehicle(null);
    }
  };

  const handleDeleteVehicle = (id: string) => {
    storage.deleteVehicle(id);
    setVehicles(storage.getVehicles());
  };

  const handleViewHistory = (vehicle: Vehicle) => {
    setHistoryVehicle(vehicle);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">AutoFocus</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors">Análisis de Mercado Automotor</p>
            </div>
            <div className="flex items-center gap-3">
              <DarkModeToggle />
              <div className="relative add-menu-container">
                <button
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Agregar Vehículo
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showAddMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                    <button
                      onClick={() => {
                        setShowAddModal(true);
                        setShowAddMenu(false);
                        setMlInitialData(undefined);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
                    >
                      <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">Manual</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Ingresar datos manualmente</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setShowMLSearch(true);
                        setShowAddMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
                    >
                      <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">Buscar en MercadoLibre</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Buscar publicaciones</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setShowMLUrlInput(true);
                        setShowAddMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-b-lg"
                    >
                      <Link2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">Desde URL</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Pegar enlace de MercadoLibre</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          marcas={marcas}
          modelos={modelos}
        />

        <div className="mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors">
            Mostrando <span className="font-semibold text-gray-900 dark:text-white transition-colors">{sortedVehicles.length}</span> de{' '}
            <span className="font-semibold text-gray-900 dark:text-white transition-colors">{vehicles.length}</span> vehículos
          </div>
        </div>

        <VehicleTable
          vehicles={sortedVehicles}
          sortField={sortState.field}
          sortDirection={sortState.direction}
          onSort={handleSort}
          onEdit={setEditingVehicle}
          onDelete={handleDeleteVehicle}
          onViewHistory={handleViewHistory}
        />
      </main>

      {(showAddModal || editingVehicle) && (
        <VehicleModal
          vehicle={editingVehicle}
          initialData={mlInitialData}
          onClose={() => {
            setShowAddModal(false);
            setEditingVehicle(null);
            setMlInitialData(undefined);
          }}
          onSave={editingVehicle ? handleEditVehicle : handleAddVehicle}
        />
      )}

      {showMLSearch && (
        <MercadoLibreSearch
          onSelectItem={handleMLItemSelect}
          onClose={() => setShowMLSearch(false)}
        />
      )}

      {showMLUrlInput && (
        <MercadoLibreUrlInput
          onVehicleLoaded={handleMLUrlLoad}
          onClose={() => setShowMLUrlInput(false)}
        />
      )}

      {historyVehicle && (
        <PriceHistoryModal
          vehicle={historyVehicle}
          onClose={() => setHistoryVehicle(null)}
        />
      )}
    </div>
  );
}
