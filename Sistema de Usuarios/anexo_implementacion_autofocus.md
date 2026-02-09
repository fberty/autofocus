# Anexo: Diagramas y Ejemplos de Implementación
## Sistema de Usuarios para AutoFocus

---

## 1. DIAGRAMAS DE ARQUITECTURA

### 1.1 Arquitectura Actual vs Propuesta

```
ARQUITECTURA ACTUAL:
┌─────────────────────────────────────┐
│         Next.js Frontend            │
│  ┌──────────────────────────────┐  │
│  │   React Components           │  │
│  │   - VehicleTable             │  │
│  │   - FilterBar                │  │
│  │   - VehicleModal             │  │
│  └──────────────────────────────┘  │
│               ↕                     │
│  ┌──────────────────────────────┐  │
│  │   localStorage               │  │
│  │   vehicles: []               │  │
│  └──────────────────────────────┘  │
│               ↕                     │
│  ┌──────────────────────────────┐  │
│  │   MercadoLibre API           │  │
│  │   (búsqueda pública)         │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘

ARQUITECTURA PROPUESTA:
┌─────────────────────────────────────────────────────────┐
│                  Next.js Application                     │
│                                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Frontend (Client)                    │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  React Components + NextAuth Client        │  │  │
│  │  │  - AuthGuard, LoginPage                    │  │  │
│  │  │  - VehicleTable, FilterBar                 │  │  │
│  │  │  - MigrationBanner                         │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │               ↕ (React Query)                    │  │
│  └──────────────────────────────────────────────────┘  │
│                    ↕                                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │           Backend (API Routes)                    │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  NextAuth.js + Middleware                  │  │  │
│  │  │  /api/auth/[...nextauth]                   │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Vehicle APIs                              │  │  │
│  │  │  - GET/POST /api/vehicles                  │  │  │
│  │  │  - GET/PATCH/DELETE /api/vehicles/[id]     │  │  │
│  │  │  - POST /api/migrate                       │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  │               ↕ (Prisma)                         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │  users   │  │ vehicles │  │  price_history       │ │
│  └──────────┘  └──────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                      ↕
┌─────────────────────────────────────────────────────────┐
│              External Services                           │
│  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │  Google OAuth    │  │  MercadoLibre API        │   │
│  └──────────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Flujo de Autenticación

```
┌──────────┐
│  Usuario │
└────┬─────┘
     │
     │ 1. Visita /
     ↓
┌────────────────┐
│   Middleware   │
│ (sin sesión)   │
└────┬───────────┘
     │
     │ 2. Redirect a /auth/signin
     ↓
┌──────────────────────────────┐
│   Página de Login            │
│  ┌────────┐  ┌────────────┐ │
│  │ Google │  │ Email/Pass │ │
│  └────┬───┘  └─────┬──────┘ │
└───────┼────────────┼─────────┘
        │            │
        │ 3a. OAuth  │ 3b. Credentials
        ↓            ↓
┌────────────────────────────────────┐
│       NextAuth Handler             │
│   /api/auth/[...nextauth]          │
│                                    │
│  - Valida credenciales             │
│  - Crea/busca usuario en DB        │
│  - Genera JWT token                │
└────────────┬───────────────────────┘
             │
             │ 4. Token + Cookie
             ↓
┌──────────────────────────┐
│  Usuario autenticado     │
│  Redirect a /            │
└──────┬───────────────────┘
       │
       │ 5. Requests con session
       ↓
┌───────────────────────────┐
│   API Routes protegidas   │
│   - Verifica JWT          │
│   - Filtra por userId     │
│   - Responde data         │
└───────────────────────────┘
```

### 1.3 Flujo de Datos: CRUD de Vehículos

```
CREATE:
Usuario → VehicleModal → useCreateVehicle hook → POST /api/vehicles
                                                        ↓
                                                  Prisma.create()
                                                        ↓
                                                  PostgreSQL
                                                        ↓
                                        React Query invalidateQueries
                                                        ↓
                                              UI se actualiza

READ:
Usuario → FilterBar → useVehicles(filters) → GET /api/vehicles?marca=...
                                                        ↓
                                                  Prisma.findMany()
                                                        ↓
                                                  PostgreSQL
                                                        ↓
                                               React Query cache
                                                        ↓
                                               VehicleTable render

UPDATE:
Usuario → EditIcon → VehicleModal → useUpdateVehicle → PATCH /api/vehicles/[id]
                                                              ↓
                                                  Prisma.update() + history
                                                              ↓
                                                        PostgreSQL
                                                              ↓
                                              React Query invalidate
                                                              ↓
                                                   UI se actualiza

DELETE:
Usuario → DeleteIcon → Confirm → useDeleteVehicle → DELETE /api/vehicles/[id]
                                                            ↓
                                                    Prisma.delete()
                                                            ↓
                                                      PostgreSQL
                                                            ↓
                                            React Query invalidate
                                                            ↓
                                                 UI se actualiza
```

### 1.4 Esquema de Base de Datos (ER Diagram)

```
┌─────────────────────────┐
│         users           │
├─────────────────────────┤
│ id         UUID PK      │
│ email      VARCHAR(255) │◄───┐
│ name       VARCHAR(255) │    │
│ avatar     TEXT         │    │
│ provider   VARCHAR(50)  │    │
│ created_at TIMESTAMP    │    │
│ updated_at TIMESTAMP    │    │
└─────────────────────────┘    │
                               │
                               │ 1:N
                               │
┌─────────────────────────────┐│
│       user_settings         ││
├─────────────────────────────┤│
│ id            UUID PK       ││
│ user_id       UUID FK       │┘
│ theme         VARCHAR(20)   │
│ notifications BOOLEAN       │
│ created_at    TIMESTAMP     │
│ updated_at    TIMESTAMP     │
└─────────────────────────────┘

┌─────────────────────────────┐
│         vehicles            │
├─────────────────────────────┤
│ id                 UUID PK  │◄───┐
│ user_id            UUID FK  │────┼─── FK a users.id
│ marca              VARCHAR  │    │
│ modelo             VARCHAR  │    │
│ año                INTEGER  │    │
│ kilometraje        INTEGER  │    │
│ precio             DECIMAL  │    │
│ condicion          VARCHAR  │    │
│ source             VARCHAR  │    │
│ mercadolibre_data  JSONB    │    │
│ is_public          BOOLEAN  │    │
│ tags               TEXT[]   │    │
│ created_at         TIMESTAMP│    │
│ updated_at         TIMESTAMP│    │
└─────────────────────────────┘    │
                                   │
                                   │ 1:N
                                   │
┌─────────────────────────────────┐│
│       price_history             ││
├─────────────────────────────────┤│
│ id          UUID PK             ││
│ vehicle_id  UUID FK             │┘
│ user_id     UUID FK             │──── FK a users.id
│ price       DECIMAL             │
│ date        TIMESTAMP           │
│ notes       TEXT                │
│ source      VARCHAR             │
└─────────────────────────────────┘
```

---

## 2. EJEMPLOS DE CÓDIGO COMPLETOS

### 2.1 Schema Prisma Completo

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String    @id @default(uuid())
  email          String    @unique
  name           String?
  avatar         String?
  hashedPassword String?   @map("hashed_password")
  provider       String
  emailVerified  DateTime? @map("email_verified")
  createdAt      DateTime  @default(now()) @map("created_at")
  updatedAt      DateTime  @updatedAt @map("updated_at")

  // Relaciones
  settings     UserSettings?
  vehicles     Vehicle[]
  priceHistory PriceHistory[]
  accounts     Account[]
  sessions     Session[]

  @@map("users")
}

model UserSettings {
  id            String   @id @default(uuid())
  userId        String   @unique @map("user_id")
  theme         String   @default("auto")
  notifications Boolean  @default(true)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}

model Vehicle {
  id                String   @id @default(uuid())
  userId            String   @map("user_id")
  marca             String
  modelo            String
  año               Int
  kilometraje       Int
  precio            Decimal  @db.Decimal(12, 2)
  condicion         String
  source            String
  mercadolibreData  Json?    @map("mercadolibre_data")
  isPublic          Boolean  @default(false) @map("is_public")
  tags              String[]
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  user         User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  priceHistory PriceHistory[]

  @@index([userId])
  @@index([marca])
  @@index([precio])
  @@map("vehicles")
}

model PriceHistory {
  id        String   @id @default(uuid())
  vehicleId String   @map("vehicle_id")
  userId    String   @map("user_id")
  price     Decimal  @db.Decimal(12, 2)
  date      DateTime @default(now())
  notes     String?
  source    String?

  vehicle Vehicle @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id])

  @@index([vehicleId])
  @@index([date(sort: Desc)])
  @@map("price_history")
}

// Modelos de NextAuth
model Account {
  id                String  @id @default(uuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

### 2.2 Configuración de Prisma

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

### 2.3 Layout Principal con Providers

```typescript
// app/layout.tsx
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AutoFocus - Dashboard de Análisis del Mercado Automotor",
  description: "Análisis del mercado automotor con integración a MercadoLibre",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

```typescript
// app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minuto
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
```

### 2.4 Página Principal Protegida

```typescript
// app/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { VehicleDashboard } from "@/components/VehicleDashboard";
import { MigrationBanner } from "@/components/MigrationBanner";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MigrationBanner />
      <VehicleDashboard />
    </div>
  );
}
```

### 2.5 Componente Dashboard (Cliente)

```typescript
// components/VehicleDashboard.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { VehicleTable } from "./VehicleTable";
import { FilterBar } from "./FilterBar";
import { VehicleModal } from "./VehicleModal";
import { useVehicles } from "@/lib/hooks/useVehicles";
import { DarkModeToggle } from "./DarkModeToggle";

export function VehicleDashboard() {
  const { data: session } = useSession();
  const [filters, setFilters] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: vehicles, isLoading } = useVehicles(filters);

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">AutoFocus</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bienvenido, {session?.user?.name || session?.user?.email}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <DarkModeToggle />
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Agregar Vehículo
          </button>
        </div>
      </div>

      {/* Filtros */}
      <FilterBar filters={filters} onFiltersChange={setFilters} />

      {/* Tabla */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando vehículos...</div>
        </div>
      ) : (
        <VehicleTable vehicles={vehicles || []} />
      )}

      {/* Modal */}
      {isModalOpen && (
        <VehicleModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
```

### 2.6 Hook Completo de Vehículos

```typescript
// lib/hooks/useVehicles.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { Vehicle } from "@/types";

interface VehicleFilters {
  marca?: string;
  modelo?: string;
  condicion?: string;
  añoMin?: number;
  añoMax?: number;
  kmMin?: number;
  kmMax?: number;
  precioMin?: number;
  precioMax?: number;
}

// Hook para listar vehículos
export function useVehicles(
  filters?: VehicleFilters,
  options?: UseQueryOptions<Vehicle[]>
) {
  return useQuery({
    queryKey: ["vehicles", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            params.append(key, String(value));
          }
        });
      }

      const response = await fetch(`/api/vehicles?${params}`);
      
      if (!response.ok) {
        throw new Error("Error al cargar vehículos");
      }
      
      return response.json();
    },
    ...options,
  });
}

// Hook para obtener un vehículo específico
export function useVehicle(id: string) {
  return useQuery({
    queryKey: ["vehicle", id],
    queryFn: async () => {
      const response = await fetch(`/api/vehicles/${id}`);
      
      if (!response.ok) {
        throw new Error("Error al cargar vehículo");
      }
      
      return response.json();
    },
    enabled: !!id,
  });
}

// Hook para crear vehículo
export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Vehicle>) => {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al crear vehículo");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

// Hook para actualizar vehículo
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al actualizar vehículo");
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle", variables.id] });
    },
  });
}

// Hook para eliminar vehículo
export function useDeleteVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Error al eliminar vehículo");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

// Hook para migrar desde localStorage
export function useMigrateVehicles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vehicles: Vehicle[]) => {
      const response = await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicles }),
      });

      if (!response.ok) {
        throw new Error("Error en la migración");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}
```

---

## 3. SCRIPTS DE DEPLOYMENT

### 3.1 Script de Setup Inicial

```bash
#!/bin/bash
# scripts/setup.sh

echo "🚀 Setup de AutoFocus con Sistema de Usuarios"

# 1. Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# 2. Instalar dependencias adicionales
echo "📦 Instalando paquetes de autenticación y DB..."
npm install next-auth@beta @auth/prisma-adapter
npm install @prisma/client
npm install @tanstack/react-query
npm install bcryptjs
npm install zod

npm install -D prisma
npm install -D @types/bcryptjs

# 3. Inicializar Prisma
echo "🗄️ Inicializando Prisma..."
npx prisma init

# 4. Crear archivo .env.example
cat > .env.example << 'EOF'
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/autofocus"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Opcional: Rate Limiting
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
EOF

# 5. Generar NEXTAUTH_SECRET
echo "🔐 Generando NEXTAUTH_SECRET..."
SECRET=$(openssl rand -base64 32)
echo ""
echo "Tu NEXTAUTH_SECRET: $SECRET"
echo ""
echo "Copia este secret a tu archivo .env"

# 6. Instrucciones finales
cat << 'EOF'

✅ Setup completado!

Próximos pasos:
1. Copia .env.example a .env y completa las variables
2. Configura tu base de datos PostgreSQL
3. Ejecuta: npx prisma migrate dev --name init
4. Ejecuta: npm run dev

Para producción:
1. Configura variables de entorno en Vercel
2. Conecta tu base de datos (Supabase/Railway)
3. Ejecuta: npx prisma migrate deploy
4. Deploy: vercel --prod

EOF
```

### 3.2 Script de Migración de Datos

```typescript
// scripts/migrate-data.ts
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function migrateLocalData() {
  console.log("🔄 Iniciando migración de datos locales...");

  // Leer archivo de backup de localStorage
  const backupPath = path.join(process.cwd(), "backup-vehicles.json");
  
  if (!fs.existsSync(backupPath)) {
    console.error("❌ No se encontró archivo backup-vehicles.json");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(backupPath, "utf-8"));
  const vehicles = data.vehicles;

  console.log(`📊 Encontrados ${vehicles.length} vehículos para migrar`);

  // Crear usuario de prueba si no existe
  let user = await prisma.user.findUnique({
    where: { email: "admin@autofocus.com" },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "admin@autofocus.com",
        name: "Usuario Admin",
        provider: "email",
      },
    });
    console.log("✅ Usuario admin creado");
  }

  // Migrar vehículos
  let migrated = 0;
  let errors = 0;

  for (const vehicle of vehicles) {
    try {
      await prisma.vehicle.create({
        data: {
          userId: user.id,
          marca: vehicle.marca,
          modelo: vehicle.modelo,
          año: vehicle.año,
          kilometraje: vehicle.kilometraje,
          precio: vehicle.precio,
          condicion: vehicle.condicion,
          source: vehicle.source || "manual",
          mercadolibreData: vehicle.mercadolibre || null,
          createdAt: new Date(vehicle.createdAt),
          updatedAt: new Date(vehicle.updatedAt),
          priceHistory: {
            create: vehicle.priceHistory?.map((entry: any) => ({
              userId: user!.id,
              price: entry.price,
              date: new Date(entry.date),
              notes: entry.notes,
              source: entry.source || "manual",
            })) || [],
          },
        },
      });
      migrated++;
      console.log(`  ✓ Migrado: ${vehicle.marca} ${vehicle.modelo}`);
    } catch (error) {
      errors++;
      console.error(`  ✗ Error: ${vehicle.marca} ${vehicle.modelo}`, error);
    }
  }

  console.log("");
  console.log("🎉 Migración completada!");
  console.log(`  ✅ Exitosos: ${migrated}`);
  console.log(`  ❌ Errores: ${errors}`);

  await prisma.$disconnect();
}

migrateLocalData().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

### 3.3 Comandos NPM

```json
// Agregar a package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "tsx scripts/seed.ts",
    
    "migrate:local": "tsx scripts/migrate-data.ts",
    "setup": "bash scripts/setup.sh"
  }
}
```

---

## 4. TESTING

### 4.1 Tests de API

```typescript
// __tests__/api/vehicles.test.ts
import { GET, POST } from "@/app/api/vehicles/route";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

jest.mock("next-auth");
jest.mock("@/lib/prisma");

describe("/api/vehicles", () => {
  const mockSession = {
    user: { id: "user-123", email: "test@test.com" },
  };

  beforeEach(() => {
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe("GET", () => {
    it("debe retornar vehículos del usuario autenticado", async () => {
      const mockVehicles = [
        {
          id: "1",
          userId: "user-123",
          marca: "Toyota",
          modelo: "Corolla",
          año: 2020,
          kilometraje: 30000,
          precio: 15000,
          condicion: "usado",
        },
      ];

      (prisma.vehicle.findMany as jest.Mock).mockResolvedValue(mockVehicles);

      const request = new Request("http://localhost:3000/api/vehicles");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockVehicles);
      expect(prisma.vehicle.findMany).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        include: expect.any(Object),
        orderBy: expect.any(Object),
      });
    });

    it("debe retornar 401 si no está autenticado", async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/vehicles");
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe("POST", () => {
    it("debe crear un nuevo vehículo", async () => {
      const newVehicle = {
        marca: "Honda",
        modelo: "Civic",
        año: 2021,
        kilometraje: 0,
        precio: 20000,
        condicion: "0km",
      };

      const mockCreated = { id: "2", ...newVehicle, userId: "user-123" };
      (prisma.vehicle.create as jest.Mock).mockResolvedValue(mockCreated);

      const request = new Request("http://localhost:3000/api/vehicles", {
        method: "POST",
        body: JSON.stringify(newVehicle),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe("2");
      expect(data.marca).toBe("Honda");
    });
  });
});
```

---

## 5. MONITOREO Y ANALYTICS

### 5.1 Logging con Pino

```typescript
// lib/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
          },
        }
      : undefined,
});

// Uso en API routes
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    logger.info({ userId: session.user.id }, "Creating vehicle");
    // ...
  } catch (error) {
    logger.error({ error }, "Failed to create vehicle");
    // ...
  }
}
```

### 5.2 Métricas con Prometheus

```typescript
// lib/metrics.ts
import { Counter, Histogram, register } from "prom-client";

export const vehicleCreations = new Counter({
  name: "autofocus_vehicle_creations_total",
  help: "Total number of vehicles created",
  labelNames: ["source"],
});

export const apiDuration = new Histogram({
  name: "autofocus_api_duration_seconds",
  help: "Duration of API requests in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.1, 0.5, 1, 2, 5],
});

// Endpoint de métricas
export async function GET() {
  return new Response(await register.metrics(), {
    headers: { "Content-Type": register.contentType },
  });
}
```

---

Este anexo complementa el informe principal con implementaciones concretas y ejemplos de código listos para usar.
