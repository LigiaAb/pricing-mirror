# Reportes — arquitectura

Pantalla única para **todos** los reportes. Cada reporte es un archivo de configuración;
la pantalla arma lo demás.

```
reportes/
  api/
    reportes-disponibles.ts   reportes del rol + empresa + CC, con su módulo → selects
    consultar-api.ts          atajo consultarApi(endpoint, schema) para `consultar`
  definiciones/
    index.ts                  REGISTRO: lista REPORTES (1 línea por reporte)
    reporte-visitas-historico.ts  Reporte de visitas — histórico (CRM); plantilla
  lib/
    definir-reporte.ts        contrato (DefinicionReporte, ColumnaReporte, FiltroReporte)
    filtros.ts                atajos: filtroCentroCosto, filtroUsuario, filtroTipo, filtroEstado, filtroLista
    resumen-agrupado.ts       tabla dinámica genérica (calcularResumen)
    exportar.ts               PDF y Excel (resumen + detalle) de cualquier reporte
  components/
    vista-reportes.tsx        "Reportes disponibles" (Módulo → Reporte) + reporte elegido
    pantalla-reporte.tsx      título, filtros y configuración, resumen, reporte, descargas
    personaliza-reporte.tsx   "Personaliza tu reporte"
    resumen-agrupado.tsx      tabla del "Resumen agrupado"
    contenido-reporte.tsx     tabla por defecto de la sección "Reporte"
    campos.tsx / panel.tsx    select, fecha, panel y encabezados
```

## Agregar un reporte (3 pasos)

1. **Base de datos**: un `TIPO` con `TIPO_TABLA = 'REPORTE'` (nombre = título en pantalla,
   nomenclatura = clave, ej. `HIT_RATE`) y sus filas en `REPORTE_X_CC_X_MDULO_X_ROL`
   (rol, empresa, CC, módulo; `NULL` = todos).
2. **Definición**: copiar `definiciones/reporte-visitas-historico.ts` y cambiar:
   - `nomenclatura`: la del `TIPO`.
   - `consultar`: `consultarApi("/api/appweb/<endpoint>", filaSchema)`. Recibe
     `fecha_inicio`, `fecha_fin` (`yyyy-MM-dd`), `cod_empresa`, `cod_cc` y el `id` de cada filtro
     con valor (vacío = no se envía). Si el endpoint no aplica algún filtro (ej. fechas), una
     función propia consulta y filtra aquí (ver `reporte-visitas-historico.ts`).
   - `columnas`: `{ id, label, valor: (fila) => … }` + `agrupable` (se puede agrupar),
     `sumable` (se puede sumar), `buscable` (buscador de la tabla).
   - Opcional: `filtros` (atajos de `lib/filtros.ts`), `fechas` (`"requeridas"` por defecto,
     `"opcionales"`, `"ninguna"`), `agrupacion` inicial y `Contenido` (gráficas u otra vista en
     lugar de la tabla).
3. **Registro**: sumarlo a `REPORTES` en `definiciones/index.ts`.

Si la API devuelve un reporte que no está en el registro, la pantalla dice que aún no está
configurado. Si está en el registro pero la API no lo devuelve, no se muestra (sin permiso).

## Qué arma la pantalla sola

- **Reportes disponibles**: `lista-reportes-disponibles` con `cod_usuario`, `cod_empresa` y
  `cod_cc` (contexto operativo); cada fila trae su `cod_modulo` (`NULL` = todos los módulos).
  Dos selects: **Módulo** (los que tienen reportes; nombre del catálogo `modulos`; vacío = todos)
  y **Reporte** (los del módulo). `VistaReportes` acepta `codModulo` como módulo inicial.
  Backend: `docs/backend/reportes-disponibles.js` (el rol lo resuelve el backend).
- **Filtros y configuración**: fechas (mes actual), "Personaliza tu reporte" (hasta 3 niveles
  de filas, columna de desglose y valor: cantidad o suma de una columna `sumable`) y "Filtros"
  con los **botones PDF y Excel al final**.
- **Resumen agrupado**: `calcularResumen` sobre las filas ya consultadas (sin otra consulta).
- **Reporte**: `Contenido` de la definición o una `DataTable` con las columnas.
- **Descargas**: encabezado (período, empresa, CC y filtros con nombre), resumen y detalle.
  PDF con `usePdfReporte` (`@/features/pricing/reportes`); Excel con `exportarExcel`
  (`@/shared/lib/excel`), hojas "Resumen" y "Detalle".

La consulta corre sola al cambiar fechas o filtros (React Query, `["reportes", nomenclatura,
params]`). Al cambiar de reporte, la pantalla se monta de nuevo (`key` = nomenclatura).
