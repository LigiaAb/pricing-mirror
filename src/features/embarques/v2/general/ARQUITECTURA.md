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

## Tracking general (Exportación Aérea)

Fuente: `Tracking-Expo-Aereo-6Pasos.xlsx` (hoja *Tracking 6 pasos*). Cada paso tiene nombre corto, nombre
consolidado, alcance (tooltip) y áreas responsables (OPS, Bodega, CBX):

1. **Reserva** — Coordinación y reserva (OPS, Bodega)
2. **Documentación** — Documentación y gestión aduanera (OPS, CBX)
3. **Bodega** — Liberación y despacho de bodega (OPS, Bodega)
4. **COMBEX** — Recepción en COMBEX y documentación final (OPS, CBX)
5. **Salida** — Despacho, salida aérea y complementaria (OPS, CBX)
6. **Cierre** — Arribo y cierre de la operación (OPS, CBX)

### Actividades (qué paso original va en cada paso)

`lib/actividades-tracking.ts` (`ACTIVIDADES_TRACKING`) es la hoja *Detalle original*: 69 actividades con
paso nuevo, responsable, código original, proceso, entrada, actividad, resultado, tipo
(Principal/Opcional/Condicional/Excepción/Transversal) y control. Cuadra con la hoja *Tracking 6 pasos*.
El `id` es `"<responsable> <código>"` (ej. `"OPS 4.1"`, `"Bodega 0.1"`) porque los códigos se repiten entre
áreas. Se usa en:

- el tracking general (cantidad de actividades por paso);
- cada tab (lista "Actividades del tracking");
- el Sheet de tracking, mientras no se conecte el componente existente (actividades por paso y área).

Si otras operaciones tienen otros pasos, `TRACKING_PASOS` y las actividades pasan a depender del tipo de
operación.

## Tabs actuales

Flujo: Información · Asignación de guías · Reservas (solicitud y confirmación) · Draft (elaboración y envío) ·
Tarifas (confirmación de cotización). Separadas al final: **Documentos** (disponible en cualquier paso) y
**Cancelación / anulación** (opcional).

Cada tab lista en `actividades` los ids del Excel que trabaja; su paso sale de ahí (`pasoDeTab`):

| Tab          | Actividades                         | Paso |
| ------------ | ----------------------------------- | ---- |
| Guías        | OPS 1.1, 1.2, 1.3                   | 1    |
| Reservas     | OPS 2.1, 2.2, 3.1, 3.2              | 1    |
| Draft        | OPS 4.1 (draft), 4.2 (preaviso)     | 2    |
| Tarifas      | OPS 9.2 (confirmar tarifas y gastos)| 4    |
| Cancelación  | OPS 4.4 (anulación, excepción)      | —    |

La tab se marca con check cuando el embarque ya pasó ese paso.

Agregar una tab = 1 entrada en `PASOS_EMBARQUE` + su componente en `pasos/` + su `case` e icono en
`tabs-embarque.tsx`.

## Perfiles: Operaciones, Bodegas, Combex

`VistaGeneral` recibe `perfil` (por defecto `"operaciones"`). Cada paso declara en `perfiles` qué pantallas
lo ven (`pasosDelPerfil`). Hoy Bodegas y Combex solo ven Información y Documentos: es una propuesta a ajustar
cuando se definan esas pantallas. Las carpetas `v2/bodegas` y `v2/combex` pueden montar `VistaGeneral` con su
perfil y agregar sus propias tabs.

**Facturación** (solo visualización): en pausa. Cuando se retome, sería otra entrada `grupo: "extra"` en
`PASOS_EMBARQUE`, de solo lectura.
