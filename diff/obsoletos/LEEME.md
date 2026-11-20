# Diffs obsoletos

Diffs por commit de la migración de métodos de Tarifas (cobertura → guía), generados
contra los archivos en LF del mirror. En el proyecto real esos archivos están en CRLF,
así que **no aplican**. Usar en su lugar:

    diff/131126-1001-cl13112026-tarifas-definicion-unica-de-campos.diff

(todo lo de la rama sobre main, verificado con `git apply` sobre main).

También es obsoleto 131126-0953-…-contra-main.diff (binario, asumía CRLF en archivos que en el
proyecto real están en LF).

También es obsoleto 171126-0958-cl17112026-autorizacion-spot-tabla-separada-para-que-no-se-r.diff:
se generó sobre una versión vieja de autorizar-tarifa-spot.tsx (el espejo estaba desincronizado) y
no aplica en el proyecto. Usar en su lugar 171126-1015-…-tabla-separada-sobre-la-version.diff.

También es obsoleto 171126-1032-cl17112026-sync-restaurar-el-espejo-al-contenido-de-los-diff.diff
(se marcó "NO APLICAR"): en el proyecto no aplica completo porque incluye borrar
`cotizacion/calculo/lib/costo-porcentaje.ts`, que el proyecto ya no tiene. Usar en su lugar
171126-1036-cl17112026-sync-poner-al-dia-el-proyecto.diff (mismo contenido sin ese archivo).

También son obsoletos 181126-0815-cl18112026-pricing-toasts-de-exito-con-meta-en-las-mutacione.diff y
181126-0818-cl18112026-pricing-mutaciones-usan-exigirexitodemutacion-rea.diff (nunca se aplicaron en el
proyecto, ver SYNC `23d2551`). Su contenido, junto con los permisos de botones (181126-0902), está en el
diff único 181126-0911-cl18112026-sync-diff-unico-con-toasts-y-permisos-pendientes.diff.

También es obsoleto 201126-1544-cl20112026-ficha-de-cotizacion-en-sheet-desde-reportes.diff (nunca se
aplicó: no llegó a `main`). La ficha de cotización de Reportes se rehízo con toda la información de la
cotización; usar el diff único 201126-1551-cl20112026-ficha-completa-de-cotizacion-en-reportes.diff.
