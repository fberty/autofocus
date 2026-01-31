export type VehicleCondition = '0km' | 'usado';
export type VehicleSource = 'manual' | 'mercadolibre';

export interface PriceHistoryEntry {
  id: string;
  price: number;
  date: string;
  notes?: string;
}

export interface MercadoLibreData {
  itemId: string;
  url: string;
  title: string;
  thumbnail?: string;
  seller?: {
    id: number;
    nickname: string;
  };
  location?: {
    city: string;
    state: string;
  };
  permalink?: string;
  lastSync?: string;
}

export interface Vehicle {
  id: string;
  marca: string;
  modelo: string;
  año: number;
  kilometraje: number;
  precio: number;
  moneda: string;
  condicion: VehicleCondition;
  source: VehicleSource;
  mercadolibre?: MercadoLibreData;
  createdAt: string;
  updatedAt: string;
  priceHistory: PriceHistoryEntry[];
}

export interface FilterState {
  marca: string;
  modelo: string;
  añoMin: string;
  añoMax: string;
  kilometrajeMin: string;
  kilometrajeMax: string;
  precioMin: string;
  precioMax: string;
  condicion: 'todos' | '0km' | 'usado';
}

export type SortField = 'marca' | 'modelo' | 'año' | 'kilometraje' | 'precio';
export type SortDirection = 'asc' | 'desc';

export interface SortState {
  field: SortField;
  direction: SortDirection;
}
