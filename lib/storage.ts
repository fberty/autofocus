import { Vehicle, PriceHistoryEntry } from '@/types';

const STORAGE_KEY = 'autofocus_vehicles';

export const storage = {
  getVehicles: (): Vehicle[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const vehicles = data ? JSON.parse(data) : [];
      return vehicles.map((v: any) => ({
        ...v,
        moneda: v.moneda || 'ARS',
      }));
    } catch (error) {
      console.error('Error loading vehicles:', error);
      return [];
    }
  },

  saveVehicles: (vehicles: Vehicle[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
    } catch (error) {
      console.error('Error saving vehicles:', error);
    }
  },

  addVehicle: (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'priceHistory'>): Vehicle => {
    const vehicles = storage.getVehicles();
    const now = new Date().toISOString();
    const newVehicle: Vehicle = {
      ...vehicle,
      source: vehicle.source || 'manual',
      moneda: vehicle.moneda || 'ARS',
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      priceHistory: [{
        id: crypto.randomUUID(),
        price: vehicle.precio,
        date: now,
        notes: vehicle.source === 'mercadolibre' ? 'Precio inicial (MercadoLibre)' : 'Precio inicial'
      }]
    };
    vehicles.push(newVehicle);
    storage.saveVehicles(vehicles);
    return newVehicle;
  },

  updateVehicle: (id: string, updates: Partial<Omit<Vehicle, 'id' | 'createdAt' | 'priceHistory'>>): Vehicle | null => {
    const vehicles = storage.getVehicles();
    const index = vehicles.findIndex(v => v.id === id);
    if (index === -1) return null;

    const vehicle = vehicles[index];
    const now = new Date().toISOString();
    
    const priceChanged = updates.precio !== undefined && updates.precio !== vehicle.precio;
    
    const updatedVehicle: Vehicle = {
      ...vehicle,
      ...updates,
      updatedAt: now,
      priceHistory: priceChanged
        ? [
            ...vehicle.priceHistory,
            {
              id: crypto.randomUUID(),
              price: updates.precio!,
              date: now,
              notes: 'Actualización de precio'
            }
          ]
        : vehicle.priceHistory
    };

    vehicles[index] = updatedVehicle;
    storage.saveVehicles(vehicles);
    return updatedVehicle;
  },

  deleteVehicle: (id: string): boolean => {
    const vehicles = storage.getVehicles();
    const filtered = vehicles.filter(v => v.id !== id);
    if (filtered.length === vehicles.length) return false;
    storage.saveVehicles(filtered);
    return true;
  },

  getPriceHistory: (vehicleId: string): PriceHistoryEntry[] => {
    const vehicles = storage.getVehicles();
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle?.priceHistory || [];
  }
};
