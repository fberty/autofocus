import { Vehicle, MercadoLibreData } from '@/types';

export interface MLSearchParams {
  query: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface MLSearchResult {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  thumbnail: string;
  condition: string;
  permalink: string;
  seller: {
    id: number;
    nickname: string;
  };
  location?: {
    city: { name: string };
    state: { name: string };
  };
  attributes?: Array<{
    id: string;
    name: string;
    value_name: string;
  }>;
}

export const mercadolibre = {
  extractItemId: (url: string): string | null => {
    const patterns = [
      /MLA-?(\d+)/i,
      /\/MLA(\d+)/i,
      /\/p\/MLA(\d+)/i,
      /item\/MLA(\d+)/i,
      /item_id=MLA(\d+)/i,
      /articulo\.mercadolibre\.com\.ar\/MLA-?(\d+)/i,
      /auto\.mercadolibre\.com\.ar\/MLA-?(\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return `MLA${match[1]}`;
      }
    }
    return null;
  },

  searchVehicles: async (query: string, limit: number = 20): Promise<MLSearchResult[]> => {
    try {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
      });

      const response = await fetch(`/api/mercadolibre/search?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `MercadoLibre API error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error searching MercadoLibre:', error);
      throw error;
    }
  },

  getItemDetails: async (itemId: string): Promise<MLSearchResult | null> => {
    try {
      const response = await fetch(`/api/mercadolibre/item/${itemId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `MercadoLibre API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching item details:', error);
      throw error;
    }
  },

  extractVehicleData: (item: MLSearchResult): Partial<Vehicle> => {
    const attributes = item.attributes || [];
    
    const findAttribute = (id: string): string | null => {
      const attr = attributes.find(a => a.id === id);
      return attr?.value_name || null;
    };

    let marca = findAttribute('BRAND') || '';
    let modelo = findAttribute('MODEL') || '';
    
    // If model is empty or same as title, try to extract brand and model from title
    if (!modelo || modelo === item.title) {
      const brandPatterns = /\b(Honda|Toyota|Ford|Chevrolet|Volkswagen|VW|Fiat|Renault|Peugeot|Citroën|Citroen|Nissan|Hyundai|Kia|Mercedes[- ]?Benz|Mercedes|BMW|Audi|Jeep|RAM|Dodge|Mitsubishi|Mazda|Subaru|Suzuki|Alfa Romeo|Chery|Geely|JAC|BYD|Great Wall|Haval)\b/i;
      const brandMatch = item.title.match(brandPatterns);
      
      if (brandMatch) {
        if (!marca) marca = brandMatch[1];
        // Extract model by removing brand from title
        modelo = item.title.replace(new RegExp(`^${brandMatch[1]}\\s+`, 'i'), '').trim();
      } else {
        modelo = item.title;
      }
    }
    
    const añoStr = findAttribute('VEHICLE_YEAR');
    const año = añoStr ? parseInt(añoStr) : new Date().getFullYear();
    const kilometrajeStr = findAttribute('KILOMETERS');
    const kilometraje = kilometrajeStr ? parseInt(kilometrajeStr.replace(/\D/g, '')) : 0;
    
    const condicion = item.condition === 'new' ? '0km' : 'usado';
    const moneda = item.currency_id || 'ARS';

    const mercadolibreData: MercadoLibreData = {
      itemId: item.id,
      url: item.permalink,
      title: item.title,
      thumbnail: item.thumbnail,
      seller: item.seller,
      location: item.location ? {
        city: item.location.city.name,
        state: item.location.state.name,
      } : undefined,
      permalink: item.permalink,
      lastSync: new Date().toISOString(),
    };

    return {
      marca,
      modelo,
      año,
      kilometraje,
      precio: item.price,
      moneda,
      condicion,
      source: 'mercadolibre',
      mercadolibre: mercadolibreData,
    };
  },

  loadFromUrl: async (url: string): Promise<Partial<Vehicle> | null> => {
    const itemId = mercadolibre.extractItemId(url);
    
    if (!itemId) {
      throw new Error('URL de MercadoLibre inválida');
    }

    const item = await mercadolibre.getItemDetails(itemId);
    
    if (!item) {
      throw new Error('Publicación no encontrada');
    }

    return mercadolibre.extractVehicleData(item);
  },

  syncVehiclePrice: async (vehicle: Vehicle): Promise<number | null> => {
    if (!vehicle.mercadolibre?.itemId) {
      return null;
    }

    try {
      const item = await mercadolibre.getItemDetails(vehicle.mercadolibre.itemId);
      return item ? item.price : null;
    } catch (error) {
      console.error('Error syncing price:', error);
      return null;
    }
  },
};
