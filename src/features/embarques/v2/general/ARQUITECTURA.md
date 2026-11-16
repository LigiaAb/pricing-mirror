# Embarques v2 · Vista general (maqueta)

**Estado: solo maquetado.** No hay API ni lógica: datos de `lib/datos-maqueta.ts`, botones deshabilitados y
campos de solo lectura. La funcionalidad se agrega después sin cambiar la estructura.

## Pantalla (`components/VistaGeneral.tsx`)

1. **Tabla de embarques** — `embarques-table.tsx` (`DataTable`, mismo patrón que Cotizaciones).
2. **Resumen del seleccionado** (siempre visible) — `resumen-embarque.tsx`: franja con file/estado,
   botones **Documentos** (va a la tab Documentos), **Actividades** (Sheet de detalle) y **Tracking**
   (Sheet del tracking interactivo), datos breves y el
   **tracking general** de 6 pasos (`tracking-general.tsx`, solo visual).
3. **Tabs de gestión** — `tabs-embarque.tsx` (tabs verticales como `TarifasTabs`). Cada tab es un
   componente en `components/pasos/`.
4. **Sheet de tracking interactivo** — `tracking-sheet.tsx`. **Reservado solo para el componente
   existente** (lo coloca el equipo): se pasa por la prop `trackingInteractivo` de `VistaGeneral` (o se
   importa dentro del Sheet). Sin él muestra solo un aviso. No agregar otro contenido aquí.
5. **Sheet de actividades** — `detalle-actividades-sheet.tsx`: detalle del Excel por paso y área,
   independiente del tracking interactivo.

## Dónde vive cada cosa

| Qué                                   | Dónde                                    |
| ------------------------------------- | ---------------------------------------- |
| Pasos del tracking (6) y de las tabs  | `lib/pasos.ts` (definición única)        |
| Tipos (`PerfilEmbarque`, embarque)    | `lib/tipos.ts`                           |
| Datos de ejemplo (borrar con la API)  | `lib/datos-maqueta.ts`                   |
| Piezas reutilizables (sección, dato…) | `components/utils.tsx`                   |
| Tipos de interacción (9)              | `lib/interacciones.ts`                   |
| Cómo se trabaja cada actividad        | `lib/gestion-actividades.ts`             |
| Tarjeta genérica de una actividad     | `components/tarjeta-actividad.tsx`       |
| Tab genérica (todas las del flujo)    | `components/pasos/paso-actividades.tsx`  |
| Tabs con contenido propio             | `pasos/paso-informacion.tsx`, `paso-documentos.tsx` |

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
- las tabs (cada actividad es una tarjeta con su formulario, ver abajo);
- el Sheet de actividades (`detalle-actividades-sheet.tsx`), por paso y área.

Si otras operaciones tienen otros pasos, `TRACKING_PASOS` y las actividades pasan a depender del tipo de
operación.

## Tabs: actividades generalizadas

Las tabs cubren **las 69 actividades** de la hoja *Detalle original*, cada una en **exactamente una** tab
(`PASOS_EMBARQUE[].actividades`, en el orden en que se trabajan). En la lista lateral se agrupan por paso del
tracking (`1 · Reserva`, `2 · Documentación`…); la tab muestra check si su paso ya pasó y un punto si es el actual.

| Paso | Tab                    | Actividades                                         |
| ---- | ---------------------- | --------------------------------------------------- |
| —    | Información            | —                                                   |
| 1    | Recolección y empaque  | OPS 0.1–0.5, Bodega 0.1–0.5 (opcionales)            |
| 1    | Asignación de guías    | OPS 1.1–1.3                                         |
| 1    | Reservas               | OPS 2.1, 2.2, 3.1, 3.2                              |
| 2    | Draft y preaviso       | OPS 4.1, 4.2, 4.3                                   |
| 2    | Gestión aduanera       | OPS 5.1–5.4, CBX E1                                 |
| 3    | Recepción en bodega    | Bodega 7.1–7.5, E1, E2                              |
| 3    | Liberación y despacho  | OPS 6.1, Bodega 7.6–7.9                             |
| 4    | Recepción en COMBEX    | CBX 8.1–8.5                                         |
| 4    | Guía final             | OPS 9.1, 9.3, 9.4, 9.5, E2                          |
| 4    | Tarifas y cargos       | OPS 9.2                                             |
| 4    | Documentación final    | CBX 10.1–10.5                                       |
| 5    | Despacho y salida      | CBX 11.1, 12.1, 12.3, 12.4, E2, E3, E4; OPS E1      |
| 5    | Complementaria         | CBX 12.2, 13.1, 13.2                                |
| 6    | Arribo y cierre        | CBX 14.1; OPS 15, 16, 17                            |
| —    | Documentos (extra)     | —                                                   |
| —    | Cancelación (extra)    | OPS 4.4                                             |

### Tipos de interacción (`lib/interacciones.ts`)

Cada actividad se trabaja con uno de 9 tipos; todos se ven con la misma tarjeta. **Son de uso interno: el
nombre del tipo no se muestra al usuario** (solo define icono, campos base y botón). En pantalla no usar
términos técnicos: el usuario ve la actividad, sus campos y el botón con la acción.

| Tipo            | Para qué                                     | Campos base                                  |
| --------------- | -------------------------------------------- | -------------------------------------------- |
| Formulario      | Registro de datos                            | Observaciones                                |
| Dato especial   | Peso, medidas, correlativo vs. referencia    | — (los de la actividad + comparación)        |
| Confirmación    | Verificar y dejar constancia                 | Fecha y hora, Confirmado por                 |
| Correo          | Aviso a cliente, destino o proveedor         | Destinatarios, Asunto, Fecha de envío, Adjuntos |
| Orden de compra | OC del embarque                              | Proveedor, No. OC, Monto, Moneda             |
| Documento       | Generar, emitir o imprimir                   | Fecha                                        |
| Evidencia       | Fotografías                                  | Fotografías                                  |
| Seguimiento     | Trámite hasta que concluye                   | Estado, Fecha, Observaciones                 |
| Incidencia      | Excepción con motivo y autorización          | Motivo, Autorizado por, Detalle              |

### Gestión de cada actividad (`lib/gestion-actividades.ts`)

`GESTION_ACTIVIDADES["<id>"]`: `interaccion`, `campos` propios (van antes de los base), `accion` (texto del
botón), `compara` (referencia del control del Excel: muestra la referencia, "Actual" y "Diferencia"), `requiere`
(actividades previas, se muestran como "Antes: <actividad>") y `pendiente` (parte aún sin maquetar, p. ej. la tabla de rubros de OPS 9.2).

### Tarjeta (`components/tarjeta-actividad.tsx`) y tab genérica (`pasos/paso-actividades.tsx`)

Tarjeta: encabezado (icono, código, actividad, responsable, tipo del Excel, estado), cuerpo (entrada,
actividades previas, comparación, campos) y pie (control, resultado y botón). Estado de maqueta según el paso
del embarque: Hecha / En curso / Pendiente; las excepciones dicen "Solo si aplica".

Tab genérica: encabezado (título y descripción), aviso (si la tab lo define), actividades agrupadas por
proceso y **Excepciones** aparte, plegadas.

### Agregar o mover algo

- Mover una actividad de tab: cambiar su id de lista en `PASOS_EMBARQUE`.
- Agregar una tab: 1 entrada en `PASOS_EMBARQUE` + su icono en `ICONOS` de `tabs-embarque.tsx`.
- Cambiar cómo se captura una actividad: su entrada en `GESTION_ACTIVIDADES`.
- Un campo nuevo para todo un tipo: `base` del tipo en `INTERACCIONES`.

## Perfiles: Operaciones, Bodegas, Combex

`VistaGeneral` recibe `perfil` (por defecto `"operaciones"`). Las tabs que ve cada perfil salen de sus
actividades (`perfilesDeTab`): Operaciones (coordina el file) ve todas; Bodegas y Combex ven las tabs con
actividades de su área (`PERFIL_DE_RESPONSABLE`: OPS → operaciones, Bodega → bodegas, CBX → combex), más
Información y Documentos. Es una propuesta a ajustar cuando se definan esas pantallas. Las carpetas `v2/bodegas` y `v2/combex` pueden montar `VistaGeneral` con su
perfil y agregar sus propias tabs.

**Facturación** (solo visualización): en pausa. Cuando se retome, sería otra entrada `grupo: "extra"` en
`PASOS_EMBARQUE`, de solo lectura.
