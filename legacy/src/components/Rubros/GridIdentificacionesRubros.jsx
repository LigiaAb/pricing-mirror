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
    const filaConFormato = {
        ...fila,
        cod_tipo: fila.tipo.cod_tipo,
        cod_estado: fila.estado.cod_estado
    };

    delete filaConFormato.tipo;
    delete filaConFormato.estado;
    return filaConFormato;
};
  

const GridIdentificacionesRubros = ({ cod_rubro, catalogos }) => {
    cod_rubro = +cod_rubro;
    const dispatch = useDispatch();
    const { permisosArray } = useObtenerOpcionesAcciones();
    const { tiposIdentificaciones = [], estados = [] } = catalogos;

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


    const filasConFormatoUI = listaAProcesar.map(identificacionRubro => {
        const estado = identificacionRubro.estado || estados.find(e => e.cod_estado === identificacionRubro.cod_estado);
        return {
            ...identificacionRubro,
            estado
        };
    });


    const encabezados = useMemo(() => [
        {
            type: 'singleSelect',
            headerName: 'Tipo de Identificación',
            field: 'tipo',
            labelOption: 'nom_tipo',
            valueOption: 'cod_tipo',
            valueOptions: tiposIdentificaciones,
            editable: true,
        },
        { 
            type: 'text',
            headerName: 'Codigo',
            field: 'codigo',
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
    ], [tiposIdentificaciones, estados]);


    const obtenerIdentificacionesDeRubro = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-identificacion-rubros';
        const response = await api.get(baseApiURL, { params: { cod_rubro } });
        let identificaicones = response.data.data;
        identificaicones = identificaicones.map(i => ({ 
            ...i, 
            id: i.cod_rubro_identificacion,
            isNew: false
        }));
        setListaAProcesar(identificaicones);
    }, [cod_rubro]);


    useEffect(() => {
        dispatch(encenderCarga());
        Promise.all([
            obtenerIdentificacionesDeRubro(),
        ]).then(() => {
            setIsLoading(false);
            dispatch(apagarCarga());
        });
    }, [obtenerIdentificacionesDeRubro, dispatch]);


    const agregarIdentificacionDeRubro = useCallback(async (row) => {
        const apiBaseURL = '/api/appweb/insertar-identificacion-rubros';
        const filaConFormato = mapFilaToSendToApiFormat(row);
        const reqBody = { ...filaConFormato, cod_rubro, cod_estado: CODS_ESTADOS.ACTIVO };
        const response = await api.post(apiBaseURL, reqBody);
        const cod_rubro_identificacion = +response.data.data.cod_rubro_identificacion;
        row.id = row.cod_puntoenlace_identificacion = cod_rubro_identificacion;
        row.isNew = false;
        return response.data.data.success;
    }, [cod_rubro]);


    const actualizarIdentifiacionDeRubro = useCallback(async (row) => {
        const apiBaseURL = '/api/appweb/actualizar-identificacion-rubros';
        const filaConFormato = mapFilaToSendToApiFormat(row);
        const response = await api.post(apiBaseURL, filaConFormato);
        return response.data.data.success;
    }, []);
    

    const handleRowAdd = (row) => {
        const estadoActivo = estados.find(e => e.cod_estado === CODS_ESTADOS.ACTIVO);
        setListaAProcesar(prev => [
            ...prev,
            { ...row, isNew: true, estado: estadoActivo, cod_estado: CODS_ESTADOS.ACTIVO, cod_rubro }
        ]);
    };

    const handleDeleteRow = async ({ row }) => {
        if (row.isNew) return setListaAProcesar(prev => prev.filter(r => r.id !== row.id));

        row.estado = estados.find(e => e.cod_estado === CODS_ESTADOS.INACTIVO);
        const success = await actualizarIdentifiacionDeRubro(row);
        if (success) setListaAProcesar(prev => prev.map(r => r.id === row.id ? row : r));
    };


    const handleRowSave = async ({ id: tableRowTemporaryId, row }) => {
        const isCreating = listaAProcesar.some(r => r.id === tableRowTemporaryId && r.isNew);
        let success = isCreating ? await agregarIdentificacionDeRubro(row) : await actualizarIdentifiacionDeRubro(row);
        if (success) {
            setListaAProcesar(prev => prev.map(r => r.id === tableRowTemporaryId ? row : r));
        } else {
            setListaAProcesar(prev => prev.filter(r => r.id !== tableRowTemporaryId));
        }
    };


    return (
        <Box sx={{ minWidth: 800 }}>
            <EditableDataGridComponent
                idKey='cod_rubro_identificacion'
                encabezados={encabezados}
                datos={filasConFormatoUI}
                onAddRow={handleRowAdd}
                onRowSave={handleRowSave}
                onDeleteRow={handleDeleteRow}
                acciones={obtenerAccionesSegunPermisos()}
                camposRequeridosParaGuardar={{
                    codigo: 'Codigo',
                    estado: 'Estado'
                }}
            />

            <LoaderComponent open={isLoading} />
        </Box>
    )
};


GridIdentificacionesRubros.propTypes = {
    cod_rubro: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    catalogos: PropTypes.object.isRequired
};


export default GridIdentificacionesRubros;