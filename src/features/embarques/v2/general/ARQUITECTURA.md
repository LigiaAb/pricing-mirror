# Embarques v2 · Vista general (maqueta)

**Estado: solo maquetado.** No hay API ni lógica: datos de `lib/datos-maqueta.ts`, botones deshabilitados y
campos sin guardado (los de las actividades se pueden llenar solo en pantalla; Información se muestra en cards de consulta). La funcionalidad se agrega después sin cambiar la estructura.

## Carpetas de `v2/`

`general/` es **solo la vista general** (tabla, resumen, tracking, tabs y Sheets). Los formularios de las
actividades van en la carpeta de su actor, y lo que usan todos en `shared/`:

| Carpeta        | Qué tiene                                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `general/`     | Vista general: `VistaGeneral`, tabla, resumen, tracking general, tabs, Sheets, Información; operaciones (`lib/operaciones/`, `lib/registro-operaciones.ts`), `lib/pasos.ts` y `lib/datos-maqueta.ts`    |
| `operaciones/` | Formularios de OPS: `lib/gestion-actividades.ts` (`GESTION_OPERACIONES`) y formularios propios (`components/asignacion-guias.tsx`, `components/solicitud-reserva.tsx`)                                  |
| `bodegas/`     | Formularios de Bodega: `lib/gestion-actividades.ts` (`GESTION_BODEGAS`)                                                                                                                                 |
| `combex/`      | Formularios de CBX: `lib/gestion-actividades.ts` (`GESTION_COMBEX`)                                                                                                                                     |
| `shared/`      | Común: tipos, `DefinicionOperacion` (`lib/operacion.ts`) y su contexto, actividades del Excel, tipos de interacción, motor de gestión (`camposDe`, `accionDe`), tarjeta genérica y piezas (`utils.tsx`) |

Dependencias: `general` → actores → `shared`. `shared` no importa de `general` ni de los actores, y un actor
no importa de otro. La definición de cada operación (en `general/`) es la que junta las piezas de los actores.

## Operaciones (transporte × expo/impo)

La vista **no tiene listas fijas**: pasos del tracking, actividades, tabs, responsables y los campos de
Información que dependen del transporte salen de la **operación del embarque seleccionado**. Agregar o cambiar
una operación = editar solo su definición. Las definiciones son la **fuente de verdad** (no hay Excel para todas
las operaciones) y pueden estar a medias mientras llega el análisis.

| Qué                                    | Dónde                                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| Tipo `DefinicionOperacion` y consultas | `shared/lib/operacion.ts` (`actividadesPorId`, `actividadesDelPaso`, …)            |
| Validación de consistencia             | `validarOperacion` en `shared/lib/operacion.ts`                                    |
| Operación del embarque (contexto)      | `OperacionContext` / `useOperacion()` en `shared/components/operacion-context.tsx` |
| Definición de cada operación           | `lib/operaciones/<clave>.ts` (hoy: `aereo-expo.ts`, `AEREO_EXPO`)                  |
| Registro y operación de un embarque    | `lib/registro-operaciones.ts` (`OPERACIONES`, `operacionDeEmbarque`)               |

`DefinicionOperacion`: `clave` (`"<transporte>-<expo|impo>"`), `nombre`, `pasos` (tracking general, ids 1..n),
`actividades` (ids únicos **dentro de la operación**), `tabs` (cada una con su `icono`), `responsables` (por área:
`perfil` y `gestion`), `formularios` (propios por id de actividad) e `informacion` (`rutas`, `fechas`, `producto`
e `iconoRutas`).

- `VistaGeneral` obtiene la operación con `operacionDeEmbarque(seleccionado)` y la entrega con
  `OperacionContext`. Si el embarque es de una operación sin definir, muestra un aviso en lugar del resumen y las
  tabs. La tabla toma los pasos de la operación de cada fila.
- `operacionDeEmbarque` usa hoy el tipo de transporte (`AEREO` → `aereo-expo`). **Pendiente:** el campo del
  backend que dice si es exportación o importación (y, si aplica, FCL/LCL).
- `validarOperacion(definicion)` devuelve la lista de problemas (vacía = consistente): pasos 1..n; responsables de
  pasos y actividades definidos; ids de actividades y tabs únicos; cada actividad con gestión y en exactamente una
  tab; las tabs solo usan ids que existen (Información, Archivos y Bitácora sin actividades); la gestión solo define
  actividades de su área, con `requiere` y `key` existentes; formularios propios y fechas de Información de
  actividades que existen. Correrla al agregar o cambiar una operación (prueba rápida con esbuild + node).

### Agregar una operación

1. `lib/operaciones/<clave>.ts` con su `DefinicionOperacion` (actividades, gestión por área en la carpeta de
   cada actor y formularios propios si los hay).
2. 1 entrada en `OPERACIONES` y, mientras no venga del backend, su transporte en `OPERACION_POR_TRANSPORTE`.
3. `validarOperacion` sin errores.

Las rutas de abajo sin carpeta son relativas a `general/`.

## Pantalla (`components/vista-general.tsx`)

1. **Tabla de embarques** — `embarques-table.tsx` (`DataTable`, mismo patrón que Cotizaciones).
2. **Resumen del seleccionado** (siempre visible) — `resumen-embarque.tsx`: franja con file/estado,
   botones **Actividades** (Sheet de detalle) y **Tracking** (Sheet del tracking interactivo), datos breves y el
   **tracking general** de 6 pasos (`tracking-general.tsx`, solo visual).
3. **Tabs de gestión** — `tabs-embarque.tsx` (tabs verticales como `TarifasTabs`). Cada tab es un
   componente en `components/pasos/`.
4. **Sheet de tracking interactivo** — `tracking-sheet.tsx`. Solo el componente existente
   `TrackingDetalle` (`@/features/tracking`), con los datos del embarque seleccionado
   (`CoordinacionTracking` en `shared/lib/tipos.ts`: mismos nombres que `Coordinacion`). `puedeRetroceder={false}`;
   `ocupado` mientras se guarda. `VistaGeneral` recibe `codTipoTracking` y `onActualizarEstadoTracking(embarque,
   payload)`: ahí la pantalla actualiza el estado (API) y reconsulta. No agregar otro contenido aquí.
5. **Sheet de actividades** — `detalle-actividades-sheet.tsx`: detalle del Excel por paso y área,
   independiente del tracking interactivo.

## Dónde vive cada cosa

| Qué                                   | Dónde                                                                |
| ------------------------------------- | -------------------------------------------------------------------- |
| Pasos del tracking y tabs             | `lib/operaciones/<clave>.ts` (`pasos`, `tabs`)                       |
| Reglas de tabs y permisos por perfil  | `lib/pasos.ts` (reciben la operación)                                |
| Tipos (`PerfilEmbarque`, embarque)    | `shared/lib/tipos.ts`                                                |
| Datos de ejemplo (borrar con la API)  | `lib/datos-maqueta.ts`                                               |
| Piezas reutilizables (sección, dato…) | `shared/components/utils.tsx`                                        |
| Campos de captura (input por tipo)    | `shared/components/campos.tsx`                                       |
| Campos de Información (corporativos)  | `shared/lib/campos-embarque.ts`                                      |
| Valores de Información (maqueta)      | `InformacionEmbarque` en `shared/lib/tipos.ts`; `informacionMaqueta` |
| Actividades de Expo Aérea (69)        | `shared/lib/actividades-tracking.ts` (`actividades` de `AEREO_EXPO`) |
| Tipos de interacción (9)              | `shared/lib/interacciones.ts`                                        |
| Motor de gestión (tipo y helpers)     | `shared/lib/gestion-actividades.ts`                                  |
| Cómo se trabaja cada actividad        | `<actor>/lib/gestion-actividades.ts` (asignado en `responsables`)    |
| Formulario propio de una actividad    | `<actor>/components/`, asignado en `formularios` de la operación     |
| Tarjeta genérica de una actividad     | `shared/components/tarjeta-actividad.tsx`                            |
| Tab genérica (todas las del flujo)    | `components/pasos/paso-actividades.tsx`                              |
| Tabs con contenido propio             | `pasos/paso-informacion.tsx`, `pasos/paso-archivos.tsx`              |
| Archivos del embarque (maqueta)       | `ArchivoEmbarque` en `shared/lib/tipos.ts`; `ARCHIVOS_MAQUETA`       |
| Bitácora del embarque (maqueta)       | `RegistroBitacora` en `shared/lib/tipos.ts`; `bitacoraMaqueta`       |

## Tracking general (Exportación Aérea)

Fuente: `Tracking-Expo-Aereo-6Pasos.xlsx` (hoja _Tracking 6 pasos_). Cada paso tiene nombre corto, nombre
consolidado, alcance (tooltip) y áreas responsables (OPS, Bodega, CBX):

1. **Reserva** — Coordinación y reserva (OPS, Bodega)
2. **Documentación** — Documentación y gestión aduanera (OPS, CBX)
3. **Bodega** — Liberación y despacho de bodega (OPS, Bodega)
4. **COMBEX** — Recepción en COMBEX y documentación final (OPS, CBX)
5. **Salida** — Despacho, salida aérea y complementaria (OPS, CBX)
6. **Cierre** — Arribo y cierre de la operación (OPS, CBX)

### Actividades (qué paso original va en cada paso)

`shared/lib/actividades-tracking.ts` (`ACTIVIDADES_TRACKING`) es la hoja _Detalle original_: 69 actividades con
paso nuevo, responsable, código original, proceso, entrada, actividad, resultado, tipo
(Principal/Opcional/Condicional/Excepción/Transversal) y control. Cuadra con la hoja _Tracking 6 pasos_.
El `id` es `"<responsable> <código>"` (ej. `"OPS 4.1"`, `"Bodega 0.1"`) porque los códigos se repiten entre
áreas. Se usa en:

- el tracking general (cantidad de actividades por paso);
- las tabs (cada actividad es una tarjeta con su formulario, ver abajo);
- el Sheet de actividades (`detalle-actividades-sheet.tsx`), por paso y área.

Los pasos son `pasos` de `AEREO_EXPO` (`lib/operaciones/aereo-expo.ts`); otra operación define los suyos.

## Tabs: actividades generalizadas

Las tabs cubren **las 69 actividades** de la hoja _Detalle original_, cada una en **exactamente una** tab
(`tabs[].actividades` de la operación, en el orden en que se trabajan). En la lista lateral se agrupan por paso del
tracking (`1 · Reserva`, `2 · Documentación`…); la tab muestra check si su paso ya pasó y un punto si es el actual.

| Paso | Tab                   | Actividades                                    |
| ---- | --------------------- | ---------------------------------------------- |
| —    | Información           | —                                              |
| 1    | Recolección y empaque | OPS 0.1–0.5, Bodega 0.1–0.5 (opcionales)       |
| 1    | Asignación de guías   | OPS 1.1–1.3                                    |
| 1    | Reservas              | OPS 2.1, 2.2, 3.1, 3.2                         |
| 2    | Draft y preaviso      | OPS 4.1, 4.2, 4.3                              |
| 2    | Gestión aduanera      | OPS 5.1–5.4, CBX E1                            |
| 3    | Recepción en bodega   | Bodega 7.1–7.5, E1, E2                         |
| 3    | Liberación y despacho | OPS 6.1, Bodega 7.6–7.9                        |
| 4    | Recepción en COMBEX   | CBX 8.1–8.5                                    |
| 4    | Guía final            | OPS 9.1, 9.3, 9.4, 9.5, E2                     |
| 4    | Tarifas y cargos      | OPS 9.2                                        |
| 4    | Documentación final   | CBX 10.1–10.5                                  |
| 5    | Despacho y salida     | CBX 11.1, 12.1, 12.3, 12.4, E2, E3, E4; OPS E1 |
| 5    | Complementaria        | CBX 12.2, 13.1, 13.2                           |
| 6    | Arribo y cierre       | CBX 14.1; OPS 15, 16, 17                       |
| —    | Archivos (extra)      | —                                              |
| —    | Bitácora (extra)      | —                                              |
| —    | Cancelación (extra)   | OPS 4.4                                        |

### Tipos de interacción (`shared/lib/interacciones.ts`)

Cada actividad se trabaja con uno de 9 tipos; todos se ven con la misma tarjeta. **Son de uso interno: el
nombre del tipo no se muestra al usuario** (solo define icono, campos base y botón). En pantalla no usar
términos técnicos: el usuario ve la actividad, sus campos y el botón con la acción.

| Tipo            | Para qué                                  | Campos base                                     |
| --------------- | ----------------------------------------- | ----------------------------------------------- |
| Formulario      | Registro de datos                         | Observaciones                                   |
| Dato especial   | Peso, medidas, correlativo vs. referencia | — (los de la actividad + comparación)           |
| Confirmación    | Verificar y dejar constancia              | Fecha y hora, Confirmado por                    |
| Correo          | Aviso a cliente, destino o proveedor      | Destinatarios, Asunto, Fecha de envío, Adjuntos |
| Orden de compra | OC del embarque                           | Proveedor, No. OC, Monto, Moneda                |
| Documento       | Generar, emitir o imprimir                | Fecha                                           |
| Evidencia       | Fotografías                               | Fotografías                                     |
| Seguimiento     | Trámite hasta que concluye                | Estado, Fecha, Observaciones                    |
| Incidencia      | Excepción con motivo y autorización       | Motivo, Autorizado por, Detalle                 |

### Campos de captura (`shared/components/campos.tsx`)

Un componente por tipo de dato, con los mismos componentes que ya usa el proyecto (no inputs a mano):

| `tipo` del campo  | Componente           | Se ve como                                       | Patrón existente                                  |
| ----------------- | -------------------- | ------------------------------------------------ | ------------------------------------------------- |
| `casillas`        | `CampoCasillas`      | `Checkbox` por opción                            | embarques `formulario-alternativo`, detalles      |
| `texto`, `numero` | `CampoTexto`         | `Field` + `InputGroupInput`                      | pricing (`CampoMetodo`)                           |
| `seleccion`       | `CampoSeleccion`     | `Select` con `opciones` fijas (obligatorias)     | embarques `ruta-dialog`, `formulario-alternativo` |
| `catalogo`        | `CampoCatalogo`      | `Combobox` con búsqueda (catálogo por conectar)  | embarques `ruta-dialog`, `nueva-entidad-captura`  |
| `fecha`           | `CampoFecha`         | `Popover` + `Calendar` (fecha en español, `PPP`) | embarques `paso-confirmar-destino`                |
| `fecha-hora`      | `CampoFecha conHora` | lo mismo + hora (`type="time"`)                  | —                                                 |
| `area`            | `CampoArea`          | `Textarea`                                       | embarques `formulario-alternativo`                |
| `archivo`         | `CampoArchivos`      | zona de arrastrar o seleccionar (`acepta`)       | embarques `public/file-dropzone`                  |

Regla: lista corta y fija (Sí/No, PP/CC, estado…) → `seleccion` con `opciones`; proveedores, líneas aéreas,
agentes, monedas, clientes… → `catalogo`. Fotografías → `acepta: "image/*"`. `soloLectura` deshabilita el control.
Con valor y editable, cada campo muestra una **x** al final para limpiarlo (`BotonLimpiar`, mismo estilo que
`ComboboxOpcion` de pricing): selección, fecha, hora, texto, número y área; el `Combobox` usa `clearable`.

### Campos de Información (`shared/lib/campos-embarque.ts`)

v2 es un **rediseño**: la tab Información (`pasos/paso-informacion.tsx`) se lee en **cards**, no en formulario
de solo lectura. Muestra **solo lo que muestra la CTS del módulo actual** (`STEPS_CTS` en
`components/cts-detalle/secciones-wizard-privado.tsx`), sin datos extra: **una card por paso**: Shipper,
Consignatario, Notificación, Facturación, Detalles, Rutas, Fechas y Producto (esta última a todo el ancho).
Gastos y Documentos de la CTS no van aquí (los archivos están en la tab Archivos) y Seguimiento es el tracking.
Cada card junta varios datos en pocas líneas (p. ej. nombre + NIT · industria · país; dirección + municipio ·
departamento · país; contacto con email y teléfono; cada carga con bultos · peso · medidas · CW · embalaje, valor,
país, partida y régimen, y en el encabezado productos, bultos, peso y "CW total" como la tabla de la CTS).
Producto y Rutas son listas (cada carga y tramo). Fechas lista las fechas del embarque
(`CAMPOS_FECHAS`, en el orden del proceso); muestra las que tienen valor y, aunque no tengan, las marcadas
`mostrarSiempre` (Recolección, ETD, ATD, ETA y ATA, con "—"). Son las del módulo actual (Fecha
Inicio, Fecha de Recolección, ETD, ETA y Fecha de entrega COMBEX) y las que registra el Excel de procesos
(envío de solicitud de reserva, recepción en bodega, salida real, aviso de salida, nueva fecha de salida y llegada
real). Cada fecha anota su origen y, en `actividad`, la actividad del Excel que la registra. Los documentos CROPA la CTS los pide solo con el gasto 127, por
eso sin valor no se dibujan. Cod File no se repite (está en el
resumen). Botón Editar solo para Operaciones (deshabilitado en la maqueta). De la CTS se toman los **pasos** y los
**campos**: misma clave, nombre, obligatorio y opciones (`CAMPOS_SHIPPER`, `CAMPOS_CONSIGNATARIO`,
`CAMPOS_NOTIFICACION`, `CAMPOS_FACTURACION`, `CAMPOS_DETALLES`, `CAMPOS_PRODUCTO`, `CAMPOS_RUTA`,
`CAMPOS_FECHAS`, `CAMPO_COD_FILE`); no sus pestañas ni formularios. Los valores llegan como `InformacionEmbarque` (`shared/lib/tipos.ts`, valores
por `key`); en la maqueta, `informacionMaqueta(embarque)` de `lib/datos-maqueta.ts`.
`key` es el nombre del dato en el módulo actual, para conectar la API sin traducir; el origen de cada lista
está anotado en el archivo. Cómo se combina cada campo en su card lo decide `pasos/paso-informacion.tsx`. Las actividades que
piden un dato que ya existe usan el mismo nombre (p. ej. _Aerolínea_, _Nro. Vuelo_, _Cantidad (bultos)_).

### Gestión de cada actividad (`<actor>/lib/gestion-actividades.ts`)

Cada actor define las suyas: `GESTION_OPERACIONES` (31, OPS), `GESTION_BODEGAS` (16, Bodega) y
`GESTION_COMBEX` (22, CBX), las de Expo Aérea; la operación las asigna a cada área en `responsables`. Tipo y
helpers en `shared/lib/gestion-actividades.ts`. Toda actividad debe tener su gestión (`validarOperacion`).

`GESTION_<ACTOR>["<id>"]`: `interaccion`, `campos` propios (van antes de los base), `accion` (texto del
botón), `compara` (referencia del control del Excel: muestra la referencia, "Actual" y "Diferencia"), `requiere`
(actividades previas, se muestran como "Antes: <actividad>") y `pendiente` (parte aún sin maquetar, p. ej. la tabla de rubros de OPS 9.2).

Campo con `key` (`"<sección>.<key>"` de `InformacionEmbarque`, ej. `"cargas.pesoTotal"`, `"fechas.fecha_salida"`): es el
mismo dato que en Información (`shared/lib/campos-embarque.ts`). Sirve para consultarlo si ya se ingresó (#129).
Toda `key` debe existir en los `CAMPOS_*` de su sección.

### Tarjeta (`shared/components/tarjeta-actividad.tsx`) y tab genérica (`pasos/paso-actividades.tsx`)

Tarjeta: encabezado (icono, código, actividad, responsable, tipo del Excel, estado), cuerpo (entrada,
actividades previas, comparación, campos) y pie (control, resultado y botón). Estado de maqueta según el paso
del embarque: Hecha / En curso / Pendiente; las excepciones dicen "Solo si aplica".

Tab genérica: encabezado (título y descripción), aviso (si la tab lo define) y **tabs horizontales por tipo**
del Excel (`ORDEN_TIPOS`: Principal, Opcional, Condicional, Transversal, Excepción; siempre las 5, con su
conteo; las que no tienen actividades quedan bloqueadas; abre la primera con actividades). Dentro de cada tipo, actividades agrupadas por proceso. Cada actividad se muestra con la tarjeta común y la gestión de su
responsable en la operación (`responsables[<área>].gestion`), o con su formulario propio si la operación lo
define (`formularios`, ej. OPS 1.1, 1.2 y 2.1 en Expo Aérea).

### Agregar o mover algo

- Mover una actividad de tab: cambiar su id de lista en `tabs` de la operación.
- Agregar una tab: 1 entrada en `tabs` de la operación (con su `icono`).
- Cambiar cómo se captura una actividad: su entrada en `<actor>/lib/gestion-actividades.ts`.
- Un formulario propio de un actor (fuera de la tarjeta común): en `<actor>/components/`, asignado en
  `formularios` de la operación (recibe `PropsActividad` y `gestion`).
  Ej.: OPS 2.1 (`operaciones/components/solicitud-reserva.tsx`) elige el formato de reserva de la aerolínea
  (`operaciones/lib/formatos-reserva.ts`: Iberia, LATAM, Delta; o General) y pasa sus campos a la tarjeta común; el
  selector va en `antesDeCampos` de `TarjetaActividad`.
- Un campo nuevo para todo un tipo: `base` del tipo en `INTERACCIONES`.

## Perfiles: Operaciones, Bodegas, Combex

`VistaGeneral` recibe `perfil` (por defecto `"operaciones"`). Reglas en `lib/pasos.ts` (sección _Permisos por
perfil_), según el responsable de cada actividad y el `perfil` que la operación le da (`responsables`; en Expo
Aérea: OPS → operaciones, Bodega → bodegas, CBX → combex):

| Perfil      | Tabs                                       | Actividades                                                                 | Información   |
| ----------- | ------------------------------------------ | --------------------------------------------------------------------------- | ------------- |
| Operaciones | Todas (incluye Archivos y Cancelación)     | Ve las 69; edita las 31 de OPS; las de Bodega y Combex en **solo consulta** | Edita         |
| Bodegas     | Información, Archivos + tabs de Bodega (3) | Solo las 16 de Bodega                                                       | Solo consulta |
| Combex      | Información, Archivos + tabs de CBX (6)    | Solo las 22 de CBX                                                          | Solo consulta |

- `perfilesDeTab`: qué perfiles ven la tab (`paraTodos` = Información y Archivos: Operaciones y los perfiles de
  las áreas de la operación; sin actividades y sin `paraTodos` = solo Operaciones).
- `actividadesDelPerfil`: actividades de la tab que ve el perfil.
- `puedeEditar` / `puedeEditarInformacion`: si edita la actividad / Información. Sin edición la tarjeta muestra
  "Solo consulta", los datos registrados y no tiene botón.
- El Sheet de actividades también sigue el perfil.

Las pantallas de cada actor montan `VistaGeneral` con su perfil.

## Archivos del embarque

**No hay subida general de archivos.** Cada archivo se sube en un solo lugar:

1. **La actividad que lo pide**: campos `tipo: "archivo"` de la gestión del actor (`CampoArchivos`; p. ej.
   comprobantes, fotografías, hojas de seguridad, documento final).
2. **El tracking interactivo** (`TrackingDetalle`, Sheet de tracking): tiene su propia subida. **En pausa**: no se
   modifica desde v2 hasta que se retome.

Mientras se revisa si el tracking ya cubre la subida y la selección de archivos para la notificación (#128), las
actividades editables con campos `archivo` muestran en el pie un botón **Tracking** (copia del de la franja) que abre
el Sheet del tracking. `VistaGeneral` lo da con `AbrirTrackingContext` (`shared/components/tarjeta-actividad.tsx`).

La tab **Archivos** (`pasos/paso-archivos.tsx`, grupo `extra`, `paraTodos`) es solo la **lista** de los archivos
del embarque para consulta y descarga: archivo, tipo, dónde se subió (actividad o Tracking), paso, usuario y
fecha; botones Ver y Descargar (deshabilitados en la maqueta). Usa una **tabla propia** (no `DataTable`), con el
mismo formato que `VersionesTable` de Cotizaciones: encabezado con título, conteo y búsqueda (con x para limpiar,
`BotonLimpiar` de `shared/components/campos.tsx`) y `Table` simple sin paginación. No tiene botón ni zona de subida. Datos de
`ARCHIVOS_MAQUETA` (por `id` del embarque) hasta que exista la API.

**Bitácora** (`pasos/paso-bitacora.tsx`, grupo `extra`, `paraTodos`): historial de solo consulta (fecha, usuario,
acción, detalle y paso), con la misma tabla y búsqueda que Archivos. **Mock** (`bitacoraMaqueta`: creación, archivos y
pasos completados) mientras se busca la API (#124).

**Facturación** (solo visualización): en pausa. Cuando se retome, sería otra entrada `grupo: "extra"` en
`tabs` de la operación, de solo lectura.
