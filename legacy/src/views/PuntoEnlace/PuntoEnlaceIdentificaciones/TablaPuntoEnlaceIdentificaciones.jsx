import { useEffect, useState, useCallback } from 'react';
import { Box } from '@mui/material';
import { api } from '../../../api';
import PropTypes from 'prop-types';
import EditableDataGridComponent from '../../../components/Tabla/EditableDataGridComponent';
import useObtenerOpcionesAcciones from '../../../hooks/useObtenerOpcionesAcciones';
import useColumnasIdentificaiones from './useColumnasIdentificaiones';
import LoaderComponent from '../../../components/Loader/LoaderComponent';
import { apagarCarga, encenderCarga } from '../../../store/slices/status/statusSlice';
import { useDispatch } from 'react-redux';


const COD_ESTADO_ACTIVO = 1;
const COD_ESTADO_INACTIVO = 2;

const mapFilaToSendToApiFormat = (fila) => {
    return {
      ...fila,
      cod_tipo: fila.tipo.cod_tipo,
      cod_estado: fila.estado.cod_estado
    }
};
  
 

const TablaPuntoEnlaceIdentificaciones = ({ cod_puntoenlace }) => {
    cod_puntoenlace = +cod_puntoenlace;
    const dispatch = useDispatch();
    const { permisosArray } = useObtenerOpcionesAcciones();

    const [listaAProcesar, setListaAProcesar] = useState([]);
    const [tipos, setTipos] = useState([]);
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


    const filasConFormatoUI = listaAProcesar.map(puntoEnlace => ({
        ...puntoEnlace,
        tipo: puntoEnlace.tipo || tipos.find(t => t.cod_tipo === puntoEnlace.cod_tipo),
        estado: puntoEnlace.estado || estados.find(e => e.cod_estado === puntoEnlace.cod_estado),
        propiedadesDeTabla: {
            nombreEstado: {
                color: 'main.green'
            }
        }
    }));


    const encabezados = useColumnasIdentificaiones({
        tipos,
        estados
    });


    const obtenerIdentificacionesDePuntoEnlace = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-identificacion-punto_enlace';
        const response = await api.get(baseApiURL, { params: { cod_puntoenlace } });
        let identificaicones = response.data.data;
        identificaicones = identificaicones.map(i => ({ 
            ...i, 
            id: i.cod_puntoenlace_identificacion,
            isNew: false
        }));
        setListaAProcesar(identificaicones);
    }, [cod_puntoenlace]);

    const obtenerTipos = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-tipo';
        const response = await api.get(baseApiURL, { params: { tipo_tabla: 'PUNTO_ENLACE_IDENTIFICACION' } });
        const tipos = response.data.data;
        setTipos(tipos);
    }, []);


    const obtenerEstados = useCallback(async () => {
        const baseApiURL = '/api/appweb/listaestados';
        const response = await api.get(baseApiURL);
        const estados = response.data.data;
        setEstados(estados);
    }, []);


    useEffect(() => {
        dispatch(encenderCarga());
        Promise.all([
            obtenerIdentificacionesDePuntoEnlace(),
            obtenerTipos(),
            obtenerEstados()
        ]).then(() => {
            setIsLoading(false);
            dispatch(apagarCarga());
        });
    }, [obtenerIdentificacionesDePuntoEnlace, obtenerTipos, obtenerEstados, dispatch]);


    const agregarPuntoEnlace = useCallback(async (row) => {
        const apiBaseURL = '/api/appweb/insertar-identificacion-punto_enlace';
        const filaConFormato = mapFilaToSendToApiFormat(row);
        const reqBody = { ...filaConFormato, cod_puntoenlace, cod_estado: COD_ESTADO_ACTIVO };
        const response = await api.post(apiBaseURL, reqBody);
        const cod_puntoenlace_identificacion = +response.data.data.cod_puntoenlace_identificacion;
        row.cod_puntoenlace_identificacion = cod_puntoenlace_identificacion;
        row.id = cod_puntoenlace_identificacion;
        row.isNew = false;
        return response.data.data.success;
    }, [cod_puntoenlace]);


    const actualizarPuntoEnlace = useCallback(async (row) => {
        const apiBaseURL = '/api/appweb/actualizar-identificacion-punto_enlace';
        const filaConFormato = mapFilaToSendToApiFormat(row);
        const response = await api.post(apiBaseURL, filaConFormato);
        return response.data.data.success;
    }, []);


    const handleAgregarFila = (row) => {
        setListaAProcesar(prev => [
            ...prev,
            { ...row, isNew: true, cod_estado: COD_ESTADO_ACTIVO }
        ]);
    };

    const handleDeleteRow = async ({ row }) => {
        row.estado = estados.find(e => e.cod_estado === COD_ESTADO_INACTIVO);
        const success = await actualizarPuntoEnlace(row);
        if (success) setListaAProcesar(prev => prev.map(r => r.id === row.id ? row : r));
    };

    const handleRowSave = async ({ id: tableRowTemporaryId, row }) => {
        const isCreating = listaAProcesar.some(r => r.id === tableRowTemporaryId && r.isNew);
        let success = isCreating ? await agregarPuntoEnlace(row) : await actualizarPuntoEnlace(row);
        if (success) {
            setListaAProcesar(prev => prev.map(r => r.id === tableRowTemporaryId ? row : r));
        } else {
            setListaAProcesar(prev => prev.filter(r => r.id !== tableRowTemporaryId));
        }
    };


    return (
        <Box sx={{ minWidth: 800 }}>
            <EditableDataGridComponent
                idKey='cod_puntoenlace_identificacion'
                encabezados={encabezados}
                datos={filasConFormatoUI}
                onAddRow={handleAgregarFila}
                onRowSave={handleRowSave}
                onDeleteRow={handleDeleteRow}
                acciones={obtenerAccionesSegunPermisos()}
                camposRequeridosParaGuardar={{
                    codigo: 'Codigo',
                    tipo: 'Tipo',
                    estado: 'Estado'
                }}
            />

            <LoaderComponent open={isLoading} />
        </Box>
    );
};


TablaPuntoEnlaceIdentificaciones.propTypes = {
    cod_puntoenlace: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};


export default TablaPuntoEnlaceIdentificaciones;