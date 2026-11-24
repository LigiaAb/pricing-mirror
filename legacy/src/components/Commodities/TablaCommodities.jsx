import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types';
import { Box } from '@mui/material'
import { api } from '../../api';;
import { encryptId } from '../../api/encryptDecrypt';
import moment from 'moment/moment'
import TablaComponent from '../../components/Tabla/TablaComponent';
import ActionAlertComponent from '../../components/Dialog/ActionAlertComponent';
import useObtenerOpcionesAcciones from '../../hooks/useObtenerOpcionesAcciones';
import { apagarCarga, encenderCarga } from '../../store/slices/status/statusSlice';
import { useDispatch } from 'react-redux';


const CODS_ESTADOS = {
    ACTIVO: 1,
    INACTIVO: 2
};

const COLORES_ESTADOS = {
    [CODS_ESTADOS.ACTIVO]: 'green.main',
    [CODS_ESTADOS.INACTIVO]: 'red.main'
};


const TablaCommodities = ({
    catalogos
}) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { permisosArray } = useObtenerOpcionesAcciones();
    const { estados = [] } = catalogos;

    let item = permisosArray.find((i) => i.nom_opcion === 'Lista');
    const accionesDeTabla = {
        view: item?.acciones.some((i) => i.cod_accion === 1),
        delete: item?.acciones.some((i) => i.cod_accion === 4)
    };

    const botonesDeTabla = {};
    if (item?.acciones.some((i) => i.cod_accion === 3)) {
        botonesDeTabla.add = { label: 'nuevo', color: 'primary', onClick: () => navigate(encryptId('new')) };
    };

    const [commodities, setCommodities] = useState([]);
    const commodityPorAnularRef = useRef(null);
    const [isOpenConfirmacionBorrado, setIsOpenConfirmacionAnulacion] = useState(false);


    const commoditiesConFomatoTabla = commodities.map(commodity => {
        const estado = estados.find(e => e.cod_estado === commodity.cod_estado);
        return {
            ...commodity,
            nombreEstado: estado?.estado_desc,
            accionesDeTabla,
            propiedadesDeTabla: {
                nombreEstado: {
                    color: COLORES_ESTADOS[commodity.cod_estado]
                }
            }
        };
    }, [commodities, estados]);

    const columnas = useMemo(() => [
        {
            label: 'Nombre',
            campo: 'nombre',
            name: 'nombre'
        },
        {
            label: 'Descripción',
            campo: 'descripcion',
            name: 'descripcion'
        },
        {
            label: 'Estado',
            campo: 'nombreEstado',
            name: 'nombreEstado'
        },
    ], []);


    const obtenerCommodities = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-commodities';
        const response = await api.get(baseApiURL);
        const commodities = response.data.data;
        setCommodities(commodities);
    }, []);


    useEffect(() => {
        dispatch(encenderCarga());
        Promise.all([
            obtenerCommodities(),
        ]).then(() => {
            dispatch(apagarCarga());
        });
    }, [dispatch, obtenerCommodities]);


    const anularCommodity = async () => {
        let baseApiURL = '/api/appweb/actualizar-commodity';
        const commodityPorAnular = commodityPorAnularRef.current;
        
        const response = await api.post(baseApiURL, {
            ...commodityPorAnular,
            cod_estado: CODS_ESTADOS.INACTIVO
        });
        if (!response.data.data.success) return;

        baseApiURL = '/api/appweb/lista-commodities';
        const responseCommodity = await api.get(baseApiURL, { params: { cod_commodity: commodityPorAnular.cod_commodity } });
        const commodity = responseCommodity.data.data[0];

        setCommodities(prev => prev.map(c => c.cod_commodity === commodity.cod_commodity ? commodity : c));
    };


    const handleAnulacionCommodity = (commodity) => {
        commodityPorAnularRef.current = commodity;
        setIsOpenConfirmacionAnulacion(true);
    };


    return (
        <Box display='flex' flexDirection='column' p={1} m={0} gap={2}>
            <TablaComponent
                titulo='Commodities'	
                id='cod_commodity'
                encabezado={columnas}
                datos={commoditiesConFomatoTabla}
                botones={botonesDeTabla}
                eventosDeTabla={{
                    view: ({ id: cod_commodity }) => navigate(encryptId(cod_commodity)),
                    delete: ({ content: commodity }) => handleAnulacionCommodity(commodity)
                }}
            />

            <ActionAlertComponent
                tipo='error'
                content='¿Esta seguro que desea eliminar el registro?'
                openDialog={isOpenConfirmacionBorrado}
                aceptar={() => {
                    anularCommodity();
                    setIsOpenConfirmacionAnulacion(false);
                }}
                cancelar={() => {
                    setIsOpenConfirmacionAnulacion(false);
                    commodityPorAnularRef.current = null;
                }}
                handleClose={() => {
                    setIsOpenConfirmacionAnulacion(false);
                    commodityPorAnularRef.current = null;
                }}
            />
        </Box>
    );
};


TablaCommodities.propTypes = {
    catalogos: PropTypes.shape({
        estados: PropTypes.array
    })
};


export default TablaCommodities;
