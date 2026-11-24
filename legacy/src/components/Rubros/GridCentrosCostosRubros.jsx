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
      cod_empresa: fila.empresa?.cod_empresa,
      cod_cc : fila.centroCosto?.cod_cc,
      cod_estado: fila.estado?.cod_estado
    }
};
  

const GridCentrosCostosRubros = ({ cod_rubro, catalogos }) => {
    cod_rubro = +cod_rubro;
    const dispatch = useDispatch();
    const { permisosArray } = useObtenerOpcionesAcciones();
    const { empresas, centrosCostos, estados } = catalogos;

    const [listaAProcesar, setListaAProcesar] = useState([]);
    const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const permisosBase = { ver: false, editar: false, eliminar: false, guardar: false };

    const obtenerAccionesSegunPermisos = () => {
        let item = permisosArray.find((i) => i.nom_opcion === 'Centros de Costos');
        return {
          ...permisosBase,
          agregar: item?.acciones.some((i) => i.cod_accion === 3),
          editar: item?.acciones.some((i) => i.cod_accion === 2),
          guardar: item?.acciones.some((i) => i.cod_accion === 2),
          eliminar: item?.acciones.some((i) => i.cod_accion === 5),
        };
    };


    const filasConFormatoUI = listaAProcesar.map(centroCostoRubro => {
        const empresa = centroCostoRubro.empresa ||  empresas.find(e => e.cod_empresa === centroCostoRubro.cod_empresa);
        const centroCosto = centroCostoRubro.centroCosto || centrosCostos.find(cc => cc.cod_cc === centroCostoRubro.cod_cc);
        const estado = centroCostoRubro.estado || estados.find(e => e.cod_estado === centroCostoRubro.cod_estado);
        return {
            ...centroCostoRubro,
            empresa,
            centroCosto,
            estado
        };
    });


    const centrosCostosSelccionables = centrosCostos.filter(c => c.cod_empresa_cc === empresaSeleccionada?.cod_empresa);

    const encabezados = useMemo(() => [
        {
            type: 'singleSelect',
            headerName: 'Empresa',
            field: 'empresa',
            labelOption: 'nombre_emp',
            valueOption: 'cod_empresa',
            valueOptions: empresas,
            editable: true,
        },
        {
            type: 'singleSelect',
            headerName: 'Centro De Costo',
            field: 'centroCosto',
            labelOption: 'nombre_cc',
            valueOption: 'cod_cc',
            valueOptions: centrosCostosSelccionables,
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
    ], [empresas, centrosCostosSelccionables, estados]);

    const obtenerCentrosCostosRubro = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-rubros-cenco';
        const response = await api.get(baseApiURL, { params: { cod_rubro } });
        let centrosCostos = response.data.data;
        centrosCostos = centrosCostos.map(i => ({ 
            ...i, 
            id: i.cod_rubro_cenco,
            isNew: false
        }));
        setListaAProcesar(centrosCostos);
    }, [cod_rubro]);


    useEffect(() => {
        dispatch(encenderCarga());
        Promise.all([
            obtenerCentrosCostosRubro(),
        ]).then(() => {
            setIsLoading(false);
            dispatch(apagarCarga());
        });
    }, [obtenerCentrosCostosRubro, dispatch]);


    const agregarCentroCostoDeRubro = useCallback(async (row) => {
        const apiBaseURL = '/api/appweb/insertar-rubros-cenco';
        const filaConFormato = mapFilaToSendToApiFormat(row);
        const reqBody = { ...filaConFormato, cod_rubro, cod_estado: CODS_ESTADOS.ACTIVO };
        const response = await api.post(apiBaseURL, reqBody);
        const cod_rubro_cenco = +response.data.data.cod_rubro_cenco;
        row.id = row.cod_rubro_cenco = cod_rubro_cenco;
        row.isNew = false;
        return response.data.data.success;
    }, [cod_rubro]);


    const actualizarCentroCostoDeRubro = useCallback(async (row) => {
        const apiBaseURL = '/api/appweb/actualizar-rubros-cenco';
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
        const success = await actualizarCentroCostoDeRubro(row);
        if (success) setListaAProcesar(prev => prev.map(r => r.id === row.id ? row : r));
    };


    const handleRowSave = async ({ id: tableRowTemporaryId, row }) => {
        const isCreating = listaAProcesar.some(r => r.id === tableRowTemporaryId && r.isNew);
        let success = isCreating ? await agregarCentroCostoDeRubro(row) : await actualizarCentroCostoDeRubro(row);
        if (success) {
            setListaAProcesar(prev => prev.map(r => r.id === tableRowTemporaryId ? row : r));
        } else {
            setListaAProcesar(prev => prev.filter(r => r.id !== tableRowTemporaryId));
        }
    };


    const handleInputChange = ({ field, value }) => {
        if (field === 'empresa') setEmpresaSeleccionada(value);
    };


    return (
        <Box sx={{ minWidth: 800 }}>
            <EditableDataGridComponent
                idKey='cod_rubro_cenco'
                encabezados={encabezados}
                datos={filasConFormatoUI}
                onAddRow={handleRowAdd}
                onRowSave={handleRowSave}
                onDeleteRow={handleDeleteRow}
                onInput={handleInputChange}
                acciones={obtenerAccionesSegunPermisos()}
                camposRequeridosParaGuardar={{
                    empresa: 'Empresa',
                    centroCosto: 'Centro de Costo',
                    estado: 'Estado'
                }}
            />

            <LoaderComponent open={isLoading} />
        </Box>
    )
};


GridCentrosCostosRubros.propTypes = {
    cod_rubro: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    catalogos: PropTypes.object.isRequired
};


export default GridCentrosCostosRubros;