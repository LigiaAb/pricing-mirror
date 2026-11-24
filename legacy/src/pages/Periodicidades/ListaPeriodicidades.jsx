import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import { Box, Typography } from '@mui/material'
import { api } from '../../api';;
import { encryptId } from '../../api/encryptDecrypt';
import TablaComponent from '../../components/Tabla/TablaComponent';
import ActionAlertComponent from '../../components/Dialog/ActionAlertComponent';
import useObtenerOpcionesAcciones from '../../hooks/useObtenerOpcionesAcciones';
import { apagarCarga, encenderCarga } from '../../store/slices/status/statusSlice';
import { useDispatch } from 'react-redux';


const COD_ESTADOS = {
    ACTIVO: 1,
    INACTIVO: 2
};

const COLORES_ESTADOS = {
    [COD_ESTADOS.ACTIVO]: 'green.main',
    [COD_ESTADOS.INACTIVO]: 'red.main'
};


const ListaPeriodicidades = () => {
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


    const [periodicidades, setPeriodicidades] = useState([]);
    const [periodicidadSeleccionada, setPeriodicidadesSeleccionada] = useState(null);
    const [estados, setEstados] = useState([]);
    const [isOpenConfirmacionBorrado, setIsOpenConfirmacionBorrado] = useState(false);


    const columnas = [
        {
            label: 'Descripción',
            campo: 'descripcion',
            name: 'descripcion'
        },
        {
            label: 'Unidad',
            campo: 'unidad',
            name: 'unidad'
        },
        {
            label: 'No. Días',
            campo: 'no_dias',
            name: 'no_dias'
        },
        {
            label: 'Estado',
            campo: 'nombreEstado',
            name: 'nombreEstado'
        },
    ];

    
    const periodicidadesConFormatoTabla = periodicidades.map(p => {
        const estado = estados.find(e => e.cod_estado === p.cod_estado);
        return {
            ...p,
            nombreEstado: estado?.estado_desc,
            accionesDeTabla,
            propiedadesDeTabla: {
                nombreEstado: {
                    color: COLORES_ESTADOS[p.cod_estado]
                }
            }
        }
    });


    const obtenerPeriodicidades = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-periodicidad';
        const response = await api.get(baseApiURL);
        const periodicidades = response.data.data;
        setPeriodicidades(periodicidades);
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
            obtenerPeriodicidades(),
            obtenerEstados()
        ]).then(() => {
            dispatch(apagarCarga());
        });
    }, [obtenerPeriodicidades, obtenerEstados, dispatch]);


    const borrarPeriodicidad = async () => {
        const COD_ESTADO_INACTIVO = 2;
        const baseApiURL = '/api/appweb/actualizar-periodicidad';
        const response = await api.post(baseApiURL, {...periodicidadSeleccionada, cod_estado: COD_ESTADO_INACTIVO });
        if (!response.data.data.success) return;
        setPeriodicidades(prev => prev.map(p => p.cod_periodicidad === periodicidadSeleccionada.cod_periodicidad ? {...p, cod_estado: COD_ESTADO_INACTIVO } : p));
    };

    const handleBorrarPeriodicidad = (periodicidad) => {
        setPeriodicidadesSeleccionada(periodicidad);
        setIsOpenConfirmacionBorrado(true);
    };


    return (
        <Box display='flex' flexDirection='column' p={1} m={0} gap={2}>
            <Typography variant='h4'>
                Periodicidades
            </Typography>

            <TablaComponent
                titulo='Periodicidades'
                id='cod_periodicidad'
                encabezado={columnas}
                datos={periodicidadesConFormatoTabla}
                botones={botonesDeTabla}
                eventosDeTabla={{
                    view: ({ id: cod_periodicidad }) => navigate(encryptId(cod_periodicidad)),
                    edit: ({ id: cod_periodicidad }) => navigate(`editar/${encryptId(cod_periodicidad)}`),
                    delete: ({ content: periodicidad }) => handleBorrarPeriodicidad(periodicidad)
                }}
            />

            <ActionAlertComponent
                tipo='error'
                content='¿Esta seguro que desea eliminar el registro?'
                openDialog={isOpenConfirmacionBorrado}
                aceptar={() => {
                    borrarPeriodicidad();
                    setIsOpenConfirmacionBorrado(false);
                }}
                cancelar={() => {
                    setIsOpenConfirmacionBorrado(false);
                    setPeriodicidadesSeleccionada(null);
                }}
                handleClose={() => {
                    setIsOpenConfirmacionBorrado(false);
                    setPeriodicidadesSeleccionada(null);
                }}
            />
        </Box>
    );
};

export default ListaPeriodicidades;