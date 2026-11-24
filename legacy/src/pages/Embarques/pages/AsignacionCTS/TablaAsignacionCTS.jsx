// update comment
import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import TablaComponent from "@/components/Tabla/TablaComponent";
import { useCoordinaciones, useFetchGuiasCoordinacion } from "@/hooks/Bpm";
import { formatearFechaHoraBarras } from "@/utils/formateoFechas";
import { api } from "@/api";

const EncabezadosAsignaciones = [
    {
        id: "cod_asignacion_cts",
        field: "cod_asignacion_cts",
        label: "ID",
        campo: "cod_asignacion_cts",
        name: "cod_asignacion_cts",
        filtrar: true,
    },
    {
        id: "nombre_cliente",
        field: "nombre_cliente",
        label: "Cliente",
        campo: "nombre_cliente",
        name: "nombre_cliente",
        filtrar: true,
    },
    {
        id: "tipo_embarque_desc",
        field: "tipo_embarque_desc",
        label: "Tipo Embarque",
        campo: "tipo_embarque_desc",
        name: "tipo_embarque_desc",
        filtrar: true,
    },
    {
        id: "empresa_nombre",
        field: "empresa_nombre",
        label: "Empresa",
        campo: "empresa_nombre",
        name: "empresa_nombre",
        filtrar: true,
    },
    {
        id: "cencod_nombre",
        field: "cencod_nombre",
        label: "Centro de Costo",
        campo: "cencod_nombre",
        name: "cencod_nombre",
        filtrar: true,
    },
    {
        id: "nombre_completo",
        field: "nombre_completo",
        label: "Nombre Operador",
        campo: "nombre_completo",
        name: "nombre_completo",
        filtrar: true
    },
    {
        id: "especial",
        field: "especial",
        label: "Asignación Vacia",
        campo: "especial",
        name: "especial",
        filtrar: true
    },
    {
        id: "estado_desc",
        field: "estado_desc",
        label: "Estado",
        campo: "estado_desc",
        name: "estado_desc",
        filtrar: true,
    },
];

const TablaAsignacionCTS = ({
    titulo = "Asignaciones",
    onNew,
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
    updateData
}) => {

    const [isLoading, setIsLoading] = useState(false);
    const [listadoAsignaciones, setListadoAsignaciones] = useState([]);
    const [error, setError] = useState(null);

    const visibleEncabezados = useMemo(() => {
        if (!Array.isArray(hideColumns) || hideColumns.length === 0) {
            return EncabezadosAsignaciones;
        }
        const hideSet = new Set(hideColumns);
        return EncabezadosAsignaciones.filter((col) => !hideSet.has(col.field) && !hideSet.has(col.id));
    }, [hideColumns]);

    useEffect(() => {
        const fetch = async() => {
            await api
                .get("api/appweb/listar-asignacion-cliente-cts")
                .then(({ data }) => {
                    setListadoAsignaciones(data.data || [])
                })
                .catch((e) => console.error(e));
        }
        fetch()
    }, [updateData]);


    useEffect(() => {
        onLoadingChange?.(isLoading);
    }, [isLoading, onLoadingChange]);


    const datosFormateados = useMemo(() => {
        return listadoAsignaciones?.map((asignacion, i) => {
            return {
                ...asignacion,
                id: asignacion.cod_asignacion_cts, // Requerido por TablaComponent
                especial: !!asignacion.especial ? "S" : "N",
                accionesDeTabla: {
                    view: !!onView,
                    edit: !!onEdit,
                    delete: !!onDelete,
                },
            };
        }) || []
    }, [listadoAsignaciones]);

    const handleRefresh = async () => {

    };

    if (error) {
        return (
            <Box p={2}>
                <Typography color="error">
                    Error al cargar asignaciones: {error.message}
                </Typography>
            </Box>
        );
    }

    return (
        <TablaComponent
            titulo={titulo}
            botones={{
                nuevo: {
                    label: "Nuevo",
                    onClick: onNew,
                    color: "primary",
                },
            }}
            encabezado={visibleEncabezados}
            datos={datosFormateados}
            id="id"
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
};

export default TablaAsignacionCTS;
