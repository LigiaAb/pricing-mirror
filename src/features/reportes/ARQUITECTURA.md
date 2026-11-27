# Reportes — arquitectura

Pantalla única para **todos** los reportes. Cada reporte es un archivo de configuración;
la pantalla arma lo demás.

```
reportes/
  api/
    reportes-disponibles.ts   reportes del rol + módulo + empresa + CC → select Reporte
    consultar-api.ts          consultarApi(endpoint, schema, { lista, params, nombres, filtrar }) para `consultar`
  definiciones/                 UNA CARPETA POR MÓDULO
    index.ts                  REGISTRO: REPORTES = las listas de todos los módulos
    plantillas/               PLANTILLAS para copiar (no se registran; ver GUIA.md, paso 3):
                              reporte-basico.ts, reporte-endpoint-distinto.ts,
                              reporte-personalizado.tsx
    crm/
      index.ts                REPORTES_CRM (1 línea por reporte, en orden de correlativo)
      reporte-visitas-historico.ts  CRM-RVH-01 Reporte de visitas — histórico; plantilla
      reporte-visitas.ts      CRM-RV-02 Reporte de visitas (planificación): reusa la consulta y
                              el Excel del histórico
      reporte-actividades.ts  CRM-A-03 Actividades (calendario PDF, del usuario de la sesión;
                              sin empresa ni CC: `empresaCentroCosto: false`)
      reporte-objetivos.tsx   CRM-OA-04 Objetivos de actividades (tipo de asignación
                              `requerido`; sección "Reporte" = la vista de CRM, `Contenido`)
      reporte-graficas-objetivos.tsx  CRM-GOSA-05 Gráficas de objetivos de semana actual
                              (sin fechas; vista de CRM con serie semanal y medidores)
      reporte-seguimiento.ts  CRM-S-06 Seguimiento (historial de seguimientos del cliente;
                              cliente `requerido`, sin fechas)
    pricing/
      index.ts                REPORTES_PRICING
      reporte-hit-rate.tsx    PRI-HR-01 Hit Rate (filas de report_kpi_cotizaciones para el
                              resumen; gráficas, tablas y PDF con `contenido/pricing/hit-rate.tsx`)
      reporte-realizacion-de-precio.tsx  PRI-RP-02 Realización de Precio (igual, con
                              `contenido/pricing/realizacion-de-precio.tsx`)
  contenido/                  UNA CARPETA POR MÓDULO: componentes de las vistas propias
                              (`Contenido`) de sus reportes (ej. pricing/hit-rate.tsx,
                              pricing/realizacion-de-precio.tsx: copias de las vistas de
                              pricing/reportes)
  lib/
    definir-reporte.ts        contrato (DefinicionReporte, ColumnaReporte, FiltroReporte)
    filtros.ts                atajos: filtroUsuario, filtroCliente (busca en el servidor),
                              filtroTipo, filtroEstado, filtroLista;
                              FILTROS_EMPRESA_CC (filtroEmpresa + filtroCentroCosto, los pone la pantalla)
    resumen-agrupado.ts       tabla dinámica genérica (calcularResumen → árbol de TablaDouble)
    exportar.ts               Excel agrupado (resumen) y PDF/Excel genéricos del reporte (detalle)
    excel-reporte.ts          COPIA del generador de Excel de Reportes de pricing (Excel agrupado)
  components/
    vista-reportes.tsx        "Reportes disponibles" (Módulo → Reporte) + reporte elegido
    pantalla-reporte.tsx      título, filtros y configuración, Consultar, resumen, reporte, descargas
    personaliza-reporte.tsx   "Personaliza tu reporte" (igual que pricing: Select + NivelesBuilder)
    contenido-reporte.tsx     tabla por defecto de la sección "Reporte"
    campos.tsx / panel.tsx    select, select con búsqueda en servidor, fecha, panel y encabezados
```

## Agregar un reporte

**Paso a paso en `GUIA.md`** (checklist, plantilla, recetas según cómo responde el endpoint,
columnas calculadas y errores comunes). Resumen: `TIPO` + relación en la base de datos → archivo
en `definiciones/<modulo>/` con `definirReporte` → 1 línea en `definiciones/<modulo>/index.ts`.

**Nomenclatura**: `[MÓDULO EN 3 CARACTERES]-[INICIALES DEL REPORTE]-[CORRELATIVO DEL MÓDULO]`
(máximo 20 caracteres, correlativo de 2 dígitos, sin contar "de"). CRM: `CRM-RVH-01`, `CRM-RV-02`,
`CRM-A-03`, `CRM-OA-04`, `CRM-GOSA-05`; el siguiente de CRM es `CRM-…-06`.

Si la API devuelve un reporte que no está en el registro, la pantalla dice que aún no está
configurado. Si está en el registro pero la API no lo devuelve, no se muestra (sin permiso).

## Qué arma la pantalla sola

- **Reportes disponibles**: dos selects. **Módulo** (catálogo `modulos`, `listamodulo`) y
  **Reporte**: `lista-reportes-disponibles` con `cod_usuario`, `cod_modulo`, `cod_empresa` y
  `cod_cc` (contexto operativo); sin módulo no se consulta. `VistaReportes` acepta `codModulo`
  como módulo inicial.
  Backend: `docs/backend/reportes-disponibles.js` (el rol lo resuelve el backend).
- **Filtros y configuración**: fechas (mes actual), "Personaliza tu reporte" (igual que pricing:
  campo de columnas y niveles con `NivelesBuilder`) y "Filtros" con los botones al final:
  **Consultar**, las descargas del reporte que tenga (**PDF**, **Excel**) y **Excel agrupado**.
  Un reporte con `agrupado: false` no tiene vista agrupada: sin "Personaliza tu reporte", sin
  **Resumen agrupado** y sin **Excel agrupado** (solo Filtros, la tabla y sus descargas).
- **Empresa y Centro de costo**: los pone la pantalla en Filtros (no cada reporte), igual que
  Tarifas y Cotizaciones: con la acción "Filtrar Empresa Centro Costo" de la opción **"Reportes"**
  se muestran (arrancan en el contexto) y mandan en la consulta; sin el permiso no se muestran y
  siempre van los del contexto. Un reporte que no los usa lleva `empresaCentroCosto: false`
  (no se muestran, no se envían y no van en el encabezado). Un filtro con `depende: ["cod_cc"]` se limpia al cambiar el CC.
- **Consultar**: el reporte se consulta **solo con el botón** (fechas y filtros no consultan
  solos). "Personaliza tu reporte" sí se aplica al instante sobre lo ya consultado.
- **Resumen agrupado**: `calcularResumen` sobre las filas ya consultadas (sin otra consulta),
  dibujado con `TablaDouble` (árbol con TOTAL GENERAL, como pricing). Medidas: cantidad, la
  suma de cada columna `sumable` y cada columna `calculada` (con las sumas del grupo, ej. HR %),
  por cada valor de la columna de desglose y en total.
- **Reporte**: `Contenido` de la definición o una `DataTable` con las columnas.
- **Descargas**: son dos cosas distintas, con los filtros de la última consulta en el encabezado.
  - **Excel agrupado** (siempre): el Resumen agrupado con el **mismo generador que Reportes de
    pricing** (`agregarHojaReporte`, copiado de `pricing/reportes/lib/excel-reporte.ts` en
    `lib/excel-reporte.ts`: si cambia allá, copiarlo aquí): logo, título, encabezado (período
    `dd-MM-yyyy al dd-MM-yyyy`, "Agrupado por", "Columnas"), una columna por nivel, subtotales en
    negrita y `#,##0`.
  - **Excel / PDF del reporte** (opcionales, `descargas: { excel, pdf }` de la definición; en
    CRM unos tienen Excel, otros PDF y otros ambos): `true` = el detalle con las columnas
    (Excel con `exportarExcel` de `@/shared/lib/excel`; PDF con `usePdfReporte` de
    `@/features/pricing/reportes`); una función = formato propio, que recibe `{ filas, titulo,
    encabezado, params }` (ej. `excelActividades` en `crm/reporte-visitas-historico.ts`, el Excel de
    Reportes CRM). Sin la clave, no hay botón.

La consulta se guarda con React Query (`["reportes", nomenclatura, params]`) al pulsar
Consultar; el encabezado de las descargas usa los filtros de esa consulta. Al cambiar de reporte, la pantalla se monta de nuevo (`key` = nomenclatura).
