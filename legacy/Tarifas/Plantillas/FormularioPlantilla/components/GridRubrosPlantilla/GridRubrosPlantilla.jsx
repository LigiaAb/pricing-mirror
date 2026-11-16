import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Box } from '@mui/material';
import { api } from '../../../../../../api';
import PropTypes from 'prop-types';
import EditableDataGridComponent from '../../../../../../components/Tabla/EditableDataGridComponent';
import useObtenerOpcionesAcciones from '../../../../../../hooks/useObtenerOpcionesAcciones';
import { apagarCarga, encenderCarga } from '../../../../../../store/slices/status/statusSlice';
import { useDispatch } from 'react-redux';
import useColumnasGridRubrosPlantilla from './hooks/useColumnasGridRubrosPlantilla';


const CODS_ESTADOS = {
    ACTIVO: 1,
    INACTIVO: 2
};

const mapFilaToSendToApiFormat = (fila) => {
    const filaConFormato = {
      ...fila,
      cod_rubro: fila.rubro?.cod_rubro,
      obligatorio: !!fila.obligatorio
    }
    return filaConFormato;
};


const GridRubrosPlantilla = ({ 
    cod_tarifaplantilla,
    catalogos
}) => {
    const dispatch = useDispatch();
    const { permisosArray } = useObtenerOpcionesAcciones();
    const { estados } = catalogos;

    const [listaAProcesar, setListaAProcesar] = useState([]);
    const [filaSeleccionada, setFilaSeleccionada] = useState(null);
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

    const filasConFormatoUI = listaAProcesar.map(rubroPlantilla => {
        const rubro = rubroPlantilla.rubro || catalogos.rubros.find(e => e.cod_rubro === rubroPlantilla.cod_rubro);
        const filaConFormatoUI = {
            ...rubroPlantilla,
            rubro,
            obligatorio: !!rubroPlantilla.obligatorio,
            isActive: rubroPlantilla.cod_estado === CODS_ESTADOS.ACTIVO
        };
        return filaConFormatoUI;
    });


    const obtenerRubrosDePlantilla = useCallback(async () => {
        if (!cod_tarifaplantilla) return;
        const baseApiURL = '/api/appweb/lista-plantilla-rubro';
        const response = await api.get(baseApiURL, { params: { cod_tarifaplantilla } });
        let rubros = response.data.data;
        rubros = rubros.map(r => ({ 
            ...r, 
            id: r.cod_plantillarubro,
            isNew: false
        }));
        setListaAProcesar(rubros);
    }, [cod_tarifaplantilla]);


    const columnas = useColumnasGridRubrosPlantilla({
        filaSeleccionada,
        catalogos
    });


    useEffect(() => {
        dispatch(encenderCarga());
        Promise.all([
            obtenerRubrosDePlantilla(),
        ]).then(() => {
            setIsLoading(false);
            dispatch(apagarCarga());
        });
    }, [obtenerRubrosDePlantilla, dispatch]);


    const agregarRubroDePlantila = useCallback(async (row) => {
        const apiBaseURL = '/api/appweb/insertar-plantilla-rubro';
        const filaConFormato = mapFilaToSendToApiFormat(row);
        const reqBody = { ...filaConFormato, cod_tarifaplantilla, cod_estado: CODS_ESTADOS.ACTIVO };
        const response = await api.post(apiBaseURL, reqBody);
        const cod_plantillarubro = +response.data.data.cod_plantillarubro;
        row.id = row.cod_plantillarubro = cod_plantillarubro;
        row.isNew = false;
        return response.data.data.success;
    }, [cod_tarifaplantilla]);


    const actualizarRubroDePlantilla = useCallback(async (row) => {
        const apiBaseURL = '/api/appweb/actualizar-plantilla-rubro';
        const filaConFormato = mapFilaToSendToApiFormat(row);
        const response = await api.post(apiBaseURL, { ...filaConFormato, cod_tarifaplantilla });
        return response.data.data.success;
    }, [cod_tarifaplantilla]);


    const handleRowAdd = (row) => {
        const estadoActivo = estados.find(e => e.cod_estado === CODS_ESTADOS.ACTIVO);
        const nuevaFila = {
            ...row,
            isNew: true,
            cod_estado: CODS_ESTADOS.ACTIVO,
            estado: estadoActivo,
        };

        setListaAProcesar(prev => [
            ...prev,
            nuevaFila
        ]);
        setFilaSeleccionada(nuevaFila);
    };


    const handleDeleteRow = async ({ row }) => {
        if (row.isNew) return setListaAProcesar(prev => prev.filter(r => r.id !== row.id));
        row.cod_estado = CODS_ESTADOS.INACTIVO;
        row.estado = estados.find(e => e.cod_estado === CODS_ESTADOS.INACTIVO);
        const success = await actualizarRubroDePlantilla(row);
        if (success) setListaAProcesar(prev => prev.map(r => r.id === row.id ? row : r));
    };


    const handleRowSave = async ({ id: tableRowTemporaryId }) => {
        const isCreating = listaAProcesar.some(r => r.id === tableRowTemporaryId && r.isNew);
        let success = isCreating ? await agregarRubroDePlantila(filaSeleccionada) : await actualizarRubroDePlantilla(filaSeleccionada);
        if (success) {
            setListaAProcesar(prev => prev.map(r => r.id === tableRowTemporaryId ? filaSeleccionada : r));
        } else {
            setListaAProcesar(prev => prev.filter(r => r.id !== tableRowTemporaryId));
        }
    };


    const handleInputChange = ({ field, value }) => {
        setFilaSeleccionada(prev => {
            const nuevoValor = { ...prev, [field]: value };

            if (field === 'isActive') nuevoValor.cod_estado = value ? CODS_ESTADOS.ACTIVO : CODS_ESTADOS.INACTIVO;

            return nuevoValor;
        });
    };


    return (
        <>
            <EditableDataGridComponent
                idKey='cod_plantillarubro'
                encabezados={columnas}
                datos={filasConFormatoUI}
                onAddRow={handleRowAdd}
                onRowSave={handleRowSave}
                onDeleteRow={handleDeleteRow}
                acciones={obtenerAccionesSegunPermisos()}
                onEdditRow={(data) => setFilaSeleccionada(data?.row || null)}
                onInput={handleInputChange}
                camposRequeridosParaGuardar={{
                    rubro: 'Rubro'
                }}
            />
        </>
    )
};


GridRubrosPlantilla.propTypes = {
    cod_tarifaplantilla: PropTypes.number.isRequired,
    catalogos: PropTypes.object.isRequired
};


export default GridRubrosPlantilla;