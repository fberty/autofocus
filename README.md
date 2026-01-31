# AutoFocus - Dashboard de Análisis del Mercado Automotor

Sistema web para análisis del mercado automotor con vista tabular, filtros avanzados, **integración con MercadoLibre**, edición manual de registros y persistencia de histórico de precios.

## 🚀 Características Principales

### 🛒 Integración con MercadoLibre
- **Búsqueda directa**: Busca vehículos en MercadoLibre desde la aplicación
- **Carga por URL**: Pega el enlace de una publicación y extrae automáticamente todos los datos
- **Extracción automática**: Marca, modelo, año, kilometraje, precio, ubicación y vendedor
- **Metadata completa**: Guarda el enlace, thumbnail y datos del vendedor
- **Sincronización**: Mantén el vínculo con la publicación original

### 📊 Vista Tabular
- Tabla clara y ordenada con separación visual entre vehículos 0 km y usados
- Ordenamiento por marca, modelo, año, kilometraje y precio
- Interfaz minimalista y data-driven
- Indicador de fuente (Manual / MercadoLibre)

### 🔍 Filtros Avanzados
- Filtrado por marca y modelo
- Rango de años (desde/hasta)
- Rango de kilometraje (desde/hasta)
- Rango de precios (desde/hasta)
- Separación por condición (0 km / usado / todos)

### ✏️ Gestión de Datos
- **3 formas de agregar vehículos**:
  1. Manual: Ingreso tradicional de datos
  2. Búsqueda MercadoLibre: Busca y selecciona publicaciones
  3. URL MercadoLibre: Pega el enlace y carga automáticamente
- Edición completa de registros existentes
- Eliminación de vehículos con confirmación
- Enlace directo a publicación de MercadoLibre (cuando aplica)

### 📈 Historial de Precios
- Registro automático de cambios de precio
- Visualización de evolución de precios por vehículo
- Cálculo de variaciones absolutas y porcentuales
- Notas y timestamps para cada cambio
- Diferenciación entre precios manuales y de MercadoLibre

### 💾 Persistencia Total
- Almacenamiento local en el navegador (localStorage)
- **Todos los datos persisten permanentemente**:
  - Información del vehículo
  - Metadata de MercadoLibre
  - Historial completo de precios
  - Enlaces y thumbnails
- Los datos NO se pierden al cerrar, recargar o reiniciar
- No requiere backend ni base de datos externa

### 🌙 Modo Oscuro
- Toggle automático entre modo claro y oscuro
- Detección de preferencia del sistema
- Persistencia de preferencia del usuario

## Tecnologías

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **TailwindCSS** - Estilos utilitarios
- **Lucide React** - Iconos modernos
- **date-fns** - Manejo de fechas

## Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Ejecutar en producción
npm start
```

## 📖 Uso

### Agregar Vehículos

Click en **"Agregar Vehículo"** y selecciona una opción:

1. **Manual**: 
   - Ingresa marca, modelo, año, kilometraje y precio manualmente
   - Ideal para vehículos que no están en MercadoLibre

2. **Buscar en MercadoLibre**:
   - Escribe lo que buscas (ej: "Toyota Corolla 2020")
   - Navega los resultados con imágenes y precios
   - Click en "Agregar" en el vehículo deseado
   - Los datos se cargan automáticamente
   - Puedes editarlos antes de guardar

3. **Desde URL**:
   - Copia el enlace completo de una publicación de MercadoLibre
   - Pégalo en el campo de URL
   - Click en "Cargar Vehículo"
   - Todos los datos se extraen automáticamente
   - Revisa y guarda

### Otras Funciones

- **Filtrar**: Usa los controles de filtro en la barra superior
- **Ordenar**: Click en los encabezados de columna
- **Ver historial**: Click en el ícono 🕐 para ver evolución de precios
- **Editar**: Click en el ícono ✏️ para modificar datos
- **Ver en ML**: Si el vehículo viene de MercadoLibre, verás un enlace directo
- **Eliminar**: Click en el ícono 🗑️ (requiere confirmación)
- **Modo oscuro**: Toggle en el header (🌙/☀️)

## 📁 Estructura del Proyecto

```
autofocus/
├── app/
│   ├── globals.css                 # Estilos globales + modo oscuro
│   ├── layout.tsx                  # Layout principal
│   └── page.tsx                    # Página principal con integración ML
├── components/
│   ├── FilterBar.tsx               # Barra de filtros
│   ├── VehicleTable.tsx            # Tabla de vehículos
│   ├── VehicleModal.tsx            # Modal de edición/creación
│   ├── PriceHistoryModal.tsx       # Modal de historial de precios
│   ├── DarkModeToggle.tsx          # Toggle de modo oscuro
│   ├── MercadoLibreSearch.tsx      # Búsqueda en MercadoLibre
│   └── MercadoLibreUrlInput.tsx    # Carga desde URL de ML
├── lib/
│   ├── storage.ts                  # Capa de persistencia (localStorage)
│   ├── mercadolibre.ts             # Integración con API de MercadoLibre
│   └── utils.ts                    # Utilidades (formateo)
└── types/
    └── index.ts                    # Definiciones de tipos + ML metadata
```

## 🗄️ Modelo de Datos

### Vehicle
```typescript
{
  id: string;
  marca: string;
  modelo: string;
  año: number;
  kilometraje: number;
  precio: number;
  condicion: '0km' | 'usado';
  source: 'manual' | 'mercadolibre';      // Nueva: fuente del vehículo
  mercadolibre?: MercadoLibreData;        // Nueva: metadata de ML
  createdAt: string;
  updatedAt: string;
  priceHistory: PriceHistoryEntry[];
}
```

### MercadoLibreData (Nuevo)
```typescript
{
  itemId: string;              // ID de la publicación (ej: MLA123456)
  url: string;                 // URL completa de la publicación
  title: string;               // Título original de la publicación
  thumbnail?: string;          // URL de la imagen
  seller?: {
    id: number;
    nickname: string;
  };
  location?: {
    city: string;
    state: string;
  };
  permalink?: string;          // Enlace permanente
  lastSync?: string;           // Última sincronización
}
```

### PriceHistoryEntry
```typescript
{
  id: string;
  price: number;
  date: string;
  notes?: string;              // Incluye fuente (Manual/MercadoLibre)
}
```

## 🔌 Integración con MercadoLibre API

La aplicación utiliza la **API pública de MercadoLibre** para:

- Buscar vehículos en la categoría "Autos, Motos y Otros"
- Obtener detalles completos de publicaciones
- Extraer atributos estructurados (marca, modelo, año, km)
- Mantener enlaces a publicaciones originales

**No requiere autenticación** - usa endpoints públicos de solo lectura.

### Endpoints Utilizados

- `GET /sites/MLA/search` - Búsqueda de vehículos
- `GET /items/{item_id}` - Detalles de publicación

### Extracción de Datos

La aplicación extrae automáticamente:
- **Marca**: Atributo `BRAND`
- **Modelo**: Atributo `MODEL`
- **Año**: Atributo `VEHICLE_YEAR`
- **Kilometraje**: Atributo `KILOMETERS`
- **Precio**: Campo `price`
- **Condición**: Campo `condition` (new → 0km, used → usado)
- **Ubicación**: Ciudad y provincia
- **Vendedor**: Nickname e ID

## 💡 Características de UI/UX

- **Minimalista**: Sin elementos innecesarios, enfoque en los datos
- **Responsive**: Adaptable a diferentes tamaños de pantalla
- **Accesible**: Controles claros y feedback visual
- **Rápida**: Filtrado y ordenamiento en tiempo real
- **Intuitiva**: Flujo de trabajo natural y predecible
- **Modo oscuro**: Tema completo con transiciones suaves
- **Menú contextual**: Dropdown con 3 opciones de carga

## 🔒 Privacidad y Datos

- **100% local**: Todos los datos se guardan en tu navegador
- **Sin servidor**: No se envían datos a ningún backend
- **Sin tracking**: No hay analytics ni cookies de terceros
- **Portátil**: Exporta/importa tus datos cuando quieras

## 📝 Licencia

MIT
