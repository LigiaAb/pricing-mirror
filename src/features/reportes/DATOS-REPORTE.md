# Reportes: de dónde sale cada dato

Consulta para cuando la guía (`GUIA.md`) no basta. No hace falta leerla para agregar un reporte.

| Dato                                             | De dónde sacarlo                                                                    |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `nomenclatura`                                   | Se inventa con la regla `MÓDULO-INICIALES-CORRELATIVO` (paso 1 de `GUIA.md`) y se guarda igual en `TIPO.NOMENCLATURA`. |
| Endpoint (`/api/appweb/CAMBIAR`)                 | El nombre de la ruta del backend (`/api/appweb/<nombre>`). Si otra pantalla ya lo usa, buscar el nombre en `src/features/**/api/*.ts` (`http.get("/api/appweb/…")`) o verlo en la pestaña **Network** del navegador en esa pantalla. |
| Campos del schema (`campo_texto`, `campo_numero`) | La respuesta del endpoint: pestaña **Network** → la petición → **Response** (copiar los nombres tal cual, en minúsculas). En el backend: los alias del `select` (`… AS NOMBRES` llega como `nombres`). |
| Nombres de los parámetros que espera el endpoint | En el backend, la función del endpoint: lo que lee de `campos` (ej. `campos.fecha_inicio`, `campos.cod_cc`). Si son distintos a los de la pantalla (`fecha_inicio`, `fecha_fin`, `cod_empresa`, `cod_cc`), usar `nombres` (plantilla de endpoint distinto). |
| Dónde viene la lista (`lista`)                   | La misma respuesta en **Network**: si las filas no están en `data` sino en `data.<algo>`, `lista: "<algo>"`. |
| `id` de cada filtro                              | El nombre del parámetro que el backend lee de `campos` para ese filtro (ej. `cod_usuario`, `cod_tipo_pago`). |
| `filtroTipo("TIPO_TABLA", …)`                    | La `TIPO_TABLA` de los tipos que se quieren listar (tabla `TIPO`; ej. `ACTIVIDAD`, `TIPO_PAGO`). |
| `filtroEstado("NOMBRE", …)`                      | El `nom_tipo` de los estados (catálogo `estados`; ej. `ACTIVIDAD`).                  |
| Otros catálogos (consulta o filtro propios)      | Todos los catálogos están en `src/features/catalogos/index.ts` (ej. `empleadosUsuarios`, `tipos`, `empresas`, `roles`, `modulos`). |
| `columnas` (`valor: (f) => f.campo`)             | Los campos del schema de la misma copia.                                            |
| `ROL_ID`, `MODULO_ID`, `CENCOS_ID`, `EMPRESA_ID` de la relación | Catálogos `roles` (`/api/appweb/lista-rol`), `modulos` (`/api/appweb/listamodulo`, el select Módulo de la pantalla), `centrosCosto` (`/api/appweb/listacentrocosto`) y `empresas` (`/api/appweb/listaempresas`). |
