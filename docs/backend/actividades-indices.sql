-- Índices sugeridos para las consultas de actividades (#308). NO se aplican solos: revisar
-- primero los índices que ya tiene ACTIVIDAD y ejecutarlos en la base (Azure SQL) si no existen.
--
-- Las consultas de lista, calendario y conteo filtran por usuario (asignado = USUARIO_ID o
-- creador = USUARIO_CREADOR_ID) y por rango de ACTIVIDAD_FECHA_PROGRAMACION, ya sin CAST,
-- así que estos índices permiten buscar (seek) solo el rango del usuario en vez de recorrer
-- toda la tabla.
--
-- Índices existentes:
--   SELECT i.name, c.name AS columna, ic.key_ordinal, ic.is_included_column
--   FROM sys.indexes i
--   JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
--   JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
--   WHERE i.object_id = OBJECT_ID('ACTIVIDAD') ORDER BY i.name, ic.key_ordinal;

-- Usuario asignado + fecha (lista, calendario, en curso, vencidas, conteo).
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ACTIVIDAD_USUARIO_FECHA' AND object_id = OBJECT_ID('ACTIVIDAD'))
  CREATE NONCLUSTERED INDEX IX_ACTIVIDAD_USUARIO_FECHA
    ON ACTIVIDAD (USUARIO_ID, ACTIVIDAD_FECHA_PROGRAMACION)
    INCLUDE (ESTADO_ID, TIPO_ID, EMPRESA_ID, CENCOS_ID)
    WITH (ONLINE = ON);

-- Usuario creador + fecha ("Ver por: Creador").
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ACTIVIDAD_CREADOR_FECHA' AND object_id = OBJECT_ID('ACTIVIDAD'))
  CREATE NONCLUSTERED INDEX IX_ACTIVIDAD_CREADOR_FECHA
    ON ACTIVIDAD (USUARIO_CREADOR_ID, ACTIVIDAD_FECHA_PROGRAMACION)
    INCLUDE (ESTADO_ID, TIPO_ID, EMPRESA_ID, CENCOS_ID)
    WITH (ONLINE = ON);

-- Solo fecha (calendario con "ver todo" sin filtrar por usuario; también el ICC, #292). Si ya se
-- creó IX_ACTIVIDAD_FECHA_PROGRAMACION en #292 este paso no hace nada (mismo nombre).
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ACTIVIDAD_FECHA_PROGRAMACION' AND object_id = OBJECT_ID('ACTIVIDAD'))
  CREATE NONCLUSTERED INDEX IX_ACTIVIDAD_FECHA_PROGRAMACION
    ON ACTIVIDAD (ACTIVIDAD_FECHA_PROGRAMACION)
    INCLUDE (USUARIO_ID, USUARIO_CREADOR_ID, ESTADO_ID, TIPO_ID, EMPRESA_ID, CENCOS_ID)
    WITH (ONLINE = ON);
