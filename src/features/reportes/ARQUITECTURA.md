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
  lib/
    definir-reporte.ts        contrato (DefinicionReporte, ColumnaReporte, FiltroReporte)
    filtros.ts                atajos: filtroCentroCosto, filtroUsuario, filtroTipo, filtroEstado, filtroLista
    resumen-agrupado.ts       tabla dinámica genérica (calcularResumen → árbol de TablaDouble)
    exportar.ts               PDF y Excel (resumen + detalle) de cualquier reporte
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
     `"opcionales"`, `"ninguna"`), `agrupacion` inicial y `Contenido` (gráficas u otra vista en
     lugar de la tabla).
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
  campo de columnas y niveles con `NivelesBuilder`) y "Filtros" con los botones **Consultar**,
  **PDF** y **Excel** al final.
- **Consultar**: el reporte se consulta **solo con el botón** (fechas y filtros no consultan
  solos). "Personaliza tu reporte" sí se aplica al instante sobre lo ya consultado.
- **Resumen agrupado**: `calcularResumen` sobre las filas ya consultadas (sin otra consulta),
  dibujado con `TablaDouble` (árbol con TOTAL GENERAL, como pricing). Medidas: cantidad y la
  suma de cada columna `sumable`, por cada valor de la columna de desglose y en total.
- **Reporte**: `Contenido` de la definición o una `DataTable` con las columnas.
- **Descargas**: encabezado (período, empresa, CC y filtros con nombre), resumen y detalle.
  PDF con `usePdfReporte` (`@/features/pricing/reportes`); Excel con `exportarExcel`
  (`@/shared/lib/excel`), hojas "Resumen" y "Detalle".

La consulta se guarda con React Query (`["reportes", nomenclatura, params]`) al pulsar
Consultar; el encabezado de las descargas usa los filtros de esa consulta. Al cambiar de reporte, la pantalla se monta de nuevo (`key` = nomenclatura).
