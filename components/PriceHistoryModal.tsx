'use client';

import { Vehicle } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PriceHistoryModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
}

export default function PriceHistoryModal({ vehicle, onClose }: PriceHistoryModalProps) {
  if (!vehicle) return null;

  const sortedHistory = [...vehicle.priceHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getPriceChange = (index: number) => {
    if (index === sortedHistory.length - 1) return null;
    const current = sortedHistory[index].price;
    const previous = sortedHistory[index + 1].price;
    const diff = current - previous;
    const percentChange = ((diff / previous) * 100).toFixed(2);
    return { diff, percentChange };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col transition-colors">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 transition-colors">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors">
              Historial de Precios
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 transition-colors">
              {vehicle.marca} {vehicle.modelo} ({vehicle.año})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {sortedHistory.map((entry, index) => {
              const change = getPriceChange(index);
              return (
                <div
                  key={entry.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white transition-colors">
                          {formatCurrency(entry.price, vehicle.moneda)}
                        </span>
                        {change && (
                          <div className={`flex items-center gap-1 text-sm ${
                            change.diff > 0 ? 'text-green-600 dark:text-green-400' : change.diff < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {change.diff > 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : change.diff < 0 ? (
                              <TrendingDown className="w-4 h-4" />
                            ) : (
                              <Minus className="w-4 h-4" />
                            )}
                            <span className="font-medium">
                              {change.diff > 0 ? '+' : ''}{formatCurrency(change.diff)}
                            </span>
                            <span className="text-xs">
                              ({change.percentChange}%)
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                        {formatDate(entry.date)}
                      </div>
                      {entry.notes && (
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 transition-colors">
                          {entry.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {sortedHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 transition-colors">
              No hay historial de precios disponible
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 transition-colors">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400 transition-colors">Precio actual:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-white transition-colors">
                {formatCurrency(vehicle.precio, vehicle.moneda)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400 transition-colors">Registros:</span>
              <span className="ml-2 font-semibold text-gray-900 dark:text-white transition-colors">
                {sortedHistory.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
