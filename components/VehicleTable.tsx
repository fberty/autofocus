'use client';

import { Vehicle, SortField, SortDirection } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { ArrowUpDown, ArrowUp, ArrowDown, Edit2, Trash2, History, ExternalLink } from 'lucide-react';

interface VehicleTableProps {
  vehicles: Vehicle[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (id: string) => void;
  onViewHistory: (vehicle: Vehicle) => void;
}

export default function VehicleTable({
  vehicles,
  sortField,
  sortDirection,
  onSort,
  onEdit,
  onDelete,
  onViewHistory,
}: VehicleTableProps) {
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-blue-600" />
      : <ArrowDown className="w-3 h-3 text-blue-600" />;
  };

  const grouped0km = vehicles.filter(v => v.condicion === '0km');
  const groupedUsados = vehicles.filter(v => v.condicion === 'usado');

  const renderTable = (vehicleList: Vehicle[], title: string, showTitle: boolean) => {
    if (vehicleList.length === 0) return null;

    return (
      <div className="mb-6">
        {showTitle && (
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide transition-colors">
              {title}
            </h3>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
              {vehicleList.length} {vehicleList.length === 1 ? 'vehículo' : 'vehículos'}
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors">
              <tr>
                <th 
                  className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => onSort('marca')}
                >
                  <div className="flex items-center gap-2">
                    Marca
                    <SortIcon field="marca" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => onSort('modelo')}
                >
                  <div className="flex items-center gap-2">
                    Modelo
                    <SortIcon field="modelo" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => onSort('año')}
                >
                  <div className="flex items-center gap-2">
                    Año
                    <SortIcon field="año" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => onSort('kilometraje')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Kilometraje
                    <SortIcon field="kilometraje" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => onSort('precio')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Precio
                    <SortIcon field="precio" />
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700 transition-colors">
              {vehicleList.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium transition-colors">{vehicle.marca}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 transition-colors">{vehicle.modelo}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 transition-colors">{vehicle.año}</td>
                  <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 transition-colors">
                    {formatNumber(vehicle.kilometraje)} km
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white transition-colors">
                    {formatCurrency(vehicle.precio, vehicle.moneda)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {vehicle.mercadolibre && (
                        <a
                          href={vehicle.mercadolibre.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                          title="Ver en MercadoLibre"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => onViewHistory(vehicle)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Ver historial de precios"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(vehicle)}
                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Estás seguro de eliminar este vehículo?')) {
                            onDelete(vehicle.id);
                          }
                        }}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
        <p className="text-gray-500 dark:text-gray-400 transition-colors">No se encontraron vehículos</p>
      </div>
    );
  }

  const showSeparation = grouped0km.length > 0 && groupedUsados.length > 0;

  return (
    <div>
      {renderTable(grouped0km, '0 KM', showSeparation)}
      {renderTable(groupedUsados, 'USADOS', showSeparation)}
    </div>
  );
}
