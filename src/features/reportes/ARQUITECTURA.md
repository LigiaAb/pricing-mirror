# Reportes — arquitectura

Pantalla única para **todos** los reportes. Cada reporte es un archivo de configuración;
la pantalla arma lo demás.

```
reportes/
  api/
    reportes-disponibles.ts   reportes del rol + módulo + empresa + CC → select Reporte
    consultar-api.ts          atajo consultarApi(endpoint, schema) para `consultar`
  definiciones/
    index.ts                  REGISTRO: lista REPORTES (1 línea por reporte)
    reporte-visitas-historico.ts  Reporte de visitas — histórico (CRM); plantilla
    reporte-visitas.ts        Reporte de visitas (planificación, CRM): reusa la consulta y el
                              Excel del histórico
  lib/
    definir-reporte.ts        contrato (DefinicionReporte, ColumnaReporte, FiltroReporte)
    filtros.ts                atajos: filtroUsuario, filtroTipo, filtroEstado, filtroLista;
                              FILTROS_EMPRESA_CC (filtroEmpresa + filtroCentroCosto, los pone la pantalla)
    resumen-agrupado.ts       tabla dinámica genérica (calcularResumen → árbol de TablaDouble)
    exportar.ts               Excel agrupado (resumen) y PDF/Excel genéricos del reporte (detalle)
  components/
    vista-reportes.tsx        "Reportes disponibles" (Módulo → Reporte) + reporte elegido
    pantalla-reporte.tsx      título, filtros y configuración, Consultar, resumen, reporte, descargas
    personaliza-reporte.tsx   "Personaliza tu reporte" (igual que pricing: Select + NivelesBuilder)
    contenido-reporte.tsx     tabla por defecto de la sección "Reporte"
    campos.tsx / panel.tsx    select, fecha, panel y encabezados
```

## Agregar un reporte (3 pasos)

1. **Base de datos**: un `TIPO` con `TIPO_TABLA = 'REPORTE'` (nombre = título en pantalla,
   nomenclatura = clave, **máximo 20 caracteres**, ej. `REP_VISITAS_HIST`) y sus filas en `REPORTE_X_CC_X_MDULO_X_ROL`
   (rol, empresa, CC, módulo; `NULL` = todos).
2. **Definición**: copiar `definiciones/reporte-visitas-historico.ts` y cambiar:
   - `nomenclatura`: la del `TIPO`.
   - `consultar`: `consultarApi("/api/appweb/<endpoint>", filaSchema)`. Recibe
     `fecha_inicio`, `fecha_fin` (`yyyy-MM-dd`), `cod_empresa`, `cod_cc` y el `id` de cada filtro
     con valor (vacío = no se envía). Si el endpoint no aplica algún filtro (ej. fechas), una
     función propia consulta y filtra aquí (ver `reporte-visitas-historico.ts`).
   - `columnas`: `{ id, label, valor: (fila) => … }` + `agrupable` (campo de "Personaliza tu
     reporte"), `sumable` (medida del resumen, además de la cantidad), `buscable` (buscador).
   - Opcional: `filtros` (atajos de `lib/filtros.ts`), `fechas` (`"requeridas"` por defecto,
     `"opcionales"`, `"ninguna"`), `agrupacion` inicial, `Contenido` (gráficas u otra vista en
     lugar de la tabla) y `descargas` (ver abajo).
3. **Registro**: sumarlo a `REPORTES` en `definiciones/index.ts`.

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
- **Empresa y Centro de costo**: los pone la pantalla en Filtros (no cada reporte), igual que
  Tarifas y Cotizaciones: con la acción "Filtrar Empresa Centro Costo" de la opción **"Reportes"**
  se muestran (arrancan en el contexto) y mandan en la consulta; sin el permiso no se muestran y
  siempre van los del contexto. Un filtro con `depende: ["cod_cc"]` se limpia al cambiar el CC.
- **Consultar**: el reporte se consulta **solo con el botón** (fechas y filtros no consultan
  solos). "Personaliza tu reporte" sí se aplica al instante sobre lo ya consultado.
- **Resumen agrupado**: `calcularResumen` sobre las filas ya consultadas (sin otra consulta),
  dibujado con `TablaDouble` (árbol con TOTAL GENERAL, como pricing). Medidas: cantidad y la
  suma de cada columna `sumable`, por cada valor de la columna de desglose y en total.
- **Reporte**: `Contenido` de la definición o una `DataTable` con las columnas.
- **Descargas**: son dos cosas distintas, con los filtros de la última consulta en el encabezado.
  - **Excel agrupado** (siempre): el Resumen agrupado, aplanado como el Excel de pricing (una
    columna por nivel), con "Agrupado por" y "Columnas" en el encabezado.
  - **Excel / PDF del reporte** (opcionales, `descargas: { excel, pdf }` de la definición; en
    CRM unos tienen Excel, otros PDF y otros ambos): `true` = el detalle con las columnas
    (Excel con `exportarExcel` de `@/shared/lib/excel`; PDF con `usePdfReporte` de
    `@/features/pricing/reportes`); una función = formato propio, que recibe `{ filas, titulo,
    encabezado, params }` (ej. `excelHistorico` en `reporte-visitas-historico.ts`, el Excel de
    Reportes CRM). Sin la clave, no hay botón.

La consulta se guarda con React Query (`["reportes", nomenclatura, params]`) al pulsar
Consultar; el encabezado de las descargas usa los filtros de esa consulta. Al cambiar de reporte, la pantalla se monta de nuevo (`key` = nomenclatura).
