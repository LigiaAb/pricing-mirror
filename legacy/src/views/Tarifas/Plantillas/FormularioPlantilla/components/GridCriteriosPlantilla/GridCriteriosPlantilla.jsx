import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Box } from '@mui/material';
import { api } from '../../../../../../api';
import PropTypes from 'prop-types';
import EditableDataGridComponent from '../../../../../../components/Tabla/EditableDataGridComponent';
import useObtenerOpcionesAcciones from '../../../../../../hooks/useObtenerOpcionesAcciones';
import useColumnasGridCriteriosPlantilla from './hooks/useColumnasGridCriteriosPlantilla';
import { apagarCarga, encenderCarga } from '../../../../../../store/slices/status/statusSlice';
import { useDispatch } from 'react-redux';


const CODS_ESTADOS = {
    ACTIVO: 1,
    INACTIVO: 2
};

const mapFilaToSendToApiFormat = (fila) => {
    return {
      ...fila,
      cod_criterio: fila.criterio.cod_criterio,
      cod_estado: fila.estado ? CODS_ESTADOS.ACTIVO : CODS_ESTADOS.INACTIVO,
    }
};


const GridCriteriosPlantilla = ({
    cod_tarifaplantilla,
    catalogos
}) => {
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
          agregar: true, // item?.acciones.some((i) => i.cod_accion === 3),
          editar: true, // item?.acciones.some((i) => i.cod_accion === 2),
          guardar: true, // item?.acciones.some((i) => i.cod_accion === 2),
          eliminar: true, // item?.acciones.some((i) => i.cod_accion === 5),
        };
    };

    const filasConFormatoUI = listaAProcesar.map(criterioPlantilla => {
        const criterio = criterioPlantilla.criterio || catalogos.criterios.find(c => c.cod_criterio === criterioPlantilla.cod_criterio);
        const filaConFormatoUI = {
            ...criterioPlantilla,
            criterio,
            estado: criterioPlantilla.cod_estado === CODS_ESTADOS.ACTIVO
        };
        return filaConFormatoUI;
    });


    const obtenerCriteriosDePlantilla = useCallback(async () => {
        if (!cod_tarifaplantilla) return;
        const baseApiURL = '/api/appweb/lista-plantilla-criterio';
        const response = await api.get(baseApiURL, { params: { cod_tarifaplantilla } });
        let criterios = response.data.data;
        criterios = criterios.map(i => ({ 
            ...i, 
            id: i.cod_plantillarubro,
            isNew: false
        }));
        setListaAProcesar(criterios);
    }, [cod_tarifaplantilla]);


    const columnas = useColumnasGridCriteriosPlantilla({
        catalogos
    });


    useEffect(() => {
        dispatch(encenderCarga());
        Promise.all([
            obtenerCriteriosDePlantilla(),
        ]).then(() => {
            setIsLoading(false);
            dispatch(apagarCarga());
        });
    }, [obtenerCriteriosDePlantilla, dispatch]);


    const agregarCriterioDePlantila = useCallback(async (row) => {
        const apiBaseURL = '/api/appweb/insertar-plantilla-criterio';
        const filaConFormato = mapFilaToSendToApiFormat(row);
        const reqBody = { ...filaConFormato, cod_tarifaplantilla, cod_estado: CODS_ESTADOS.ACTIVO };
        const response = await api.post(apiBaseURL, reqBody);
        const cod_plantillacriterio = +response.data.data.cod_plantillacriterio;
        row.id = row.cod_plantillacriterio = cod_plantillacriterio;
        row.isNew = false;
        return response.data.data.success;
    }, [cod_tarifaplantilla]);


    const actualizarCriterioDePlantilla = useCallback(async (row) => {
        const apiBaseURL = '/api/appweb/actualizar-plantilla-criterio';
        const filaConFormato = mapFilaToSendToApiFormat(row);
        const response = await api.post(apiBaseURL, filaConFormato);
        return response.data.data.success;
    }, []);


    const handleRowAdd = (row) => {
        setListaAProcesar(prev => [
            ...prev,
            { ...row, isNew: true, estado: true, cod_estado: CODS_ESTADOS.ACTIVO }
        ]);
    };


    const handleDeleteRow = async ({ row }) => {
        if (row.isNew) return setListaAProcesar(prev => prev.filter(r => r.id !== row.id));

        row.estado = estados.find(e => e.cod_estado === CODS_ESTADOS.INACTIVO);
        const success = await actualizarCriterioDePlantilla(row);
        if (success) setListaAProcesar(prev => prev.map(r => r.id === row.id ? row : r));
    };


    const handleRowSave = async ({ id: tableRowTemporaryId, row }) => {
        const isCreating = listaAProcesar.some(r => r.id === tableRowTemporaryId && r.isNew);
        let success = isCreating ? await agregarCriterioDePlantila(row) : await actualizarCriterioDePlantilla(row);
        if (success) {
            setListaAProcesar(prev => prev.map(r => r.id === tableRowTemporaryId ? row : r));
        } else {
            setListaAProcesar(prev => prev.filter(r => r.id !== tableRowTemporaryId));
        }
    };


    return (
        <>
            <EditableDataGridComponent
                idKey='cod_plantillacriterio'
                encabezados={columnas}
                datos={filasConFormatoUI}
                onAddRow={handleRowAdd}
                onRowSave={handleRowSave}
                onDeleteRow={handleDeleteRow}
                acciones={obtenerAccionesSegunPermisos()}
                camposRequeridosParaGuardar={{
                    criterio: 'Criterio'
                }}
            />
        </>
    )
};


GridCriteriosPlantilla.propTypes = {
    cod_tarifaplantilla: PropTypes.number.isRequired,
    catalogos: PropTypes.object.isRequired
};


export default GridCriteriosPlantilla;