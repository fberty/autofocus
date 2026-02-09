import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { vehicleToFrontend } from '@/lib/mappers';

// POST /api/vehicles/migrate - Migrate localStorage vehicles to database
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { vehicles } = await request.json();

    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      return NextResponse.json({ migrated: 0 });
    }

    let migrated = 0;

    for (const v of vehicles) {
      // Skip if a vehicle with same ML itemId already exists for this user
      if (v.mercadolibre?.itemId) {
        const exists = await prisma.vehicle.findFirst({
          where: {
            userId: session.user.id,
            mlItemId: v.mercadolibre.itemId,
          },
        });
        if (exists) continue;
      }

      await prisma.vehicle.create({
        data: {
          userId: session.user.id,
          marca: v.marca,
          modelo: v.modelo,
          ano: v.año,
          kilometraje: v.kilometraje,
          precio: v.precio,
          moneda: v.moneda || 'ARS',
          condicion: v.condicion,
          source: v.source || 'manual',
          mlItemId: v.mercadolibre?.itemId,
          mlUrl: v.mercadolibre?.url,
          mlTitle: v.mercadolibre?.title,
          mlThumbnail: v.mercadolibre?.thumbnail,
          mlSeller: v.mercadolibre?.seller || undefined,
          mlLocation: v.mercadolibre?.location || undefined,
          mlPermalink: v.mercadolibre?.permalink,
          mlLastSync: v.mercadolibre?.lastSync ? new Date(v.mercadolibre.lastSync) : undefined,
          createdAt: v.createdAt ? new Date(v.createdAt) : new Date(),
          updatedAt: v.updatedAt ? new Date(v.updatedAt) : new Date(),
          priceHistory: {
            create: (v.priceHistory || []).map((ph: any) => ({
              price: ph.price,
              date: ph.date ? new Date(ph.date) : new Date(),
              notes: ph.notes,
              source: ph.source,
            })),
          },
        },
      });
      migrated++;
    }

    // Return all vehicles after migration
    const allVehicles = await prisma.vehicle.findMany({
      where: { userId: session.user.id },
      include: { priceHistory: { orderBy: { date: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      migrated,
      vehicles: allVehicles.map(vehicleToFrontend),
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Error al migrar datos' },
      { status: 500 }
    );
  }
}
