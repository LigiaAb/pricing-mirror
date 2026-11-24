import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material'
import { api } from '../../../../api';
import { encryptId } from '../../../../api/encryptDecrypt';
import moment from 'moment/moment'
import TablaComponent from '../../../../components/Tabla/TablaComponent';
import FormularioAgrupacionRubros from '../FormularioAgrupacionRubros/FormularioAgrupacionRubros';
import ActionAlertComponent from '../../../../components/Dialog/ActionAlertComponent';
import useObtenerOpcionesAcciones from '../../../../hooks/useObtenerOpcionesAcciones';
import { apagarCarga, encenderCarga } from '../../../../store/slices/status/statusSlice';
import { useDispatch } from 'react-redux';
import { set } from 'date-fns';


const CODS_ESTADOS = {
    ACTIVO: 1,
    INACTIVO: 2
};

const COLORES_ESTADOS = {
    [CODS_ESTADOS.ACTIVO]: 'green.main',
    [CODS_ESTADOS.INACTIVO]: 'red.main'
};


const TablaAgrupacionesRubros = ({
    defaultFilters = null,
    cod_tarifaplantilla,
    catalogos
}) => {
    cod_tarifaplantilla = +cod_tarifaplantilla;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { permisosArray } = useObtenerOpcionesAcciones();
    const { estados } = catalogos;

    let opcion = permisosArray.find((i) => i.nom_opcion === 'Lista');
    const puedeCrear =  opcion?.acciones?.some(a => a.nom_accion === 'Agregar');
    const puedeAnular =  opcion?.acciones?.some(a => a.nom_accion === 'Eliminar');
    const accionesDeTabla = {
        view: opcion?.acciones.some((i) => i.cod_accion === 1),
        delete: puedeAnular
    };

    const [agrupacioesRubros, setAgrupacionesRubros] = useState([]);
    const [filtros, setFiltros] = useState({
        cod_empresa: defaultFilters?.cod_empresa || null,
        cod_cc: defaultFilters?.cod_cc || null,
        cod_tipo_transporte: defaultFilters?.cod_tipo_transporte || null,
        cod_tipo_servicio: defaultFilters?.cod_tipo_servicio || null,
    });
    const [grupoRubrosSeleccionado, setGrupoRubrosSeleccionado] = useState(null);
    const agrupacionRubrosPorAnularRef = useRef(null);
    const [isOpenConfirmacionAnulacion, setIsOpenConfirmacionAnulacion] = useState(false);
    const [isItCreating, setIsItCreating] = useState(false);

    const agrupacionesRubrosConFormatoTabla = agrupacioesRubros.map(agrupacionRubros => {
        const estado = estados.find(e => e.cod_estado === agrupacionRubros.cod_estado);
        return {
            ...agrupacionRubros,
            estado: estado?.estado_desc,
            // fechaInicio: moment(plantilla.fecha_inicio).format('DD-MM-YYYY HH:mm:ss'),
            // fechaFin: plantilla.fecha_final ? moment(plantilla.fecha_final).format('DD-MM-YYYY HH:mm:ss') : 'N/A',
            accionesDeTabla,
            propiedadesDeTabla: {
                estado: {
                    color: COLORES_ESTADOS[agrupacionRubros.cod_estado]
                }
            }
        };
    }, [agrupacioesRubros, estados]);

    const columnas = useMemo(() => [
        {
            label: 'Nombre',
            campo: 'nombre',
            name: 'nombre'
        },
        {
            label: 'Estado',
            campo: 'estado',
            name: 'estado',
        }
    ], []);


    const obtenerAgrupacionesRubros = useCallback(async () => {
        const baseApiURL = `/api/appweb/lista-grupos-rubros`;
        const response = await api.get(baseApiURL, { params: { cod_tarifaplantilla } });
        let agrupacionesRubros = response.data.data;
        agrupacionesRubros = agrupacionesRubros.map(p => ({ ...p, label: p.nombre, value: p.cod_grupo_rubro }));
        return agrupacionesRubros;
    }, [cod_tarifaplantilla]);


    useEffect(() => {
        const obtenerDatosIniciales = async () => {
            dispatch(encenderCarga());
            try {
                const [agrupacionesRubros] = await Promise.all([
                    obtenerAgrupacionesRubros(),
                ]);

                setAgrupacionesRubros(agrupacionesRubros);
            } catch (error) {
                console.error(error);
            } finally {
                dispatch(apagarCarga());
            }
        };

        obtenerDatosIniciales();
    }, [dispatch, obtenerAgrupacionesRubros]);


    const handleSelectFila = (grupoRubros) => {
        setGrupoRubrosSeleccionado(grupoRubros);
        setIsItCreating(false);
    };


    const handleGrupoRubrosCreado = (nuevoGrupoRubros) => {
        setGrupoRubrosSeleccionado(nuevoGrupoRubros);
        setAgrupacionesRubros(prev => [...prev, nuevoGrupoRubros]);
        setIsItCreating(false);
    };


    const handleGrupoRubrosEditado = (grupoRubrosEditado) => {
        setAgrupacionesRubros(prev => prev.map(gr => gr.cod_grupo_rubro === grupoRubrosEditado.cod_grupo_rubro ? grupoRubrosEditado : gr));
    };


    const anularAgrupacionRubros = useCallback(async () => {
        const fecha_final = new Date();

        let baseApiURL = '/api/appweb/actualizar-grupos-rubros';
        const agrupacionRubrosPorAnular = agrupacionRubrosPorAnularRef.current;
        agrupacionRubrosPorAnular.fecha_final = agrupacionRubrosPorAnular.fecha_final || fecha_final;
        agrupacionRubrosPorAnular.cod_estado = CODS_ESTADOS.INACTIVO;
        const response = await api.post(baseApiURL, agrupacionRubrosPorAnular);
        if (!response.data.data.success) return;

        setAgrupacionesRubros(prev => prev.map(ar => ar.cod_grupo_rubro === agrupacionRubrosPorAnular.cod_grupo_rubro ? agrupacionRubrosPorAnular : ar));
        if (agrupacionRubrosPorAnular.cod_grupo_rubro === grupoRubrosSeleccionado?.cod_grupo_rubro) {
            setGrupoRubrosSeleccionado(agrupacionRubrosPorAnular);
        };
    }, [grupoRubrosSeleccionado?.cod_grupo_rubro]);


    const handleAnulacionAgrupacionRubros = (agrupacionRubros) => {
        agrupacionRubrosPorAnularRef.current = agrupacionRubros;
        setIsOpenConfirmacionAnulacion(true);
    };

    const handleLimpiezaTarifaSeleccionada = () => {
        setGrupoRubrosSeleccionado(null);
        setIsItCreating(false);
    };

    const handleInicioCreacionGrupoRubros = () => {
        setGrupoRubrosSeleccionado(null);
        setIsItCreating(true);
    };


    const botonesDeTabla = {
        limpiar: (grupoRubrosSeleccionado || isItCreating) ?  { label: 'Limpiar', color: 'secondary', onClick: handleLimpiezaTarifaSeleccionada } : undefined,
        add: puedeCrear ? { label: 'Crear', color: 'primary', onClick: handleInicioCreacionGrupoRubros } : undefined,
    };


    return (
        <Box display='flex' flexDirection='column' p={1} m={0} gap={2}>
            <TablaComponent
                titulo='Grupos de Rubros'
                id='cod_grupo_rubro'
                encabezado={columnas}
                datos={agrupacionesRubrosConFormatoTabla}
                botones={botonesDeTabla}
                eventosDeTabla={{
                    view: ({ content: grupoRubros }) => handleSelectFila(grupoRubros),
                    delete: ({ content: grupoRubrosPorAnular }) => handleAnulacionAgrupacionRubros(grupoRubrosPorAnular)
                }}
            />

            {
                (!!grupoRubrosSeleccionado || isItCreating) &&
                <Box mt={2}>
                    <Typography variant='h6'>Grupo de Rubros</Typography>
                    <FormularioAgrupacionRubros
                        defaultValues={grupoRubrosSeleccionado}
                        cod_tarifaplantilla={cod_tarifaplantilla}
                        isItCreating={isItCreating}
                        onAgrupacionRubrosCreada={handleGrupoRubrosCreado}
                        onAgrupacionRubrosEditada={handleGrupoRubrosEditado}
                        catalogos={catalogos}
                    />
                </Box>
            }

            <ActionAlertComponent
                tipo='error'
                content='¿Esta seguro que desea eliminar el registro?'
                openDialog={isOpenConfirmacionAnulacion}
                aceptar={() => {
                    anularAgrupacionRubros();
                    setIsOpenConfirmacionAnulacion(false);
                }}
                cancelar={() => {
                    setIsOpenConfirmacionAnulacion(false);
                    agrupacionRubrosPorAnularRef.current = null;
                }}
                handleClose={() => {
                    setIsOpenConfirmacionAnulacion(false);
                    agrupacionRubrosPorAnularRef.current = null;
                }}
            />
        </Box>
    );
};


TablaAgrupacionesRubros.propTypes = {
    defaultFilters: PropTypes.object,
    cod_tarifaplantilla: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    catalogos: PropTypes.object.isRequired
};


export default TablaAgrupacionesRubros;