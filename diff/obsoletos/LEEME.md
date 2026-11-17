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
