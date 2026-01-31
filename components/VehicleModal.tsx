'use client';

import { useState, useEffect } from 'react';
import { Vehicle, VehicleCondition, VehicleSource, MercadoLibreData } from '@/types';
import { X, ExternalLink } from 'lucide-react';

interface VehicleModalProps {
  vehicle: Vehicle | null;
  initialData?: Partial<Vehicle>;
  onClose: () => void;
  onSave: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'priceHistory'>) => void;
}

export default function VehicleModal({ vehicle, initialData, onClose, onSave }: VehicleModalProps) {
  const [formData, setFormData] = useState<{
    marca: string;
    modelo: string;
    año: number;
    kilometraje: number;
    precio: number;
    moneda: string;
    condicion: VehicleCondition;
    source: VehicleSource;
    mercadolibre?: MercadoLibreData;
  }>({
    marca: '',
    modelo: '',
    año: new Date().getFullYear(),
    kilometraje: 0,
    precio: 0,
    moneda: 'ARS',
    condicion: '0km' as VehicleCondition,
    source: 'manual',
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        marca: vehicle.marca,
        modelo: vehicle.modelo,
        año: vehicle.año,
        kilometraje: vehicle.kilometraje,
        precio: vehicle.precio,
        moneda: vehicle.moneda || 'ARS',
        condicion: vehicle.condicion,
        source: vehicle.source,
        mercadolibre: vehicle.mercadolibre,
      });
    } else if (initialData) {
      setFormData({
        marca: initialData.marca || '',
        modelo: initialData.modelo || '',
        año: initialData.año || new Date().getFullYear(),
        kilometraje: initialData.kilometraje || 0,
        precio: initialData.precio || 0,
        moneda: initialData.moneda || 'ARS',
        condicion: initialData.condicion || '0km',
        source: initialData.source || 'manual',
        mercadolibre: initialData.mercadolibre,
      });
    } else {
      setFormData({
        marca: '',
        modelo: '',
        año: new Date().getFullYear(),
        kilometraje: 0,
        precio: 0,
        moneda: 'ARS',
        condicion: '0km',
        source: 'manual',
      });
    }
  }, [vehicle, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!vehicle && formData.marca === '' && formData.modelo === '') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full transition-colors">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 transition-colors">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors">
              {vehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
            </h2>
            {formData.mercadolibre && (
              <a
                href={formData.mercadolibre.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
              >
                <ExternalLink className="w-3 h-3" />
                Ver en MercadoLibre
              </a>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {formData.mercadolibre && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                <strong>Fuente:</strong> MercadoLibre - Los datos fueron extraídos automáticamente. 
                Puedes editarlos antes de guardar.
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
              Marca *
            </label>
            <input
              type="text"
              required
              value={formData.marca}
              onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Toyota, Ford, Chevrolet..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
              Modelo *
            </label>
            <input
              type="text"
              required
              value={formData.modelo}
              onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Corolla, Focus, Cruze..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                Año *
              </label>
              <input
                type="number"
                required
                min="1900"
                max={new Date().getFullYear() + 1}
                value={formData.año}
                onChange={(e) => setFormData({ ...formData, año: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                Condición *
              </label>
              <select
                value={formData.condicion}
                onChange={(e) => setFormData({ ...formData, condicion: e.target.value as VehicleCondition })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="0km">0 km</option>
                <option value="usado">Usado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
              Kilometraje *
            </label>
            <input
              type="number"
              required
              min="0"
              value={formData.kilometraje}
              onChange={(e) => setFormData({ ...formData, kilometraje: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                Precio *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                Moneda *
              </label>
              <select
                value={formData.moneda}
                onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="ARS">ARS ($)</option>
                <option value="USD">USD (U$S)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {vehicle ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
