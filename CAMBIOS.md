# Log de cambios — pricing-mirror

Registro para dar seguimiento a lo hecho en el módulo **pricing**. Entradas nuevas **arriba**, agrupadas por fecha.
Cada entrada: rama · módulo/submódulo · qué y por qué · diff generado (si aplica).

## 13/11/2026

- **Tarifas / Shared** (`claude/13112026-work-pricing-tarifas`): se integra `main` (PR #30). Corrige el error de build *Module not found: ./calculadora-embarque/calculadora-medidas*: el commit de revert (`131126-1042-…`) había regresado `shared/index.ts` a rutas planas que no existen y escondió sus 6 errores en la línea base. `index.ts` vuelve a `components/`, `hooks/`, `lib/` y la línea base vuelve a 209. En el proyecto: aplicar `131126-1039-…` (rama shared) y **no** aplicar `131126-1042-…`. Si ya se aplicó el 1042, aplicar este: `131126-1046-cl13112026-tarifas-integrar-main-y-corregir-rutas-de-calcula.diff`.
- **Shared / Calculadora de embarques** (`claude/13112026-work-pricing-shared`): `shared/index.ts` apunta a las subcarpetas reales de `calculadora-embarque/` (`components/`, `hooks/`, `lib/`); con rutas planas Next fallaba con *Module not found: ./calculadora-embarque/calculadora-medidas*. Se resuelven los 6 errores previos; línea base: 209. Diff: `131126-1039-cl13112026-shared-rutas-de-calculadora-embarque-en-index.diff`.
- **Shared / Calculadora de embarques** (`claude/13112026-work-pricing-tarifas`): se revierte el commit de rutas de `calculadora-embarque/` en `shared/index.ts`; se había hecho en esta rama por error y pasa a `claude/13112026-work-pricing-shared` (regla de rama por submódulo). Esta rama vuelve a rutas planas y línea base 215. **ERRÓNEO, no aplicar** (rompe el build); no aplicar este diff si en el proyecto ya se aplicó `131126-1039-…` (lo que vale es el de la rama shared). Diff: `131126-1042-cl13112026-revertir-rutas-de-calculadora-embarque-movido-a-r.diff`.
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
