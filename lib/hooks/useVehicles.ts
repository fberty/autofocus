'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Vehicle } from '@/types';

async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch('/api/vehicles');
  if (!res.ok) {
    if (res.status === 401) return [];
    throw new Error('Error al obtener vehículos');
  }
  return res.json();
}

export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: fetchVehicles,
  });
}

export function useAddVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt' | 'priceHistory'>) => {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Error al crear vehículo');
      return res.json() as Promise<Vehicle>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Vehicle> }) => {
      const res = await fetch(`/api/vehicles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Error al actualizar vehículo');
      return res.json() as Promise<Vehicle>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar vehículo');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}

export function useMigrateVehicles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vehicles: Vehicle[]) => {
      const res = await fetch('/api/vehicles/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicles }),
      });
      if (!res.ok) throw new Error('Error al migrar datos');
      return res.json() as Promise<{ migrated: number; vehicles: Vehicle[] }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
}
