import { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import TablaComponent from "@/components/Tabla/TablaComponent";
import { useCoordinaciones, useFetchEmpleadoUsuarioPuesto, useFetchGuiasCoordinacion } from "@/hooks/Bpm";
import { formatearFechaHoraBarras } from "@/utils/formateoFechas";
import { useQueryClient } from "@tanstack/react-query";

const EncabezadosCoordinaciones = [
    {
        id: "embarqueId",
        field: "embarqueId",
        label: "ID",
        campo: "embarqueId",
        name: "embarqueId",
        filtrar: true,
    },
    {
        id: "cotizacionCabeceraId",
        field: "cotizacionCabeceraId",
        label: "Cotización Cabecera",
        campo: "cotizacionCabeceraId",
        name: "cotizacionCabeceraId",
        filtrar: true,
    },
    {
        id: "correlativoGuia",
        field: "correlativoGuia",
        label: "House",
        campo: "correlativoGuia",
        name: "correlativoGuia",
        filtrar: true,
    },
    {
        id: "correlativoGuiaMaster",
        field: "correlativoGuiaMaster",
        label: "Master",
        campo: "correlativoGuiaMaster",
        name: "correlativoGuiaMaster",
        filtrar: true,
    },
    {
        id: "cod_file",
        field: "cod_file",
        label: "File",
        campo: "cod_file",
        name: "cod_file",
        filtrar: true,
    },
    {
        id: "empresa",
        field: "empresa",
        label: "Empresa",
        campo: "empresa",
        name: "empresa",
        filtrar: true,
    },
    {
        id: "centroCosto",
        field: "centroCosto",
        label: "Centro de Costo",
        campo: "centroCosto",
        name: "centroCosto",
        filtrar: true,
    },
    {
        id: "cliente",
        field: "cliente",
        label: "Cliente",
        campo: "cliente",
        name: "cliente",
        filtrar: true,
    },
    {
        id: "entidadShipperNombre",
        field: "entidadShipperNombre",
        label: "Shipper",
        campo: "entidadShipperNombre",
        name: "entidadShipperNombre",
        filtrar: true,
    },
    {
        id: "entidadConsignatarioNombre",
        field: "entidadConsignatarioNombre",
        label: "Consignatario",
        campo: "entidadConsignatarioNombre",
        name: "entidadConsignatarioNombre",
        filtrar: true,
    },
    {
        id: "paisOrigen",
        field: "paisOrigen",
        label: "Origen",
        campo: "paisOrigen",
        name: "paisOrigen",
        filtrar: true,
        formato: (val, row) =>
            val || row.content.pais_origen || row.content.nombre_pais_origen || "",
    },
    {
        id: "paisDestino",
        field: "paisDestino",
        label: "Destino",
        campo: "paisDestino",
        name: "paisDestino",
        filtrar: true,
        formato: (val, row) =>
            val || row.content.pais_destino || row.content.nombre_pais_destino || "",
    },
    {
        id: "puntoEnlaceOrigen",
        field: "puntoEnlaceOrigen",
        label: "P. Enlace Origen",
        campo: "puntoEnlaceOrigen",
        name: "puntoEnlaceOrigen",
        filtrar: true,
        formato: (val, row) =>
            val || row.content.punto_enlace_origen || row.content.puntoenlace_nombre_origen || "",
    },
    {
        id: "puntoEnlaceDestino",
        field: "puntoEnlaceDestino",
        label: "P. Enlace Destino",
        campo: "puntoEnlaceDestino",
        name: "puntoEnlaceDestino",
        filtrar: true,
    },
    {
        id: "tipoEmbarque",
        field: "tipoEmbarque",
        label: "Tipo Embarque",
        campo: "tipoEmbarque",
        name: "tipoEmbarque",
        filtrar: true,
    },
    {
        id: "servicio",
        field: "servicio",
        label: "Servicio",
        campo: "servicio",
        name: "servicio",
        filtrar: true,
    },
    {
        id: "tipoCarga",
        field: "tipoCarga",
        label: "Tipo Carga",
        campo: "tipoCarga",
        name: "tipoCarga",
        filtrar: true,
    },
    {
        id: "incoterm",
        field: "incoterm",
        label: "Incoterm",
        campo: "incoterm",
        name: "incoterm",
        filtrar: true,
    },
    {
        id: "estado",
        field: "estado",
        label: "Estado",
        campo: "estado",
        name: "estado",
        filtrar: true,
    },
    {
        id: "fechaInicio",
        field: "fechaInicio",
        label: "Fecha Inicio",
        campo: "fechaInicio",
        name: "fechaInicio",
        filtrar: true,
        formato: (val) => formatearFechaHoraBarras(val),
    },
    {
        id: "nombre_responsable",
        field: "nombre_responsable",
        label: "Responsable",
        campo: "nombre_responsable",
        name: "nombre_responsable",
        filtrar: true,
    },
    {
        id: "responsable",
        field: "responsable",
        label: "Responsable",
        campo: "responsable",
        name: "responsable",
        filtrar: true,
    },
    {
        id: "repeso",
        field: "repeso",
        label: "Repeso",
        campo: "repeso",
        name: "repeso",
        filtrar: true,
    },
    {
        id: "observaciones",
        field: "observaciones",
        label: "Observaciones",
        campo: "observaciones",
        name: "observaciones",
        filtrar: true,
    },
];

const TablaCoordinaciones = ({
    titulo = "Coordinaciones",
    estadoId = null,
    estadoFilter = null,
    servicioFilter = null,
    onView,
    onEdit,
    onDelete,
    filasPorPagina = 10,
    isLoading: externalLoading = false,
    useSeach = true,
    usePagination = true,
    select = false,
    onFilaSeleccionada,
    hideColumns = [],
    onLoadingChange,
    filterFn,
}) => {
    const queryClient = useQueryClient();

    const visibleEncabezados = useMemo(() => {
        if (!Array.isArray(hideColumns) || hideColumns.length === 0) {
            return EncabezadosCoordinaciones;
        }
        const hideSet = new Set(hideColumns);
        return EncabezadosCoordinaciones.filter((col) => !hideSet.has(col.field) && !hideSet.has(col.id));
    }, [hideColumns]);

    const {
        data: coordinaciones = [],
        isLoading,
        isFetching,
        error,
        refetch,
    } = useCoordinaciones({
        cod_empresa: 1,
        cod_cc: 16,
    });

    useEffect(() => {
        onLoadingChange?.(isLoading || isFetching || externalLoading);
    }, [isLoading, isFetching, externalLoading, onLoadingChange]);

    const { data: guiasCoordinacion = [] } = useFetchGuiasCoordinacion({}, { enabled: !!coordinaciones?.length });

    const { data: empleados = [] } = useFetchEmpleadoUsuarioPuesto();

    const correlativosPorEmbarque = useMemo(() => {
        return (guiasCoordinacion || []).reduce((acc, g) => {
            const embarqueId = g.embarqueId ?? g.embarque_id ?? g.EMBARQUE_ID;
            if (!embarqueId) return acc;

            const entry = acc[embarqueId] || { house: new Set(), master: new Set() };
            if (g.correlativoGuia) entry.house.add(g.correlativoGuia);
            if (g.correlativoGuiaMaster) entry.master.add(g.correlativoGuiaMaster);

            return { ...acc, [embarqueId]: entry };
        }, {});
    }, [guiasCoordinacion]);

    const datosFormateados = useMemo(() => {
        if (!coordinaciones || !Array.isArray(coordinaciones)) return [];

        return coordinaciones
            .filter((c) => {
                if (!c) return false;

                // extract posible id y descripción para el estado
                const idFromRecord =
                    c.estadoId ?? c.estado_id ?? c.ESTADO_ID ??
                    (c.estado && (c.estado.id ?? c.estado.estado_id ?? c.estado.cod_estado)) ??
                    null;
                const estadoIdNum = idFromRecord !== null && idFromRecord !== undefined ? Number(idFromRecord) : null;
                const estadoDesc = (c.estado || "").toString().toLowerCase();

                // helper que comprueba un valor individual
                const matchesValue = (val) => {
                    if (val === null || val === undefined) return false;
                    const valStr = val.toString().toLowerCase();
                    const valNum = Number(val);

                    // si el filtro se interpreta como número válido y el registro tiene un id
                    if (!Number.isNaN(valNum) && estadoIdNum !== null) {
                        return estadoIdNum === valNum;
                    }
                    // fallback: comparar contra la descripción (case-insensitive)
                    return estadoDesc === valStr;
                };
                
                if ((estadoFilter === null || estadoFilter === undefined) &&
                    (estadoId === null || estadoId === undefined)) {
                    return true;
                }

                // priorizar el filtro nuevo
                if (estadoFilter !== null && estadoFilter !== undefined) {
                    if (Array.isArray(estadoFilter)) {
                        return estadoFilter.some(matchesValue);
                    }
                    return matchesValue(estadoFilter);
                }

                // compatibilidad con estadoId antiguo, que puede ser array también
                if (Array.isArray(estadoId)) {
                    return estadoId.some(matchesValue);
                }
                return matchesValue(estadoId);
            })
            .filter((c) => {
                if (servicioFilter === null || servicioFilter === undefined) return true;
                return Number(c.idServicio ?? c.id_servicio) === Number(servicioFilter);
            })
            .filter((c) => {
                if (typeof filterFn !== "function") return true;
                return filterFn(c);
            })
            .map((c) => {
                // Asegurar que cada fila tenga un identificador único y compatible con otras partes del código
                const coordinacionId = c.coordinacion ?? c.embarqueId ?? c.embarque_id ?? c.cod_file ?? null;
                const content = { ...c, coordinacion: coordinacionId };

                const correlativos = correlativosPorEmbarque[coordinacionId] || correlativosPorEmbarque[String(coordinacionId)] || { house: new Set(), master: new Set() };
                const houseValor = Array.from(correlativos.house).join(", ");
                const masterValor = Array.from(correlativos.master).join(", ");
                const empleado = empleados.find(e => e.usuario === c.responsable);

                return {
                    ...content,
                    id: coordinacionId, // Requerido por TablaComponent
                    correlativoGuia: houseValor,
                    correlativoGuiaMaster: masterValor,
                    nombre_responsable: empleado?.label,
                    accionesDeTabla: {
                        view: !!onView,
                        edit: !!onEdit,
                        delete: !!onDelete,
                    },
                    content,
                    empleado,
                };
            });
    }, [coordinaciones, estadoId, estadoFilter, servicioFilter, correlativosPorEmbarque, onView, onEdit, onDelete, filterFn, empleados]);

    const handleRefresh = async () => {

        await refetch();
        queryClient.invalidateQueries(["coordinacion-documentos"]);
        queryClient.invalidateQueries(["coordinacion-carga"]);
        queryClient.invalidateQueries(["listar-coordinacion-gastos"]);
        queryClient.invalidateQueries(["listar-coordinacion-gastos-criterio"]);
    };

    if (error) {
        return (
            <Box p={2}>
                <Typography color="error">
                    Error al cargar coordinaciones: {error.message}
                </Typography>
            </Box>
        );
    }

    const tabla = (
        <TablaComponent
            titulo={titulo}
            botones={{
                refresh: {
                    label: (
                        <i className="c-actualizar" style={{ fontSize: 18 }}></i>
                    ),
                    onClick: handleRefresh,
                    disabled: isFetching || isLoading,
                    color: "primary",
                },
            }}
            encabezado={visibleEncabezados}
            datos={datosFormateados}
            id="coordinacion"
            isLoading={isLoading || externalLoading}
            rowsPerPage={filasPorPagina}
            useSeach={useSeach}
            usePagination={usePagination}
            select={select}
            onFilaSeleccionada={onFilaSeleccionada}
            eventosDeTabla={{
                view: (row) => onView?.(row.content || row),
                edit: (row) => onEdit?.(row.content || row),
                delete: (row) => onDelete?.(row.content || row),
            }}
        />
    );

    return (
        <>
            {tabla}
            {/* <pre>{JSON.stringify(datosFormateados, null, 2)}</pre> */}
        </>
    )
};

TablaCoordinaciones.propTypes = {
    // filtro antiguo. puede ser un valor o bien un arreglo para mantener
    // compatibilidad con usos pasados que quieran múltiples estados.
    estadoId: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    ]),
    // filtro moderno: puede ser un valor o un arreglo de valores (número o texto).
    estadoFilter: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    ]),
    servicioFilter: PropTypes.number,
    onView: PropTypes.func,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    filasPorPagina: PropTypes.number,
    isLoading: PropTypes.bool,
    useSeach: PropTypes.bool,
    usePagination: PropTypes.bool,
    select: PropTypes.bool,
    titulo: PropTypes.string,
    onFilaSeleccionada: PropTypes.func,
    hideColumns: PropTypes.arrayOf(PropTypes.string),
    onLoadingChange: PropTypes.func,
    filterFn: PropTypes.func,
};

export default TablaCoordinaciones;
