# Diffs obsoletos

Diffs por commit de la migración de métodos de Tarifas (cobertura → guía), generados
contra los archivos en LF del mirror. En el proyecto real esos archivos están en CRLF,
así que **no aplican**. Usar en su lugar:

    diff/131126-1001-cl13112026-tarifas-definicion-unica-de-campos.diff

(todo lo de la rama sobre main, verificado con `git apply` sobre main).

También es obsoleto 131126-0953-…-contra-main.diff (binario, asumía CRLF en archivos que en el
proyecto real están en LF).
