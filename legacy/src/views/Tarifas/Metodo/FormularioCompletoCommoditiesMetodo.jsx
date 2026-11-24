
import { useEffect, useState, useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import { api } from '../../../api';
import PropTypes from 'prop-types';
import EditableDataGridComponent from '../../../components/Tabla/EditableDataGridComponent';
import useObtenerOpcionesAcciones from '../../../hooks/useObtenerOpcionesAcciones';
import LoaderComponent from '../../../components/Loader/LoaderComponent';
import { apagarCarga, encenderCarga } from '../../../store/slices/status/statusSlice';
import { useDispatch } from 'react-redux';


const CODS_ESTADOS = {
    ACTIVO: 1,
    INACTIVO: 2
};

const mapFilaToSendToApiFormat = (fila) => {
    const filaConFormato = {
      ...fila,
      cod_commodity: fila.commodity?.cod_commodity,
      cod_estado: fila.estado.cod_estado
    }

    delete filaConFormato.commodity;
    delete filaConFormato.estado;

    return filaConFormato;
};


const FormularioCompletoCommoditiesMetodo = ({ metodo, catalogos }) => {
    const cod_metodo = +metodo.cod_metodo;
    const dispatch = useDispatch();
    const { permisosArray } = useObtenerOpcionesAcciones();
    const { commodities,  estados } = catalogos;

    const [listaAProcesar, setListaAProcesar] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const permisosBase = { ver: false, editar: false, eliminar: false, guardar: false };

    const obtenerAccionesSegunPermisos = () => {
        let item = permisosArray.find(i => i.nom_opcion === 'Lista');
        return {
          ...permisosBase,
          agregar: item?.acciones.some(i => i.cod_accion === 3) || true,
          editar: item?.acciones.some(i => i.cod_accion === 2) || true,
          guardar: item?.acciones.some(i => i.cod_accion === 2) || true,
          eliminar: item?.acciones.some(i => i.cod_accion === 5) || true,
        };
    };


    const filasConFormatoUI = listaAProcesar.map(commodityMetodo => {
        const commodity = commodityMetodo.commodity || commodities.find(c => c.cod_commodity === commodityMetodo.cod_commodity);
        const estado = commodityMetodo.estado || estados.find(e => e.cod_estado === commodityMetodo.cod_estado);
        return {
            ...commodityMetodo,
            commodity,
            estado
        };
    });


    const commoditiesSelccionables = useMemo(() => commodities.filter(c => {
        const isCommodityDisponible =  !listaAProcesar.find(cm => 
            cm.cod_commodity === c.cod_commodity && 
            cm.cod_estado === CODS_ESTADOS.ACTIVO
        );
        return isCommodityDisponible;
    }), [listaAProcesar, commodities]);
    
    const encabezados = useMemo(() => [
        { 
            type: 'singleSelect',
            headerName: 'Commodity',
            field: 'commodity',
            labelOption: 'nombre',
            valueOption: 'cod_commodity',
            valueOptions: commoditiesSelccionables,
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
    ], [commoditiesSelccionables, estados]);


    const obtenerCommoditiesMetodo = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-metodo-commodity';
        const response = await api.get(baseApiURL, { params: { cod_metodo } });
        let commoditiesMetodo = response.data.data;
        commoditiesMetodo = commoditiesMetodo.map(cm => ({ 
            ...cm, 
            id: cm.cod_metodocommodity,
            isNew: false
        }));
        setListaAProcesar(commoditiesMetodo);
    }, [cod_metodo]);


    useEffect(() => {
        dispatch(encenderCarga());
        Promise.all([
            obtenerCommoditiesMetodo(),
        ]).then(() => {
            setIsLoading(false);
            dispatch(apagarCarga());
        });
    }, [dispatch, obtenerCommoditiesMetodo]);


    const agregarCommodity = useCallback(async (row) => {
        const apiBaseURL = '/api/appweb/insertar-metodo-commodity';
        const filaConFormato = mapFilaToSendToApiFormat(row);
        const reqBody = { ...filaConFormato, cod_metodo, cod_estado: CODS_ESTADOS.ACTIVO };
        const response = await api.post(apiBaseURL, reqBody);
        const cod_metodocommodity = +response.data.data.cod_metodocommodity;
        row.id = row.cod_metodocommodity = cod_metodocommodity;
        row.isNew = false;
        return response.data.data.success;
    }, [cod_metodo]);


    const actualizarCommodity = useCallback(async (row) => {
        const apiBaseURL = '/api/appweb/actualizar-metodo-commodity';
        const filaConFormato = mapFilaToSendToApiFormat(row);
        const response = await api.post(apiBaseURL, filaConFormato);
        return response.data.data.success;
    }, []);


    const handleAgregarFila = (row) => {
        const estadoActivo = estados.find(e => e.cod_estado === CODS_ESTADOS.ACTIVO);
        setListaAProcesar(prev => [
            ...prev,
            { ...row, isNew: true, estado: estadoActivo, cod_estado: CODS_ESTADOS.ACTIVO, cod_metodo }
        ]);
    };

    const handleDeleteRow = async ({ row }) => {
        if (row.isNew) return setListaAProcesar(prev => prev.filter(r => r.id !== row.id));

        const estadoInactivo = estados.find(e => e.cod_estado === CODS_ESTADOS.INACTIVO);
        row.estado = estadoInactivo;
        row.cod_estado = CODS_ESTADOS.INACTIVO;
        const success = await actualizarCommodity(row);
        if (success) setListaAProcesar(prev => prev.map(r => r.id === row.id ? row : r));
    };

    const handleRowSave = async ({ id: tableRowTemporaryId, row }) => {
        const isCreating = listaAProcesar.some(r => r.id === tableRowTemporaryId && r.isNew);
        let success = isCreating ? await agregarCommodity(row) : await actualizarCommodity(row);
        if (success) {
            setListaAProcesar(prev => prev.map(r => r.id === tableRowTemporaryId ? {
                ...row,
                cod_commodity: row.commodity?.cod_commodity,
                cod_estado: row.estado?.cod_estado
            } : r));
        } else {
            setListaAProcesar(prev => prev.filter(r => r.id !== tableRowTemporaryId));
        }
    };


    return (
        <Box sx={{ minWidth: 800 }}>
            <EditableDataGridComponent
                idKey='cod_metodocommodity'
                encabezados={encabezados}
                datos={filasConFormatoUI}
                onAddRow={handleAgregarFila}
                onRowSave={handleRowSave}
                onDeleteRow={handleDeleteRow}
                acciones={obtenerAccionesSegunPermisos()}
                camposRequeridosParaGuardar={{
                    commodity: 'Commodity',
                    estado: 'Estado'
                }}
            />

            <LoaderComponent open={isLoading} />
        </Box>
    );
};


FormularioCompletoCommoditiesMetodo.propTypes = {
    metodo: PropTypes.object.isRequired,
    catalogos: PropTypes.shape({
        commodities: PropTypes.array.isRequired,
        estados: PropTypes.array.isRequired
    }).isRequired
};


export default FormularioCompletoCommoditiesMetodo;