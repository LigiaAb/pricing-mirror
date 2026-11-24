
import { useEffect, useState, useCallback } from 'react';
import { Box } from '@mui/material';
import { api } from '../../../api';
import PropTypes from 'prop-types';
import EditableDataGridComponent from '../../../components/Tabla/EditableDataGridComponent';
import useObtenerOpcionesAcciones from '../../../hooks/useObtenerOpcionesAcciones';
import useColumnasNombres from './useColumnasNombres';
import LoaderComponent from '../../../components/Loader/LoaderComponent';
import { apagarCarga, encenderCarga } from '../../../store/slices/status/statusSlice';
import { useDispatch } from 'react-redux';

const COD_ESTADO_ACTIVO = 1;
const COD_ESTADO_INACTIVO = 2;

const mapFilaToSendToApiFormat = (fila) => {
    return {
      ...fila,
      cod_estado: fila.estado.cod_estado
    }
};


const TablaPuntoEnlaceNombres = ({ cod_puntoenlace }) => {
    cod_puntoenlace = +cod_puntoenlace;
    const dispatch = useDispatch();
    const { permisosArray } = useObtenerOpcionesAcciones();

    const [listaAProcesar, setListaAProcesar] = useState([]);
    const [estados, setEstados] = useState([]);
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


    const filasConFormatoUI = listaAProcesar.map(nombrePuntoEnlace => {
        const estado = nombrePuntoEnlace.estado || estados.find(e => e.cod_estado === nombrePuntoEnlace.cod_estado);
        return {
            ...nombrePuntoEnlace,
            estado
        };
    });


    const encabezados = useColumnasNombres({
        estados
    });


    const obtenerNombreDePuntoEnlace = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-nombre-punto_enlace';
        const response = await api.get(baseApiURL, { params: { cod_puntoenlace } });
        let nombresPuntoEnlace = response.data.data;
        nombresPuntoEnlace = nombresPuntoEnlace.map(n => ({ 
            ...n, 
            id: n.cod_puntoenlace_nombre,
            isNew: false
        }));
        setListaAProcesar(nombresPuntoEnlace);
    }, [cod_puntoenlace]);

    const obtenerEstados = useCallback(async () => {
        const baseApiURL = '/api/appweb/listaestados';
        const response = await api.get(baseApiURL);
        const estados = response.data.data;
        setEstados(estados);
    }, []);

    useEffect(() => {
        dispatch(encenderCarga());
        Promise.all([
            obtenerNombreDePuntoEnlace(),
            obtenerEstados()
        ]).then(() => {
            setIsLoading(false);
            dispatch(apagarCarga());
        });
    }, [obtenerNombreDePuntoEnlace, obtenerEstados, dispatch]);

  
    const agregarNombrePuntoEnlace = useCallback(async (row) => {
        const apiBaseURL = '/api/appweb/insertar-nombre-punto_enlace';
        const filaConFormato = mapFilaToSendToApiFormat(row);
        const reqBody = { ...filaConFormato, cod_puntoenlace, cod_estado: COD_ESTADO_ACTIVO };
        const response = await api.post(apiBaseURL, reqBody);
        const cod_puntoenlace_nombre = +response.data.data.cod_puntoenlace_nombre;
        row.id = row.cod_puntoenlace_nombre = cod_puntoenlace_nombre;
        row.isNew = false;
        return response.data.data.success;
    }, [cod_puntoenlace]);


    const actualizarNombrePuntoEnlace = useCallback(async (row) => {
        const apiBaseURL = '/api/appweb/actualizar-nombre-punto_enlace';
        const filaConFormato = mapFilaToSendToApiFormat(row);
        const response = await api.post(apiBaseURL, filaConFormato);
        return response.data.data.success;
    }, []);


    const handleAgregarFila = (row) => {
        const estadoActivo = estados.find(e => e.cod_estado === COD_ESTADO_ACTIVO);
        setListaAProcesar(prev => [
            ...prev,
            { ...row, isNew: true, estado: estadoActivo, cod_estado: COD_ESTADO_ACTIVO }
        ]);
    };

    const handleDeleteRow = async ({ row }) => {
        if (row.isNew) return setListaAProcesar(prev => prev.filter(r => r.id !== row.id));

        row.estado = estados.find(e => e.cod_estado === COD_ESTADO_INACTIVO);
        const success = await actualizarNombrePuntoEnlace(row);
        if (success) setListaAProcesar(prev => prev.map(r => r.id === row.id ? row : r));
    };


    const handleRowSave = async ({ id: tableRowTemporaryId, row }) => {
        const isCreating = listaAProcesar.some(r => r.id === tableRowTemporaryId && r.isNew);
        let success = isCreating ? await agregarNombrePuntoEnlace(row) : await actualizarNombrePuntoEnlace(row);
        if (success) {
            setListaAProcesar(prev => prev.map(r => r.id === tableRowTemporaryId ? row : r));
        } else {
            setListaAProcesar(prev => prev.filter(r => r.id !== tableRowTemporaryId));
        }
    };


    return (
        <Box sx={{ minWidth: 800 }}>
            <EditableDataGridComponent
                idKey='cod_puntoenlace_nombre'
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
    );
};


TablaPuntoEnlaceNombres.propTypes = {
    cod_puntoenlace: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};


export default TablaPuntoEnlaceNombres;