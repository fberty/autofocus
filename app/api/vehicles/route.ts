import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { vehicleToFrontend } from '@/lib/mappers';

// GET /api/vehicles - Get all vehicles for the authenticated user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { userId: session.user.id },
      include: { priceHistory: { orderBy: { date: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(vehicles.map(vehicleToFrontend));
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return NextResponse.json(
      { error: 'Error al obtener vehículos' },
      { status: 500 }
    );
  }
}

// POST /api/vehicles - Create a new vehicle
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const data = await request.json();

    const vehicle = await prisma.vehicle.create({
      data: {
        userId: session.user.id,
        marca: data.marca,
        modelo: data.modelo,
        ano: data.año,
        kilometraje: data.kilometraje,
        precio: data.precio,
        moneda: data.moneda || 'ARS',
        condicion: data.condicion,
        source: data.source || 'manual',
        mlItemId: data.mercadolibre?.itemId,
        mlUrl: data.mercadolibre?.url,
        mlTitle: data.mercadolibre?.title,
        mlThumbnail: data.mercadolibre?.thumbnail,
        mlSeller: data.mercadolibre?.seller || undefined,
        mlLocation: data.mercadolibre?.location || undefined,
        mlPermalink: data.mercadolibre?.permalink,
        mlLastSync: data.mercadolibre?.lastSync ? new Date(data.mercadolibre.lastSync) : undefined,
        priceHistory: {
          create: {
            price: data.precio,
            notes: data.source === 'mercadolibre' ? 'Precio inicial (MercadoLibre)' : 'Precio inicial',
          },
        },
      },
      include: { priceHistory: { orderBy: { date: 'asc' } } },
    });

    return NextResponse.json(vehicleToFrontend(vehicle), { status: 201 });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json(
      { error: 'Error al crear vehículo' },
      { status: 500 }
    );
  }
}
