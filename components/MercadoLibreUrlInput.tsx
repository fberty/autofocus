'use client';

import { useState } from 'react';
import { mercadolibre } from '@/lib/mercadolibre';
import { Vehicle } from '@/types';
import { Link2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface MercadoLibreUrlInputProps {
  onVehicleLoaded: (vehicleData: Partial<Vehicle>) => void;
  onClose: () => void;
}

export default function MercadoLibreUrlInput({ onVehicleLoaded, onClose }: MercadoLibreUrlInputProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const vehicleData = await mercadolibre.loadFromUrl(url);
      
      if (!vehicleData) {
        throw new Error('No se pudo extraer la información del vehículo');
      }

      setSuccess(true);
      setTimeout(() => {
        onVehicleLoaded(vehicleData);
        onClose();
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Error al cargar el vehículo desde MercadoLibre');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full transition-colors">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Cargar desde URL de MercadoLibre
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL de la publicación
            </label>
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://auto.mercadolibre.com.ar/MLA-..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                disabled={loading || success}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Pega el enlace completo de la publicación de MercadoLibre
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-600 dark:text-green-400">
                ¡Vehículo cargado exitosamente!
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || success}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim() || success}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Cargando...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Cargado
                </>
              ) : (
                'Cargar Vehículo'
              )}
            </button>
          </div>
        </form>

        <div className="px-4 pb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              <strong>Tip:</strong> La información del vehículo (marca, modelo, año, precio, etc.) 
              se extraerá automáticamente de la publicación y quedará guardada en tu base de datos local.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
