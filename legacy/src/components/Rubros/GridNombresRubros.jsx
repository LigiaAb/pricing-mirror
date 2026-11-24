
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import { api } from '../../api';
import PropTypes from 'prop-types';
import EditableDataGridComponent from '../Tabla/EditableDataGridComponent';
import useObtenerOpcionesAcciones from '../../hooks/useObtenerOpcionesAcciones';
import LoaderComponent from '../Loader/LoaderComponent';
import { apagarCarga, encenderCarga } from '../../store/slices/status/statusSlice';
import { useDispatch } from 'react-redux';


const CODS_ESTADOS = {
    ACTIVO: 1,
    INACTIVO: 2
};

const mapFilaToSendToApiFormat = (fila) => {
    return {
      ...fila,
      cod_estado: fila.estado.cod_estado
    }
};


const GridNombresRubros = ({ cod_rubro, catalogos }) => {
    cod_rubro = +cod_rubro;
    const dispatch = useDispatch();
    const { permisosArray } = useObtenerOpcionesAcciones();
    const { estados } = catalogos;

    const [listaAProcesar, setListaAProcesar] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const permisosBase = { ver: false, editar: false, eliminar: false, guardar: false };

    const obtenerAccionesSegunPermisos = () => {
        let item = permisosArray.find((i) => i.nom_opcion === 'Lista');
        return {
          ...permisosBase,
          agregar: item?.acciones.some((i) => i.cod_accion === 3),
          editar: item?.acciones.some((i) => i.cod_accion === 2),
          guardar: item?.acciones.some((i) => i.cod_accion === 2),
          eliminar: item?.acciones.some((i) => i.cod_accion === 5),
        };
    };

    
    const filasConFormatoUI = listaAProcesar.map(nombreRubro => {
        const estado = nombreRubro.estado || estados.find(e => e.cod_estado === nombreRubro.cod_estado);
        return {
            ...nombreRubro,
            estado
        };
    });


    const encabezados = useMemo(() => [
        { 
            type: 'text',
            headerName: 'Nombre',
            field: 'nombre',
            editable: true,
        },
        {
            type: 'singleSelect',
            headerName: 'Estado',
            field: 'estado',
            labelOption: 'estado_desc',
            valueOption: 'cod_estado',
            valueOptions: estados,
            editable: false,
        }
    ], [estados]);


    const obtenerNombresRubros = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-nombres-rubros';
        const response = await api.get(baseApiURL, { params: { cod_rubro } });
        let nombresPuntoEnlace = response.data.data;
        nombresPuntoEnlace = nombresPuntoEnlace.map(n => ({ 
            ...n, 
            id: n.cod_rubro_nombre,
            isNew: false
        }));
        setListaAProcesar(nombresPuntoEnlace);
    }, [cod_rubro]);


    useEffect(() => {
        dispatch(encenderCarga());
        Promise.all([
            obtenerNombresRubros(),
        ]).then(() => {
            setIsLoading(false);
            dispatch(apagarCarga());
        });
    }, [obtenerNombresRubros, dispatch]);


    const agregarNombreRubro = useCallback(async (row) => {
        const apiBaseURL = '/api/appweb/insertar-nombres-rubros';
        const filaConFormato = mapFilaToSendToApiFormat(row);
        const reqBody = { ...filaConFormato, cod_rubro, cod_estado: CODS_ESTADOS.ACTIVO };
        const response = await api.post(apiBaseURL, reqBody);
        const cod_rubro_nombre = +response.data.data.cod_rubro_nombre;
        row.id = row.cod_rubro_nombre = cod_rubro_nombre;
        row.isNew = false;
        return response.data.data.success;
    }, [cod_rubro]);


    const actualizarNombreRubro = useCallback(async (row) => {
        const apiBaseURL = '/api/appweb/actualizar-nombres-rubros';
        const filaConFormato = mapFilaToSendToApiFormat(row);
        const response = await api.post(apiBaseURL, filaConFormato);
        return response.data.data.success;
    }, []);


    const handleAgregarFila = (row) => {
        const estadoActivo = estados.find(e => e.cod_estado === CODS_ESTADOS.ACTIVO);
        setListaAProcesar(prev => [
            ...prev,
            { ...row, isNew: true, estado: estadoActivo, cod_estado: CODS_ESTADOS.ACTIVO, cod_rubro }
        ]);
    };

    const handleDeleteRow = async ({ row }) => {
        if (row.isNew) return setListaAProcesar(prev => prev.filter(r => r.id !== row.id));

        row.estado = estados.find(e => e.cod_estado === CODS_ESTADOS.INACTIVO);
        const success = await actualizarNombreRubro(row);
        if (success) setListaAProcesar(prev => prev.map(r => r.id === row.id ? row : r));
    };

    const handleRowSave = async ({ id: tableRowTemporaryId, row }) => {
        const isCreating = listaAProcesar.some(r => r.id === tableRowTemporaryId && r.isNew);
        let success = isCreating ? await agregarNombreRubro(row) : await actualizarNombreRubro(row);
        if (success) {
            setListaAProcesar(prev => prev.map(r => r.id === tableRowTemporaryId ? row : r));
        } else {
            setListaAProcesar(prev => prev.filter(r => r.id !== tableRowTemporaryId));
        }
    };


    return (
        <Box sx={{ minWidth: 800 }}>
            <EditableDataGridComponent
                idKey='cod_rubro_nombre'
                encabezados={encabezados}
                datos={filasConFormatoUI}
                onAddRow={handleAgregarFila}
                onRowSave={handleRowSave}
                onDeleteRow={handleDeleteRow}
                acciones={obtenerAccionesSegunPermisos()}
                camposRequeridosParaGuardar={{
                    nombre: 'Nombre',
                    estado: 'Estado'
                }}
            />

            <LoaderComponent open={isLoading} />
        </Box>
    )
};


GridNombresRubros.propTypes = {
    cod_rubro: PropTypes.isRequired,
    catalogos: PropTypes.object.isRequired
};


export default GridNombresRubros;