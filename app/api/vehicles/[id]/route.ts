import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { vehicleToFrontend } from '@/lib/mappers';

// PUT /api/vehicles/[id] - Update a vehicle
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify ownership
    const existing = await prisma.vehicle.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    const data = await request.json();
    const priceChanged = data.precio !== undefined && data.precio !== existing.precio;

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        marca: data.marca,
        modelo: data.modelo,
        ano: data.año,
        kilometraje: data.kilometraje,
        precio: data.precio,
        moneda: data.moneda,
        condicion: data.condicion,
        source: data.source,
        mlItemId: data.mercadolibre?.itemId,
        mlUrl: data.mercadolibre?.url,
        mlTitle: data.mercadolibre?.title,
        mlThumbnail: data.mercadolibre?.thumbnail,
        mlSeller: data.mercadolibre?.seller || undefined,
        mlLocation: data.mercadolibre?.location || undefined,
        mlPermalink: data.mercadolibre?.permalink,
        mlLastSync: data.mercadolibre?.lastSync ? new Date(data.mercadolibre.lastSync) : undefined,
        ...(priceChanged
          ? {
              priceHistory: {
                create: {
                  price: data.precio,
                  notes: 'Actualización de precio',
                },
              },
            }
          : {}),
      },
      include: { priceHistory: { orderBy: { date: 'asc' } } },
    });

    return NextResponse.json(vehicleToFrontend(vehicle));
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json(
      { error: 'Error al actualizar vehículo' },
      { status: 500 }
    );
  }
}

// DELETE /api/vehicles/[id] - Delete a vehicle
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify ownership
    const existing = await prisma.vehicle.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 });
    }

    await prisma.vehicle.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json(
      { error: 'Error al eliminar vehículo' },
      { status: 500 }
    );
  }
}
