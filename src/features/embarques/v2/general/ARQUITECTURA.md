# Embarques v2 · Vista general (maqueta)

**Estado: solo maquetado.** No hay API ni lógica: datos de `lib/datos-maqueta.ts`, botones deshabilitados y
campos de solo lectura. La funcionalidad se agrega después sin cambiar la estructura.

## Pantalla (`components/VistaGeneral.tsx`)

1. **Tabla de embarques** — `embarques-table.tsx` (`DataTable`, mismo patrón que Cotizaciones).
2. **Resumen del seleccionado** (siempre visible) — `resumen-embarque.tsx`: franja con file/estado,
   botones **Documentos** (va a la tab Documentos) y **Tracking** (abre el Sheet), datos breves y el
   **tracking general** de 6 pasos (`tracking-general.tsx`, solo visual).
3. **Tabs de gestión** — `tabs-embarque.tsx` (tabs verticales como `TarifasTabs`). Cada tab es un
   componente en `components/pasos/`.
4. **Sheet de tracking interactivo** — `tracking-sheet.tsx`. El componente existente se pasa por la prop
   `trackingInteractivo` de `VistaGeneral` (o se importa dentro del Sheet cuando se conecte).

## Dónde vive cada cosa

| Qué                                   | Dónde                                    |
| ------------------------------------- | ---------------------------------------- |
| Pasos del tracking (6) y de las tabs  | `lib/pasos.ts` (definición única)        |
| Tipos (`PerfilEmbarque`, embarque)    | `lib/tipos.ts`                           |
| Datos de ejemplo (borrar con la API)  | `lib/datos-maqueta.ts`                   |
| Piezas reutilizables (sección, dato…) | `components/utils.tsx`                   |
| Contenido de cada tab                 | `components/pasos/paso-<nombre>.tsx`     |

## Tabs actuales

Flujo: Información · Asignación de guías · Reservas (solicitud y confirmación) · Draft (elaboración y envío) ·
Tarifas (confirmación de cotización). Separadas al final: **Documentos** (disponible en cualquier paso) y
**Cancelación / anulación** (opcional).

Agregar una tab = 1 entrada en `PASOS_EMBARQUE` + su componente en `pasos/` + su `case` e icono en
`tabs-embarque.tsx`.

## Perfiles: Operaciones, Bodegas, Combex

`VistaGeneral` recibe `perfil` (por defecto `"operaciones"`). Cada paso declara en `perfiles` qué pantallas
lo ven (`pasosDelPerfil`). Hoy Bodegas y Combex solo ven Información y Documentos: es una propuesta a ajustar
cuando se definan esas pantallas. Las carpetas `v2/bodegas` y `v2/combex` pueden montar `VistaGeneral` con su
perfil y agregar sus propias tabs.

**Facturación** (solo visualización): en pausa. Cuando se retome, sería otra entrada `grupo: "extra"` en
`PASOS_EMBARQUE`, de solo lectura.
