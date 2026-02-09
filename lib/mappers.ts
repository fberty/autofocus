import { Vehicle as PrismaVehicle, PriceHistory } from '@prisma/client';
import { Vehicle, PriceHistoryEntry } from '@/types';

type VehicleWithHistory = PrismaVehicle & { priceHistory: PriceHistory[] };

export function vehicleToFrontend(v: VehicleWithHistory): Vehicle {
  return {
    id: v.id,
    marca: v.marca,
    modelo: v.modelo,
    año: v.ano,
    kilometraje: v.kilometraje,
    precio: v.precio,
    moneda: v.moneda,
    condicion: v.condicion as Vehicle['condicion'],
    source: v.source as Vehicle['source'],
    mercadolibre: v.mlItemId
      ? {
          itemId: v.mlItemId,
          url: v.mlUrl || '',
          title: v.mlTitle || '',
          thumbnail: v.mlThumbnail || undefined,
          seller: v.mlSeller as any,
          location: v.mlLocation as any,
          permalink: v.mlPermalink || undefined,
          lastSync: v.mlLastSync?.toISOString(),
        }
      : undefined,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
    priceHistory: v.priceHistory.map(priceHistoryToFrontend),
  };
}

function priceHistoryToFrontend(ph: PriceHistory): PriceHistoryEntry {
  return {
    id: ph.id,
    price: ph.price,
    date: ph.date.toISOString(),
    notes: ph.notes || undefined,
  };
}
