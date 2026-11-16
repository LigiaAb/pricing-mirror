import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types';
import { Box } from '@mui/material'
import { api } from '../../../../api';
import { encryptId } from '../../../../api/encryptDecrypt';
import TablaComponent from '../../../../components/Tabla/TablaComponent';
import ActionAlertComponent from '../../../../components/Dialog/ActionAlertComponent';
import FormularioFiltroPlantillas from './components/FormularioFiltroPlantillas/FormularioFiltroPlantillas.jsx';
import useObtenerOpcionesAcciones from '../../../../hooks/useObtenerOpcionesAcciones';
import { apagarCarga, encenderCarga } from '../../../../store/slices/status/statusSlice';
import { useDispatch, useSelector } from 'react-redux';


const CODS_ESTADOS = {
    ACTIVO: 1,
    INACTIVO: 2
};

const COLORES_ESTADOS = {
    [CODS_ESTADOS.ACTIVO]: 'green.main',
    [CODS_ESTADOS.INACTIVO]: 'red.main'
};


const TablaPlantillas = ({
    catalogos
}) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { permisosArray } = useObtenerOpcionesAcciones();
    const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
    const { estados } = catalogos;

    let opcion = permisosArray.find((i) => i.nom_opcion === 'Lista');

    const puedeFiltrarEmpresaCentroCosto = opcion?.acciones?.some(a => a.nom_accion === 'Filtrar Empresa Centro Costo');

    const accionesDeTabla = {
        view: opcion?.acciones.some((i) => i.cod_accion === 1),
        delete: opcion?.acciones.some((i) => i.cod_accion === 5)
    };

    const botonesDeTabla = {};
    if (opcion?.acciones.some((i) => i.cod_accion === 3)) {
        botonesDeTabla.add = { label: 'nuevo', color: 'primary', onClick: () => navigate(encryptId('new')) };
    };


    const [filtrosPlantillas, setFiltrosPlantillas] = useState(null);
    const [plantillas, setPlantillas] = useState([]);
    const plantillaPorAnularRef = useRef(null);
    const [isOpenConfirmacionBorrado, setIsOpenConfirmacionAnulacion] = useState(false);

    const plantillasFiltradas = !filtrosPlantillas ? plantillas
    : plantillas.filter(p => {
        return Object.keys(filtrosPlantillas).every((key) => {
          const valorFiltro = filtrosPlantillas[key];
          // Si una calve de los filtros no tiene valor o es un objeto, se considera que no hay filtro para esa clave
          if (!valorFiltro || typeof valorFiltro === 'object') return true;
          return p[key] === valorFiltro;
        });
    });

    const plantillasConFomatoTabla = plantillasFiltradas.map(plantilla => {
        const empresa = catalogos.empresas.find(e => e.cod_empresa === plantilla.cod_empresa);
        const centroCosto = catalogos.centrosCostos.find(cc => cc.cod_cc === plantilla.cod_cc);
        const tipoTransporte = catalogos.tiposTransporte.find(t => t.cod_tipo === plantilla.cod_tipo_transporte);
        const tipoServicio = catalogos.tiposServicio.find(t => t.cod_tipo === plantilla.cod_tipo_servicio);
        const estado = estados.find(e => e.cod_estado === plantilla.cod_estado);
        return {
            ...plantilla,
            empresa: empresa?.nombre_emp,
            centroCosto: centroCosto?.nombre_cc,
            tipoTransporte: tipoTransporte?.nom_tipo,
            tipoServicio: tipoServicio?.nom_tipo,
            nombreEstado: estado?.estado_desc,
            // fechaInicio: moment(plantilla.fecha_inicio).format('DD-MM-YYYY HH:mm:ss'),
            // fechaFin: plantilla.fecha_final ? moment(plantilla.fecha_final).format('DD-MM-YYYY HH:mm:ss') : 'N/A',
            accionesDeTabla,
            propiedadesDeTabla: {
                nombreEstado: {
                    color: COLORES_ESTADOS[plantilla.cod_estado]
                }
            }
        };
    }, [plantillas, estados]);

    const columnas = useMemo(() => [
        {
            label: 'Descripción',
            campo: 'descripcion',
            name: 'descripcion'
        },
        {
            label: 'Empresa',
            campo: 'empresa',
            name: 'empresa'
        },
        {
            label: 'Centro Costo',
            campo: 'centroCosto',
            name: 'centroCosto'
        },
        {
            label: 'Tipo Transporte',
            campo: 'tipoTransporte',
            name: 'tipoTransporte'
        },
        {
            label: 'Tipo Servicio',
            campo: 'tipoServicio',
            name: 'tipoServicio'
        },
        {
            label: 'Estado',
            campo: 'nombreEstado',
            name: 'nombreEstado'
        }
    ], []);


    const obtenerPlantillas = useCallback(async () => {
        const baseApiURL = `/api/appweb/lista-tarifa-plantilla`;
        const response = await api.get(baseApiURL);
        let plantillas = response.data.data;
        plantillas = plantillas.map(p => ({ ...p, label: p.descripcion, value: p.cod_tarifaplantilla }));
        return plantillas;
    }, []);


    useEffect(() => {
        const obtenerDatosIniciales = async () => {
            dispatch(encenderCarga());
            try {
                const [plantillas] = await Promise.all([
                    obtenerPlantillas(),
                ]);
                setPlantillas(plantillas);

                setFiltrosPlantillas({
                    cod_empresa: currentEmpresa.cod_empresa,
                    cod_cc: currentCentroCosto.cod_cc
                });
            } catch (error) {
                console.error(error);
            } finally {
                dispatch(apagarCarga());
            }
        };

        obtenerDatosIniciales();
    }, [dispatch, obtenerPlantillas]);


    const handleFiltradoPlantillas = useCallback(async filtros => {
        setFiltrosPlantillas(filtros);
    }, []);


    const anularPlantilla = useCallback(async () => {
        const fecha_final = new Date();

        let baseApiURL = '/api/appweb/actualizar-tarifa-plantilla';
        const plantillaPorAnular = plantillaPorAnularRef.current;
        
        const response = await api.post(baseApiURL, {
            ...plantillaPorAnular,
            fecha_final: plantillaPorAnular.fecha_final || fecha_final,
            cod_estado: CODS_ESTADOS.INACTIVO
        });
        if (!response.data.data.success) return;

        baseApiURL = '/api/appweb/lista-tarifa-plantilla';
        const responsePlantillas = await api.get(baseApiURL, { params: { cod_tarifaplantilla: plantillaPorAnular.cod_tarifaplantilla } });
        const plantilla = responsePlantillas.data.data[0];

        setPlantillas(prev => prev.map(p => p.cod_tarifaplantilla === plantilla.cod_tarifaplantilla ? plantilla : p));
    }, []);


    const handleAnulacionPlantilla = (plantilla) => {
        plantillaPorAnularRef.current = plantilla;
        setIsOpenConfirmacionAnulacion(true);
    };
        

    return (
        <Box display='flex' flexDirection='column' p={1} m={0} gap={2}>
            {
                puedeFiltrarEmpresaCentroCosto &&
                <FormularioFiltroPlantillas
                    onSubmit={handleFiltradoPlantillas}
                    catalogos={catalogos}
                />
            }


            <TablaComponent
                titulo='PlantillasTarfia'	
                id='cod_tarifaplantilla'
                encabezado={columnas}
                datos={plantillasConFomatoTabla}
                botones={botonesDeTabla}
                eventosDeTabla={{
                    view: ({ id: cod_tarifaplantilla }) => navigate(encryptId(+cod_tarifaplantilla)),
                    delete: ({ content: plantilla }) => handleAnulacionPlantilla(plantilla)
                }}
            />

            <ActionAlertComponent
                tipo='error'
                content='¿Esta seguro que desea eliminar el registro?'
                openDialog={isOpenConfirmacionBorrado}
                aceptar={() => {
                    anularPlantilla();
                    setIsOpenConfirmacionAnulacion(false);
                }}
                cancelar={() => {
                    setIsOpenConfirmacionAnulacion(false);
                    plantillaPorAnularRef.current = null;
                }}
                handleClose={() => {
                    setIsOpenConfirmacionAnulacion(false);
                    plantillaPorAnularRef.current = null;
                }}
            />
        </Box>
    );
};


TablaPlantillas.propTypes = {
    catalogos: PropTypes.object.isRequired
};


export default TablaPlantillas;