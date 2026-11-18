# Pricing compartido: guía rápida

Código que usan **Tarifas y Cotizaciones**, y componentes de pantalla reutilizables en todo pricing (por ejemplo,
`Panel` / `SectionHeader`). Ninguno de esos módulos importa al otro; ambos dependen solo de aquí.
Importar siempre por el barrel: `import { ... } from "@/features/pricing/shared";`

```
shared/
├─ api/
│  ├─ metodos.ts         ← catálogo de métodos de tarifa (createCatalogo)
│  ├─ proveedores.ts     ← proveedores (paginado completo)
│  ├─ clientes.ts        ← clientes
│  └─ tarifa-rangos.ts   ← SOLO lectura de rangos (las mutaciones están en tarifas/api/tarifa-rangos.ts)
├─ hooks/
│  ├─ use-catalogos-pricing.ts ← carga y normaliza los catálogos generales ({ value, label } + camel/snake)
│  └─ use-permisos-pricing.ts  ← PERMISOS: usePermisosPricing(OPCION_PERMISOS.<pantalla>) (ver abajo)
├─ lib/
│  ├─ formatos.ts        ← conAmbosFormatos
│  ├─ nombres.ts         ← normalizarNombre / esNombre: decisiones por nombre de catálogo (NOMBRE_TRANSPORTE...)
│  └─ vigencia-metodo.ts ← getEstadoMetodo (vencida / próxima a vencer)
└─ components/
   ├─ combobox-opcion.tsx ← ComboboxOpcion: Combobox (@/shared, en memoria) con valor objeto ↔ string, "x" para
   │                        limpiar; selects de Tarifas y de la cabecera de Cotizaciones. Búsqueda en servidor:
   │                        AsyncComboboxInput
   ├─ ficha-resumen.tsx  ← FichaResumen (lee sus propios catálogos; funciona dentro o fuera de cualquier provider)
   ├─ panel-dashboard.tsx ← Panel (contenedor con borde y sombra), SectionHeader (ícono, título, subtítulo y
   │                        acción) y MensajeVacio. Copia propia de wms-hn (mismo markup); hoy los usa Reportes
   └─ resumen-item.tsx
└─ calculadora-embarque/  ← CALCULADORA DE EMBARQUES (corporativa, ver abajo)
   ├─ constantes.ts       ← TIPO_TRANSPORTE (49/50/51), TIPOS_TRANSPORTE, UNIDAD_DEFAULT (165/162)
   ├─ calculos.ts         ← volumen, peso, volumétrico por transporte, CW, totales (funciones puras)
   ├─ etiquetas.ts        ← textos por tipo de transporte (base + solo lo que cambia)
   ├─ unidades.ts         ← filtro y normalización de unidades de medida/peso
   ├─ use-unidades-embarque.ts ← unidades para la calculadora (misma consulta que useCatalogosPricing)
   └─ calculadora-medidas.tsx  ← CalculadoraMedidas (diálogo)
```

**Regla:** aquí entra (1) lo que usan ambos módulos o (2) componentes de pantalla reutilizables en pricing
(paneles, encabezados), en los dos casos **sin depender de ningún submódulo**. Lógica que usa un submódulo
solo va en ese submódulo. `shared` nunca importa de `tarifas/`, `cotizacion/`, `reportes/` ni de su propio
`index.ts` (ciclo): dentro de `shared` se usan rutas relativas.

`SectionHeader` (aquí) es el encabezado fijo de un `Panel`. El encabezado que abre y cierra secciones en
Cotización es otro componente: `EncabezadoColapsable` (`cotizacion/calculo/components/utils.tsx`).

## Permisos de botones

Permisos = menú → categoría → opción → acción. La categoría es la pantalla (sale de la ruta) y
`usePermisosCategoria` (`@/features/shell`) recibe el nombre de la **opción**. `usePermisosPricing` lo envuelve:
`OPCION_PERMISOS` tiene el nombre de opción de cada pantalla y devuelve `puedeVer / puedeAgregar / puedeEditar /
puedeEliminar` como booleanos. Solo es interfaz: el backend valida cada request.

| Pantalla          | Categoría             | Opción      | Qué pide cada botón                                                                                                  |
| ----------------- | --------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------- |
| Tarifas           | Tarifas               | Servicios   | Agregar: nueva, copiar, alta de método y filas · Editar: actualizar, editar filas · Eliminar: anular, eliminar filas |
| Cotizaciones      | Cotizaciones          | Información | Agregar: nuevo, nuevo cálculo, guardar versión · Editar: cabecera, activar versión · Autorizar: pendiente (#104)     |
| Autorización SPOT | Manejo de Tarifa SPOT | Información | Editar: autorizar y rechazar (la categoría no tiene acción Autorizar)                                                |
| Plantillas        | Tarifario de clientes | Lista       | Agregar: nueva · Editar: guardar, rubros · Eliminar: eliminar                                                        |
| Carga masiva      | Carga Masiva de Flete | Información | Agregar: enviar                                                                                                      |

Los componentes que se usan en otras pantallas no leen permisos solos: la pantalla los lee y los pasa por props
(con `true` por defecto) o, en Tarifas, por `PermisosTarifasProvider` (sin provider se permite todo).

## Calculadora de embarques

`CalculadoraMedidas` funciona en cualquier pantalla, dentro o fuera de cualquier provider: lee sus unidades con
`useUnidadesEmbarque()` (no se pasan catálogos por props) y devuelve el resultado en `onAplicar`.

```tsx
<CalculadoraMedidas
  trigger={<Button>Abrir calculadora</Button>}   // o controlarla con open / onOpenChange
  codTipoTransporte={codTipoTransporte}          // cambia el volumétrico y los textos
  dimensiones={filasGuardadas}                   // opcional
  pesoInicial={peso} volumenInicial={volumen}    // opcional: totales escritos a mano
  onAplicar={({ dimensiones, totales }) => ...}  // cada módulo decide dónde guardar
/>
```

| Es de la calculadora (aquí)                                                                                    | Es de cada módulo (fuera de aquí)                                                                   |
| -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Conversiones de longitud y peso, volumétrico por transporte (aéreo /6000, marítimo CBM×1000, terrestre m³×333) | Leer filas guardadas en BD (`cotdetdim_*`) → `cotizacion/calculo/lib/dimensiones-cotizacion.ts`     |
| CW = mayor entre peso y volumétrico; redondeo a 0 decimales                                                    | Dónde se guarda el resultado (`valor_cw`, `valor_por_peso`, `total_*`) → `use-criterios-cotizacion` |
| Prioridad filas > total escrito a mano (`combinarTotales`)                                                     | Payload de guardado y fila "falsa" de totales directos → `guardar-version.ts`                       |
| Unidades por defecto 165/162 y textos por transporte                                                           | El botón que la abre (texto, ícono, dónde está)                                                     |

Textos propios de un transporte: agregar solo la propiedad que cambia en `ETIQUETAS_POR_TRANSPORTE` (`etiquetas.ts`).

React Query comparte la caché: `useCatalogosTarifas`, `useCatalogosCotizacion` y `FichaResumen` piden las mismas
consultas con los mismos parámetros, así que no se repiten llamadas al backend.
