import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import { api } from '../../api';;
import { encryptId } from '../../api/encryptDecrypt';
import moment from 'moment/moment'
import TablaComponent from '../../components/Tabla/TablaComponent';
import ActionAlertComponent from '../../components/Dialog/ActionAlertComponent';
import useObtenerOpcionesAcciones from '../../hooks/useObtenerOpcionesAcciones';
import { apagarCarga, encenderCarga } from '../../store/slices/status/statusSlice';
import { useDispatch } from 'react-redux';


const COD_ESTADO_INACTIVO = 2;

const COD_ESTADOS = {
    ACTIVO: 1,
    INACTIVO: 2
};
  
const COLORES_ESTADOS = {
    [COD_ESTADOS.ACTIVO]: 'green.main',
    [COD_ESTADOS.INACTIVO]: 'red.main'
};


const ListaTipoCentroCosto = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { permisosArray } = useObtenerOpcionesAcciones();
  
    let item = permisosArray.find((i) => i.nom_opcion === 'Lista');
    const accionesDeTabla = {
        view: item?.acciones.some((i) => i.cod_accion === 1),
        edit: item?.acciones.some((i) => i.cod_accion === 2),
        delete: item?.acciones.some((i) => i.cod_accion === 5)
    };
    
    const botonesDeTabla = {};
    if (item?.acciones.some((i) => i.cod_accion === 3)) {
        botonesDeTabla.add = { label: 'nuevo', color: 'primary', onClick: () => navigate('crear') };
    };

    const [tiposCentrosCostos, setTiposCentrosCostos] = useState([]);
    const [tipoCentroCostoSeleccionado, setTipoCentroCostoSeleccionado] = useState(null);
    const [empresas, setEmpresas] = useState([]);
    const [centrosCostos, setCentrosCostos] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [estados, setEstados] = useState([]);
    const [isOpenConfirmacionBorrado, setIsOpenConfirmacionBorrado] = useState(false);

    
    const columnas = [

        {
            label: 'Tipo',
            campo: 'tipo',
            name: 'tipo'
        },
        {
            label: 'Tabla del Tipo',
            campo: 'tipo_tabla',
            name: 'tipo_tabla'
        },
        {
            label: 'Empresa',
            campo: 'empresa',
            name: 'empresa'
        },
        {
            label: 'Centro de Costo',
            campo: 'centroCosto',
            name: 'centroCosto'
        },
        {
            label: 'Fecha de Inicio',
            campo: 'fechaInicio',
            name: 'fechaInicio'
        },
        {
            label: 'Fecha de Fin',
            campo: 'fechaFin',
            name: 'fechaFin'
        },
        {
            label: 'Estado',
            campo: 'estado',
            name: 'estado'
        }
    ];


    const obtenerTiposCentrosCostos = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-tipo-cenco';
        const response = await api.get(baseApiURL);
        const tiposCentrosCostos = response.data.data;
        setTiposCentrosCostos(tiposCentrosCostos);
    }, []);

    const obtenerEmpresas = useCallback(async () => {
        const apiBaseURL = '/api/appweb/listaempresas';
        const response = await api.get(apiBaseURL);
        const empresas = response.data.data;
        setEmpresas(empresas);
    }, []);

    const obtenerCentrosCostos = useCallback(async () => {
        const apiBaseURL = '/api/appweb/listacentrocosto';
        const response = await api.get(apiBaseURL);
        const centrosCostos = response.data.data;
        setCentrosCostos(centrosCostos);
    }, []);

    const obtenerTipos = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-tipo';
        const response = await api.get(baseApiURL);
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
            obtenerTiposCentrosCostos(),
            obtenerEmpresas(),
            obtenerCentrosCostos(),
            obtenerTipos(),
            obtenerEstados()
        ]).then(() => {
          dispatch(apagarCarga());
        });
      }, [obtenerTiposCentrosCostos, obtenerEmpresas, obtenerCentrosCostos, obtenerTipos, obtenerEstados, dispatch]);


    const tipoPorCentroCostoConFormatoTabla = tiposCentrosCostos.map(tc => {
        return {
            ...tc,
            tipo: tipos.find(t => t.cod_tipo === tc.cod_tipo)?.nom_tipo,
            empresa: empresas.find(e => e.cod_empresa === tc.cod_empresa)?.nombre_emp,
            centroCosto: centrosCostos.find(cc => cc.cod_cc === tc.cod_cenco)?.nombre_cc,
            fechaInicio: moment(tc.fecha_inicio).format('DD-MM-YYYY HH:mm:ss'),
            fechaFin: tc.fecha_fin ? moment(tc.fecha_fin).format('DD-MM-YYYY HH:mm:ss') : 'N/A',
            estado: estados.find(e => e.cod_estado === tc.cod_estado)?.estado_desc,
            accionesDeTabla,
            propiedadesDeTabla: {
              estado: {
                color: COLORES_ESTADOS[tc.cod_estado]
              }
            }
        }
    });


    const borrarTipoCentroCosto = async () => {
        const fecha_fin = new Date();
        const baseApiURL = '/api/appweb/actualizar-tipo-cenco';
        const response = await api.post(baseApiURL, {
            ...tipoCentroCostoSeleccionado,
            fecha_inicio: new Date(tipoCentroCostoSeleccionado.fecha_inicio),
            fecha_fin,
            cod_estado: COD_ESTADO_INACTIVO 
        });
        if (!response.data.data.success) return;
        setTiposCentrosCostos(prev => prev.map(tc => tc.cod_tipo_cenco === tipoCentroCostoSeleccionado.cod_tipo_cenco ? { ...tc, fecha_fin, cod_estado: COD_ESTADO_INACTIVO } : tc));
    };


    const handleBorrarTipoCentroCosto = tipoCentroCosto => {
        setTipoCentroCostoSeleccionado(tipoCentroCosto);
        setIsOpenConfirmacionBorrado(true);
    };


    return (
        <Box display='flex' flexDirection='column' p={1} m={0} gap={2}>
            <Typography variant='h4'>
                Lista de Tipos por Centros de Costos
            </Typography>
            
            <TablaComponent
                titulo='Tipos Por Centro de Costo'
                id='cod_tipo_cenco'
                encabezado={columnas}
                datos={tipoPorCentroCostoConFormatoTabla}
                botones={botonesDeTabla}
                eventosDeTabla={{
                    view: ({ id: cod_tipo_cenco }) => navigate(encryptId(cod_tipo_cenco)),
                    edit: ({ id: cod_tipo_cenco }) => navigate(`editar/${encryptId(cod_tipo_cenco)}`),
                    delete: ({ content: tipoCentroCosto }) => handleBorrarTipoCentroCosto(tipoCentroCosto)
                }}
            />

            <ActionAlertComponent
                tipo='error'
                content='¿Esta seguro que desea eliminar el registro?'
                openDialog={isOpenConfirmacionBorrado}
                aceptar={() => {
                    borrarTipoCentroCosto();
                    setIsOpenConfirmacionBorrado(false);
                }}
                cancelar={() => {
                    setIsOpenConfirmacionBorrado(false);
                    setTipoCentroCostoSeleccionado(null);
                }}
                handleClose={() => {
                    setIsOpenConfirmacionBorrado(false);
                    setTipoCentroCostoSeleccionado(null);
                }}
            />
        </Box>
    );
};

export default ListaTipoCentroCosto;