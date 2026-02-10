# Informe: Sistema de Usuarios para AutoFocus
## Análisis y Propuesta de Implementación

---

## 1. ANÁLISIS DE LA APLICACIÓN ACTUAL

### 1.1 Arquitectura Actual
AutoFocus es una aplicación web construida con:
- **Frontend**: Next.js 14 + TypeScript + TailwindCSS
- **Almacenamiento**: localStorage (100% cliente)
- **API Externa**: MercadoLibre (solo lectura, sin autenticación)
- **Sin Backend**: No hay servidor ni base de datos actual

### 1.2 Modelo de Datos Actual

```typescript
Vehicle {
  id: string;
  marca: string;
  modelo: string;
  año: number;
  kilometraje: number;
  precio: number;
  condicion: '0km' | 'usado';
  source: 'manual' | 'mercadolibre';
  mercadolibre?: {
    itemId: string;
    url: string;
    title: string;
    thumbnail?: string;
    seller?: { id: number; nickname: string; };
    location?: { city: string; state: string; };
    permalink?: string;
    lastSync?: string;
  };
  createdAt: string;
  updatedAt: string;
  priceHistory: Array<{
    id: string;
    price: number;
    date: string;
    notes?: string;
  }>;
}
```

### 1.3 Limitaciones Actuales
- **Sin autenticación**: Cualquiera puede acceder
- **Sin multi-usuario**: Todos comparten los mismos datos locales
- **Sin sincronización**: Los datos solo existen en un navegador
- **Sin backup**: Si se borran los datos del navegador, se pierden
- **Sin colaboración**: No se pueden compartir análisis entre usuarios

---

## 2. PROPUESTA DE ARQUITECTURA CON USUARIOS

### 2.1 Stack Tecnológico Recomendado

#### Opción A: Full-Stack con Node.js (Recomendada)
```
Frontend:
- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- React Query (cache y sincronización)

Backend:
- Next.js API Routes (mismo proyecto)
- Prisma ORM
- PostgreSQL o MongoDB

Autenticación:
- NextAuth.js v5 (Auth.js)
- Proveedores: Google, Email/Password

Infraestructura:
- Vercel (Frontend + API Routes)
- Supabase o Railway (Base de datos)
```

#### Opción B: Firebase (Más rápida de implementar)
```
Frontend:
- Next.js 14 (sin cambios mayores)

Backend:
- Firebase Authentication (Google + Email)
- Cloud Firestore (base de datos)
- Firebase Storage (opcional, para imágenes)

Ventajas:
- Configuración más rápida
- Escalabilidad automática
- SDK muy maduro
- Costo inicial bajo
```

#### Opción C: Supabase (Open Source)
```
Frontend:
- Next.js 14 (sin cambios mayores)

Backend:
- Supabase Auth (Google + Email)
- PostgreSQL (Supabase DB)
- Row Level Security (RLS)

Ventajas:
- Open source
- PostgreSQL real
- Real-time subscriptions
- REST API automática
```

### 2.2 Modelo de Datos Extendido

```typescript
// Nuevo modelo de Usuario
User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider: 'google' | 'email';
  createdAt: DateTime;
  updatedAt: DateTime;
  settings?: UserSettings;
  vehicles: Vehicle[];
}

UserSettings {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  defaultFilters?: FilterPreset;
  notifications: boolean;
}

// Vehicle actualizado
Vehicle {
  id: string;
  userId: string;              // Nueva: relación con usuario
  marca: string;
  modelo: string;
  año: number;
  kilometraje: number;
  precio: number;
  condicion: '0km' | 'usado';
  source: 'manual' | 'mercadolibre';
  mercadolibre?: MercadoLibreData;
  createdAt: DateTime;
  updatedAt: DateTime;
  priceHistory: PriceHistoryEntry[];
  isPublic: boolean;           // Nueva: para compartir análisis
  tags?: string[];             // Nueva: organización personal
}

PriceHistoryEntry {
  id: string;
  vehicleId: string;
  userId: string;              // Nueva: auditoría
  price: number;
  date: DateTime;
  notes?: string;
  source: 'manual' | 'mercadolibre' | 'auto';
}
```

---

## 3. OPCIONES DE ALMACENAMIENTO Y ANÁLISIS

### 3.1 Opción 1: PostgreSQL con Prisma

**Esquema de Base de Datos:**

```sql
-- Tabla users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar TEXT,
  provider VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla user_settings
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'auto',
  notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Tabla vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  año INTEGER NOT NULL,
  kilometraje INTEGER NOT NULL,
  precio DECIMAL(12, 2) NOT NULL,
  condicion VARCHAR(10) NOT NULL,
  source VARCHAR(20) NOT NULL,
  mercadolibre_data JSONB,
  is_public BOOLEAN DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_marca ON vehicles(marca);
CREATE INDEX idx_vehicles_precio ON vehicles(precio);

-- Tabla price_history
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  price DECIMAL(12, 2) NOT NULL,
  date TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  source VARCHAR(20)
);

CREATE INDEX idx_price_history_vehicle ON price_history(vehicle_id);
CREATE INDEX idx_price_history_date ON price_history(date DESC);
```

**Proyección de Almacenamiento PostgreSQL:**

| Usuarios | Vehículos/Usuario | Registros Histórico/Veh | Tamaño Total | Estimado Mensual* |
|----------|-------------------|-------------------------|--------------|-------------------|
| 10       | 100              | 100                     | ~15 MB       | Gratis            |
| 10       | 1000             | 100                     | ~150 MB      | Gratis            |
| 100      | 100              | 100                     | ~150 MB      | Gratis            |
| 100      | 1000             | 100                     | ~1.5 GB      | $5-10             |
| 1000     | 100              | 100                     | ~1.5 GB      | $5-10             |
| 1000     | 1000             | 100                     | ~15 GB       | $20-40            |
| 10000    | 100              | 100                     | ~15 GB       | $20-40            |
| 10000    | 1000             | 100                     | ~150 GB      | $100-200          |

*Estimados para Supabase/Railway en tier gratuito o pagos

**Cálculo Detallado (PostgreSQL):**

```
Tamaño por registro Vehicle (sin historial):
- UUID (16 bytes) × 2 (id + user_id) = 32 bytes
- Strings (marca, modelo): ~150 bytes
- Integers (año, km): 8 bytes
- Decimal (precio): 8 bytes
- Enums/Booleans: 10 bytes
- JSONB (mercadolibre): ~300 bytes (promedio)
- Timestamps: 16 bytes
- Overhead: 24 bytes
TOTAL: ~550 bytes por vehículo

Tamaño por registro PriceHistory:
- UUID (16 bytes) × 3 (id + vehicle_id + user_id) = 48 bytes
- Decimal (price): 8 bytes
- Timestamp: 8 bytes
- Text (notes): ~50 bytes promedio
- Overhead: 24 bytes
TOTAL: ~140 bytes por entrada de historial

Cálculo para 1 usuario con 100 vehículos y 100 registros históricos cada uno:
- Vehículos: 100 × 550 bytes = 55 KB
- Historial: 100 veh × 100 hist × 140 bytes = 1.4 MB
- User + Settings: ~1 KB
TOTAL POR USUARIO: ~1.46 MB

Proyecciones:
- 10 usuarios: ~15 MB
- 100 usuarios: ~150 MB
- 1000 usuarios: ~1.5 GB
- 10000 usuarios: ~15 GB (con 100 veh/usuario)
- 10000 usuarios con 1000 veh: ~150 GB
```

### 3.2 Opción 2: MongoDB/Firestore

**Esquema de Documentos:**

```javascript
// Colección: users
{
  _id: ObjectId,
  email: String,
  name: String,
  avatar: String,
  provider: String,
  settings: {
    theme: String,
    notifications: Boolean
  },
  createdAt: ISODate,
  updatedAt: ISODate
}

// Colección: vehicles
{
  _id: ObjectId,
  userId: ObjectId,
  marca: String,
  modelo: String,
  año: Number,
  kilometraje: Number,
  precio: Number,
  condicion: String,
  source: String,
  mercadolibre: {
    itemId: String,
    url: String,
    title: String,
    thumbnail: String,
    seller: Object,
    location: Object
  },
  priceHistory: [
    {
      id: String,
      price: Number,
      date: ISODate,
      notes: String,
      source: String
    }
  ],
  isPublic: Boolean,
  tags: [String],
  createdAt: ISODate,
  updatedAt: ISODate
}
```

**Proyección de Almacenamiento MongoDB/Firestore:**

| Usuarios | Vehículos/Usuario | Registros Histórico/Veh | Tamaño Total | Costo Mensual* |
|----------|-------------------|-------------------------|--------------|----------------|
| 10       | 100              | 100                     | ~20 MB       | Gratis         |
| 10       | 1000             | 100                     | ~200 MB      | Gratis         |
| 100      | 100              | 100                     | ~200 MB      | Gratis         |
| 100      | 1000             | 100                     | ~2 GB        | $0-5           |
| 1000     | 100              | 100                     | ~2 GB        | $0-5           |
| 1000     | 1000             | 100                     | ~20 GB       | $10-30         |
| 10000    | 100              | 100                     | ~20 GB       | $10-30         |
| 10000    | 1000             | 100                     | ~200 GB      | $80-150        |

*Firestore: primer GB gratis, luego $0.18/GB
*MongoDB Atlas: 512MB gratis, luego desde $9/mes

**Cálculo Detallado (MongoDB con historial embebido):**

```
Documento Vehicle completo:
- ObjectId (12 bytes) × 2 (id + userId) = 24 bytes
- Strings base (marca, modelo, condicion, source): ~200 bytes
- Numbers (año, km, precio): 24 bytes
- Objeto mercadolibre: ~400 bytes
- Arrays (tags): ~50 bytes
- Timestamps: 16 bytes
- PriceHistory (array embebido):
  * 100 registros × ~150 bytes = 15 KB
- Overhead BSON: ~100 bytes
TOTAL POR VEHÍCULO: ~16 KB (con historial completo)

Usuario con 100 vehículos:
- Documento User: ~500 bytes
- 100 vehículos × 16 KB = 1.6 MB
TOTAL: ~1.6 MB por usuario

Usuario con 1000 vehículos:
- 1000 vehículos × 16 KB = 16 MB
TOTAL: ~16 MB por usuario

Proyecciones totales:
- 10 usuarios × 1.6 MB = 16 MB (100 veh)
- 100 usuarios × 1.6 MB = 160 MB (100 veh)
- 1000 usuarios × 1.6 MB = 1.6 GB (100 veh)
- 10000 usuarios × 1.6 MB = 16 GB (100 veh)
- 10000 usuarios × 16 MB = 160 GB (1000 veh)
```

### 3.3 Comparación de Opciones

| Criterio | PostgreSQL | MongoDB/Firestore | SQLite (local-first) |
|----------|------------|-------------------|----------------------|
| **Tamaño (10K users, 100 veh)** | ~15 GB | ~20 GB | ~12 GB (local) |
| **Tamaño (10K users, 1000 veh)** | ~150 GB | ~200 GB | ~120 GB (local) |
| **Consultas complejas** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Escalabilidad** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **Costo inicial** | Gratis - $10 | Gratis - $5 | $0 (solo hosting) |
| **Costo escala (10K users)** | $20-40 | $10-30 | $5-20 |
| **Tiempo implementación** | ~2 semanas | ~1 semana | ~3 semanas |
| **Real-time** | Con extensiones | ⭐⭐⭐⭐⭐ | ❌ |
| **Transacciones** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Relaciones complejas** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |

---

## 4. IMPLEMENTACIÓN DE AUTENTICACIÓN

### 4.1 Flujo de Autenticación con NextAuth.js

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Login con Google
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    
    // Login con Email/Password
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciales inválidas");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.hashedPassword) {
          throw new Error("Usuario no encontrado");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          throw new Error("Contraseña incorrecta");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
        };
      }
    })
  ],
  
  session: {
    strategy: "jwt",
  },
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### 4.2 Componente de Login

```typescript
// app/auth/signin/page.tsx
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      alert(result.error);
      setIsLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">
            Iniciar Sesión en AutoFocus
          </h2>
        </div>

        {/* Login con Google */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 border rounded-lg hover:bg-gray-50 transition"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            {/* Google icon SVG */}
          </svg>
          Continuar con Google
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">O</span>
          </div>
        </div>

        {/* Login con Email */}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {isLoading ? "Cargando..." : "Iniciar Sesión"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          ¿No tienes cuenta?{" "}
          <a href="/auth/signup" className="text-blue-600 hover:underline">
            Regístrate
          </a>
        </p>
      </div>
    </div>
  );
}
```

### 4.3 Middleware de Protección

```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    "/",
    "/api/vehicles/:path*",
    "/api/users/:path*",
  ],
};
```

---

## 5. API ENDPOINTS

### 5.1 Gestión de Vehículos

```typescript
// app/api/vehicles/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/vehicles - Obtener vehículos del usuario
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const marca = searchParams.get("marca");
  const condicion = searchParams.get("condicion");

  const vehicles = await prisma.vehicle.findMany({
    where: {
      userId: session.user.id,
      ...(marca && { marca }),
      ...(condicion && { condicion }),
    },
    include: {
      priceHistory: {
        orderBy: { date: "desc" },
        take: 100,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(vehicles);
}

// POST /api/vehicles - Crear nuevo vehículo
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const data = await request.json();

  const vehicle = await prisma.vehicle.create({
    data: {
      userId: session.user.id,
      marca: data.marca,
      modelo: data.modelo,
      año: data.año,
      kilometraje: data.kilometraje,
      precio: data.precio,
      condicion: data.condicion,
      source: data.source || "manual",
      mercadolibreData: data.mercadolibre || null,
      priceHistory: {
        create: {
          userId: session.user.id,
          price: data.precio,
          notes: "Precio inicial",
          source: data.source || "manual",
        },
      },
    },
    include: {
      priceHistory: true,
    },
  });

  return NextResponse.json(vehicle, { status: 201 });
}
```

```typescript
// app/api/vehicles/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

// GET /api/vehicles/[id] - Obtener vehículo específico
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
    include: {
      priceHistory: {
        orderBy: { date: "desc" },
      },
    },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
  }

  return NextResponse.json(vehicle);
}

// PATCH /api/vehicles/[id] - Actualizar vehículo
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const data = await request.json();
  
  // Verificar propiedad
  const existing = await prisma.vehicle.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
  }

  // Si cambió el precio, agregar entrada al historial
  const updates: any = { ...data };
  if (data.precio && data.precio !== existing.precio) {
    updates.priceHistory = {
      create: {
        userId: session.user.id,
        price: data.precio,
        notes: data.priceNotes || "Actualización manual",
        source: "manual",
      },
    };
  }

  const vehicle = await prisma.vehicle.update({
    where: { id: params.id },
    data: updates,
    include: {
      priceHistory: {
        orderBy: { date: "desc" },
      },
    },
  });

  return NextResponse.json(vehicle);
}

// DELETE /api/vehicles/[id] - Eliminar vehículo
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
  }

  await prisma.vehicle.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true });
}
```

### 5.2 Migración desde localStorage

```typescript
// app/api/migrate/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { vehicles } = await request.json();

  if (!Array.isArray(vehicles) || vehicles.length === 0) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // Crear vehículos en lote
  const created = await prisma.$transaction(
    vehicles.map((vehicle) =>
      prisma.vehicle.create({
        data: {
          userId: session.user.id!,
          marca: vehicle.marca,
          modelo: vehicle.modelo,
          año: vehicle.año,
          kilometraje: vehicle.kilometraje,
          precio: vehicle.precio,
          condicion: vehicle.condicion,
          source: vehicle.source || "manual",
          mercadolibreData: vehicle.mercadolibre || null,
          createdAt: vehicle.createdAt,
          updatedAt: vehicle.updatedAt,
          priceHistory: {
            create: vehicle.priceHistory?.map((entry: any) => ({
              userId: session.user.id!,
              price: entry.price,
              date: entry.date,
              notes: entry.notes,
              source: entry.source || "manual",
            })) || [],
          },
        },
      })
    )
  );

  return NextResponse.json({
    success: true,
    migrated: created.length,
  });
}
```

---

## 6. CLIENTE: HOOKS Y COMPONENTES

### 6.1 Hook useVehicles

```typescript
// lib/hooks/useVehicles.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Vehicle } from "@/types";

export function useVehicles(filters?: {
  marca?: string;
  condicion?: string;
}) {
  return useQuery({
    queryKey: ["vehicles", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.marca) params.append("marca", filters.marca);
      if (filters?.condicion) params.append("condicion", filters.condicion);
      
      const response = await fetch(`/api/vehicles?${params}`);
      if (!response.ok) throw new Error("Error al cargar vehículos");
      return response.json() as Promise<Vehicle[]>;
    },
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Vehicle>) => {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al crear vehículo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Vehicle>;
    }) => {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Error al actualizar vehículo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error al eliminar vehículo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}
```

### 6.2 Componente Protegido

```typescript
// components/AuthGuard.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (status === "authenticated") {
    return <>{children}</>;
  }

  return null;
}
```

---

## 7. MIGRACIÓN Y COMPATIBILIDAD

### 7.1 Estrategia de Migración

```typescript
// lib/migration.ts
import { Vehicle } from "@/types";

export async function migrateFromLocalStorage(): Promise<{
  success: boolean;
  migrated: number;
  errors: string[];
}> {
  try {
    // Leer datos de localStorage
    const vehiclesJson = localStorage.getItem("vehicles");
    if (!vehiclesJson) {
      return { success: true, migrated: 0, errors: [] };
    }

    const vehicles: Vehicle[] = JSON.parse(vehiclesJson);
    
    // Enviar al servidor
    const response = await fetch("/api/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicles }),
    });

    if (!response.ok) {
      throw new Error("Error en la migración");
    }

    const result = await response.json();
    
    // Limpiar localStorage después de migración exitosa
    localStorage.removeItem("vehicles");
    localStorage.setItem("migrated", "true");

    return {
      success: true,
      migrated: result.migrated,
      errors: [],
    };
  } catch (error) {
    return {
      success: false,
      migrated: 0,
      errors: [error instanceof Error ? error.message : "Error desconocido"],
    };
  }
}

// Detectar si hay datos para migrar
export function hasPendingMigration(): boolean {
  if (typeof window === "undefined") return false;
  
  const vehiclesJson = localStorage.getItem("vehicles");
  const migrated = localStorage.getItem("migrated");
  
  return !!vehiclesJson && !migrated;
}
```

### 7.2 Componente de Migración

```typescript
// components/MigrationBanner.tsx
"use client";

import { useState, useEffect } from "react";
import { hasPendingMigration, migrateFromLocalStorage } from "@/lib/migration";

export function MigrationBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    setShowBanner(hasPendingMigration());
  }, []);

  const handleMigrate = async () => {
    setMigrating(true);
    const result = await migrateFromLocalStorage();
    
    if (result.success) {
      alert(`✅ Migración exitosa: ${result.migrated} vehículos transferidos`);
      setShowBanner(false);
    } else {
      alert(`❌ Error en la migración: ${result.errors.join(", ")}`);
    }
    
    setMigrating(false);
  };

  if (!showBanner) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900 border-b border-blue-200 dark:border-blue-800 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">
            Datos locales detectados
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Tienes vehículos guardados localmente. ¿Quieres migrarlos a tu cuenta?
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBanner(false)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Después
          </button>
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {migrating ? "Migrando..." : "Migrar Ahora"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 8. SEGURIDAD

### 8.1 Medidas de Seguridad Implementadas

1. **Autenticación JWT**
   - Tokens firmados con secret
   - Expiración configurable
   - Refresh tokens para sesiones largas

2. **Autorización por Recurso**
   - Cada request verifica userId
   - Solo el propietario puede modificar sus datos
   - Queries filtradas por usuario automáticamente

3. **Validación de Datos**
```typescript
// lib/validation.ts
import { z } from "zod";

export const vehicleSchema = z.object({
  marca: z.string().min(1).max(100),
  modelo: z.string().min(1).max(100),
  año: z.number().int().min(1900).max(2030),
  kilometraje: z.number().int().min(0),
  precio: z.number().positive(),
  condicion: z.enum(["0km", "usado"]),
  source: z.enum(["manual", "mercadolibre"]),
});

export function validateVehicle(data: unknown) {
  return vehicleSchema.parse(data);
}
```

4. **Rate Limiting**
```typescript
// middleware/rateLimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});

export async function rateLimit(identifier: string) {
  const { success } = await ratelimit.limit(identifier);
  return success;
}
```

5. **Variables de Entorno**
```env
# .env.example
DATABASE_URL="postgresql://user:pass@host:5432/autofocus"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Opcional: Rate limiting
UPSTASH_REDIS_REST_URL="your-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

---

## 9. ROADMAP DE IMPLEMENTACIÓN

### Fase 1: Setup Base (Semana 1)
- [ ] Configurar base de datos (PostgreSQL con Prisma)
- [ ] Implementar NextAuth.js
- [ ] Crear esquema de base de datos
- [ ] Migrar tipos TypeScript existentes
- [ ] Setup de variables de entorno

### Fase 2: Autenticación (Semana 2)
- [ ] Implementar login con Google
- [ ] Implementar login con Email/Password
- [ ] Crear páginas de auth (signin, signup, error)
- [ ] Implementar middleware de protección
- [ ] Agregar componente AuthGuard

### Fase 3: API Endpoints (Semana 3)
- [ ] GET /api/vehicles (listar)
- [ ] POST /api/vehicles (crear)
- [ ] GET /api/vehicles/[id] (detalle)
- [ ] PATCH /api/vehicles/[id] (actualizar)
- [ ] DELETE /api/vehicles/[id] (eliminar)
- [ ] POST /api/migrate (migración desde localStorage)

### Fase 4: Cliente (Semana 4)
- [ ] Instalar React Query
- [ ] Crear hooks useVehicles, useCreateVehicle, etc.
- [ ] Adaptar componentes existentes para usar API
- [ ] Implementar banner de migración
- [ ] Testing de flujos completos

### Fase 5: Features Adicionales (Semana 5-6)
- [ ] Perfil de usuario
- [ ] Configuración de cuenta
- [ ] Export/Import de datos
- [ ] Búsqueda y filtros avanzados del lado del servidor
- [ ] Paginación infinita o cursor-based

### Fase 6: Deploy y Optimización (Semana 7)
- [ ] Deploy a Vercel
- [ ] Configurar base de datos en producción
- [ ] Optimización de queries (índices)
- [ ] Monitoring y logs
- [ ] Backups automáticos

---

## 10. COSTOS PROYECTADOS

### Escenario Conservador (100 usuarios activos)
```
Infraestructura:
- Vercel Hobby: $0 (gratis con límites)
- Supabase Free Tier: $0 (hasta 500MB, 2GB transfer)
- Dominio: $12/año
TOTAL: ~$1/mes

Cuando se superen los límites:
- Vercel Pro: $20/mes
- Supabase Pro: $25/mes
TOTAL: ~$45/mes
```

### Escenario Medio (1000 usuarios activos)
```
Infraestructura:
- Vercel Pro: $20/mes
- Supabase Pro: $25/mes (8GB DB, 250GB transfer)
- Redis (Upstash): $10/mes (rate limiting)
- Dominio: $12/año
TOTAL: ~$55/mes
```

### Escenario Optimista (10,000 usuarios activos)
```
Infraestructura:
- Vercel Team: $20/mes por seat (2-3 seats = $40-60)
- Supabase Team: $599/mes (160GB DB, 5TB transfer)
  * O Railway Pro: $50-100/mes
- Redis: $30/mes
- CDN (Cloudflare): $20/mes
- Monitoring (Sentry): $26/mes
- Email (SendGrid): $20/mes
TOTAL: ~$735/mes

Alternativa más económica:
- VPS dedicado (Hetzner): $50/mes
- PostgreSQL managed: $100/mes
- Otros servicios: $50/mes
TOTAL: ~$200/mes
```

---

## 11. ALTERNATIVAS SIMPLIFICADAS

### Opción "MVP Rápido": Firebase
```typescript
// Implementación más rápida con Firebase
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "autofocus.firebaseapp.com",
  projectId: "autofocus",
});

export const auth = getAuth(app);
export const db = getFirestore(app);

// Tiempo de implementación: ~3-5 días
// Costo inicial: $0
// Escalabilidad: Excelente
// Curva de aprendizaje: Baja
```

### Opción "Sin Backend": Supabase
```typescript
// Setup mínimo con Supabase
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Auth con Google
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "google",
});

// Query de vehículos con RLS automático
const { data: vehicles } = await supabase
  .from("vehicles")
  .select("*, price_history(*)")
  .order("created_at", { ascending: false });

// Tiempo de implementación: ~1 semana
// Costo inicial: $0
// Escalabilidad: Muy buena
// Real-time: Incluido
```

---

## 12. RECOMENDACIÓN FINAL

**Para AutoFocus, recomiendo la siguiente arquitectura:**

### Stack Recomendado:
1. **Frontend**: Next.js 14 (mantener actual)
2. **Backend**: Next.js API Routes con Prisma
3. **Base de Datos**: PostgreSQL (via Supabase)
4. **Autenticación**: NextAuth.js v5
5. **Hosting**: Vercel (Free → Pro según crezca)

### Justificación:
- **Mínimo cambio de stack**: Solo agregar backend APIs
- **TypeScript end-to-end**: Seguridad de tipos
- **Migración gradual**: Puede coexistir localStorage + API
- **Costo inicial bajo**: $0-5/mes para empezar
- **Escalabilidad comprobada**: Hasta 10K+ usuarios sin problemas
- **Developer Experience**: Excelente DX con Prisma + NextAuth

### Proyección de Almacenamiento Final:

| Usuarios | Vehículos/User | Registros/Veh | Tamaño DB | Costo/Mes |
|----------|----------------|---------------|-----------|-----------|
| 10       | 100           | 100           | ~15 MB    | $0        |
| 100      | 100           | 100           | ~150 MB   | $0        |
| 1,000    | 100           | 100           | ~1.5 GB   | $5        |
| 10,000   | 100           | 100           | ~15 GB    | $25-40    |
| 10,000   | 1,000         | 100           | ~150 GB   | $100-200  |

### Timeline Estimado:
- **MVP funcional**: 4 semanas
- **Con todas las features**: 6-7 semanas
- **Production-ready con optimizaciones**: 8 semanas

---

## 13. PRÓXIMOS PASOS

1. **Decidir stack**: PostgreSQL + Prisma vs Firebase vs Supabase
2. **Configurar repositorio**: Branches, CI/CD
3. **Setup de base de datos**: Crear instancia, aplicar migraciones
4. **Implementar auth**: Google + Email/Password
5. **Migrar componente por componente**: De localStorage a API
6. **Testing exhaustivo**: Migración, auth, CRUD
7. **Deploy a staging**: Testear en ambiente real
8. **Deploy a producción**: Con migration banner para usuarios existentes

---

## CONCLUSIÓN

El sistema de usuarios propuesto transforma AutoFocus de una aplicación local a una plataforma multi-usuario completa, manteniendo la simplicidad y eficiencia que la caracterizan. La arquitectura recomendada (Next.js + Prisma + PostgreSQL + NextAuth) ofrece el mejor balance entre:

- ✅ Facilidad de implementación
- ✅ Costos controlados
- ✅ Escalabilidad futura
- ✅ Developer experience
- ✅ Migración sin fricción para usuarios existentes

El almacenamiento proyectado muestra que incluso con 10,000 usuarios y uso intensivo (1000 vehículos con 100 registros históricos cada uno), el costo se mantiene razonable (~$100-200/mes) y manejable.
