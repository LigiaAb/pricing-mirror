import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { Box, Typography } from "@mui/material";
import TablaComponent from "@/components/Tabla/TablaComponent";
import { useCoordinaciones, useFetchGuiasCoordinacion } from "@/hooks/Bpm";
import { formatearFechaHoraBarras } from "@/utils/formateoFechas";
import { api } from "../../../api";
import moment from "moment";

const EncabezadosCoordinaciones = [
    {
        id: "etiq_hawb",
        field: "etiq_hawb",
        label: "House",
        campo: "etiq_hawb",
        name: "etiq_hawb",
        filtrar: true,
    },
    {
        id: "etiq_mawb",
        field: "etiq_mawb",
        label: "Master",
        campo: "etiq_mawb",
        name: "etiq_mawb",
        filtrar: true,
    },
    {
        id: "emp_codigo",
        field: "emp_codigo",
        label: "Empresa",
        campo: "emp_codigo",
        name: "emp_codigo",
        filtrar: true,
    },
    {
        id: "deporg_codigo",
        field: "deporg_codigo",
        label: "Centro de Costo",
        campo: "deporg_codigo",
        name: "deporg_codigo",
        filtrar: true,
    },
    {
        id: "etiq_csgnee",
        field: "etiq_csgnee",
        label: "Consignatario",
        campo: "etiq_csgnee",
        name: "etiq_csgnee",
        filtrar: true,
    },
    {
        id: "etiq_origen",
        field: "etiq_origen",
        label: "Origen",
        campo: "etiq_origen",
        name: "etiq_origen",
        filtrar: true,
    },
    {
        id: "etiq_destino",
        field: "etiq_destino",
        label: "Destino",
        campo: "etiq_destino",
        name: "etiq_destino",
        filtrar: true,
    },
    {
        id: "etiq_bultos",
        field: "etiq_bultos",
        label: "Bultos",
        campo: "etiq_bultos",
        name: "etiq_bultos",
        filtrar: true,
    },
    {
        id: "etiq_fecha",
        field: "etiq_fecha",
        label: "Fecha",
        campo: "etiq_fecha",
        name: "etiq_fecha",
        filtrar: true,
        formato: (val) => formatearFechaHoraBarras(val),
    },
    {
        id: "etiq_ets",
        field: "etiq_ets",
        label: "ETS ",
        campo: "etiq_ets",
        name: "etiq_ets",
        filtrar: true,
        formato: (val) => formatearFechaHoraBarras(val),
    },
];

const TablaEtiquetas = ({
    titulo = "Etiquetas de cordinación",
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
    historico = true
}) => {

    const [isLoading, setIsLoading] = useState(false);
    const [listadoEtiquetas, setListadoEtiquetas] = useState([]);
    const [error, setError] = useState(null);

    const visibleEncabezados = useMemo(() => {
        if (!Array.isArray(hideColumns) || hideColumns.length === 0) {
            return EncabezadosCoordinaciones;
        }
        const hideSet = new Set(hideColumns);
        return EncabezadosCoordinaciones.filter((col) => !hideSet.has(col.field) && !hideSet.has(col.id));
    }, [hideColumns]);
    
    useEffect(() => {
        const fetch = async() => {
            //test_comment
            await api
                .get("api/appweb/recupera-etiquetas-oracle")
                .then(({ data }) => {
                    setListadoEtiquetas(data.data || [])
                })
                .catch((e) => console.error(e));
        }
        fetch()
    }, []);
 


    useEffect(() => {
        onLoadingChange?.(isLoading);
    }, [isLoading, onLoadingChange]);


    const datosFormateados = useMemo(() => {
        return listadoEtiquetas
        ?.filter(etiqueta => historico || (moment(etiqueta.etiq_fecha).format("DD/MM/YYYY") == moment().format("DD/MM/YYYY")))
        ?.map((etiqueta, i) => {
            return {
                ...etiqueta,
                id: i, // Requerido por TablaComponent
                accionesDeTabla: {
                    view: !!onView,
                    edit: !!onEdit,
                    delete: !!onDelete,
                },
            };
        }) || []
    }, [listadoEtiquetas]);

    const handleRefresh = async () => {

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

    return (
        <TablaComponent
            titulo={`${titulo}${historico ? " - Historico" : ` - ${moment().format("DD/MM/YYYY")}`}`}
            botones={{
                refresh: {
                    label: (
                        <i className="c-actualizar" style={{ fontSize: 18 }}></i>
                    ),
                    onClick: handleRefresh,
                    disabled: isLoading,
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

export default TablaEtiquetas;
