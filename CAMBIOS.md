# Log de cambios — pricing-mirror

Registro para dar seguimiento a lo hecho en el módulo **pricing**. Entradas nuevas **arriba**, agrupadas por fecha.
Cada entrada: rama · módulo/submódulo · qué y por qué · diff generado (si aplica).

## 13/11/2026

- **Shared / Calculadora de embarques** (`claude/13112026-work-pricing-tarifas`): `shared/index.ts` apunta a las subcarpetas reales de `calculadora-embarque/` (`components/`, `hooks/`, `lib/`); con rutas planas Next fallaba con *Module not found: ./calculadora-embarque/calculadora-medidas*. Se resuelven los 6 errores previos; línea base: 209. Diff: `131126-1039-cl13112026-shared-rutas-de-calculadora-embarque-en-index.diff`.
- **Tarifas** (`claude/13112026-work-pricing-tarifas`): se reaplica `?? null` en `equipo-form.tsx` (equipo, moneda costo/venta); el commit RERFACTOR de `main` lo había revertido y volvía el error `EquipoOption | null | undefined`. Diff: `131126-1035-cl13112026-tarifas-reaplicar-value-null-en-combobox-de-equip.diff`.
- **Tarifas** (`claude/13112026-work-pricing-tarifas`): stub tipado de `AsyncComboboxInput` (solo espejo; `value: T | null`, no acepta `undefined`) para detectar errores como `EquipoOption | null | undefined`; `?? null` en `equipo-form.tsx` (equipo, moneda costo/venta). Se regresan a LF los 54 archivos que el commit RERFACTOR pasó a CRLF (el proyecto real los guarda en LF; con CRLF los diff no aplicaban). `shared/index.ts` queda con rutas planas de `calculadora-embarque/` como el proyecto real: sus 6 errores quedan en la línea base (pendiente confirmar estructura de la calculadora). Línea base: 215. Diff: `131126-1016-cl13112026-tarifas-value-null-en-combobox-de-equipo.diff`.
- **Reglas** (`claude/13112026-work-pricing-reglas`): se agrega este log de cambios y la regla de revisar si `main`
  cambió en cada iteración (`CLAUDE.md` → Flujo de trabajo, pasos 0 y 7).
- **Tarifas** (`claude/12112026-work-pricing-tarifas`, PR #24 y #25): definición única de campos por método
  (`definirMetodo` en `lib/metodos/<metodo>.ts`): Costo/Venta (piloto), Cobertura, Porcentaje, Costo por Porcentaje,
  Equipo, Rango y Scalling. Motor de campos movido a `pricing/shared`. Guía para agregar un campo en
  `tarifas/ARQUITECTURA.md`. Finales de línea LF como el proyecto real.
  Diffs: `131126-0857-…`, `131126-1001-…tarifas-definicion-unica-de-campos.diff`,
  `131126-1001-…shared-arquitectura-motor-de-campos-opcional.diff`, `131126-1006-…shared-index-rutas-…diff`.
- **Calculadora de embarques**: movida a `pricing/shared/calculadora-embarque/` y ordenada en `components/`,
  `hooks/`, `lib/`; se eliminan duplicados; `UNIDAD_DEFAULT` en guardar-version para totales directos.
  Diff: `131126-0926-cl13112026-calculadora-de-embarques-corporativa-en-pricing-shared.diff`.

## 12/11/2026

- **Reportes**: optimizar consultas, cálculos y generación de PDF. Diff: `121126-1656-…`.
- **Cotizaciones**: no mostrar IVA guardado en Due Carrier al consultar (`121126-1154-…`); calcular rubros con
  método Porcentaje en Due Carrier y Due Agent (`121126-1107-…`); consultar la cabecera al guardarla y salir del
  modo ingreso (`121126-0950-…`); keys duplicadas en búsqueda de clientes (`121126-1028-…`).
- **Tarifas**: conservar clasificación al cambiar a un rubro sin clasificación preestablecida (`121126-1047-…`);
  costo por porcentaje: tarifa en enteros y conversión a factor en cotización (`121126-1037-…`).
- Diff consolidado para reaplicar cambios tras error de merge (`121126-1146-…`).

## 11/11/2026

- Creación del repo espejo de pricing; flujo de `diff/[DDMMYY-HHmm]-[commit].diff` por cambio.
- Cotizaciones: reconsultar versiones al seleccionar una cabecera; correcciones de imports y casts en
  ficha-resumen; limpieza de copias tras mover código a `pricing/shared`.
