import { useState, useCallback,  useEffect, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { api } from '../../../api';
import { encryptId } from '../../../api/encryptDecrypt';
import FormularioComponent from '../../../components/Formulario/FormularioComponent';
import { apagarCarga, encenderCarga } from '../../../store/slices/status/statusSlice';
import { useDispatch } from 'react-redux';


const COD_ESTADO_INACTIVO = 2;


const formatRelacionDeTiposToApiSubmissionFormat = (relacionDeTipos) => {
    return {
        ...relacionDeTipos,
        cod_tipo: relacionDeTipos.tipo.value,
        cod_tipo_padre: relacionDeTipos.tipoPadre.value,
        cod_estado: relacionDeTipos.estado.value
    };
};


const FormularioRelacionTipo = ({ isEditing = false, defaultValues }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isCreating = !defaultValues && isEditing;

    const [valores, setValores] = useState(() => {
        if (defaultValues) {
          return {
            tablaTipo: { label: defaultValues.tipo_tabla, value: defaultValues.tipo_tabla },
            tablaTipoPadre: { label: defaultValues.tipo_padre_tabla, value: defaultValues.tipo_padre_tabla },
            ...defaultValues,
          }
        };
    
        return {
            tablaTipo: null,
            tipo: null,
            tablaTipoPadre: null,
            tipoPadre: null,
            fecha_inicio: null,
            fecha_fin: null,
            estado: { label: 'Activo', value: 1 }
        }
    });

    const [optionsNombresTablas, setOptionsNombresTablas] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [estados, setEstados] = useState([]);
    const optionsEstados = estados.map(e => ({ label: e.estado_desc, value: e.cod_estado }));

    const obtenerTipos = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-tipo';
        const response = await api.get(baseApiURL);
        let tipos = response.data.data;
        tipos = tipos.map(t => ({ ...t, label: t.nom_tipo, value: t.cod_tipo }));
        setTipos(tipos);

        const nombresTablasSet = new Set(tipos.map(t => t.tipo_tabla));
        const optionsNombresTablas = Array.from(nombresTablasSet).map(tablaTipo => ({
            label: tablaTipo,
            value: tablaTipo
        }));

        setOptionsNombresTablas(optionsNombresTablas);
    }, [])

    const obtenerEstados = useCallback(async () => {
        const baseApiURL = '/api/appweb/listaestados';
        const response = await api.get(baseApiURL);
        const estados = response.data.data;
        setEstados(estados);
    }, []);

    useEffect(() => {
        dispatch(encenderCarga());
        Promise.all([
            obtenerTipos(),
            obtenerEstados()
        ]).then(() => {
            dispatch(apagarCarga());
        });
    }, [obtenerTipos, obtenerEstados, dispatch]);
  

    const tiposPadreSeleccionables = tipos.filter(t => t.tipo_tabla === valores.tablaTipoPadre?.value);
    const tiposSeleccionables = tipos.filter(t => t.tipo_tabla === valores.tablaTipo?.value);

    const inputs = useMemo(() => [
        {
            tipo: 'select',
            label: 'Tabla del Tipo Padre',
            id: 'tablaTipoPadre',
            options: optionsNombresTablas,
            val: valores.tablaTipoPadre,
            requerido: true,
            readonly: !isEditing
        },
        {
            tipo: 'select',
            label: 'Tipo Padre',
            id: 'tipoPadre',
            options: tiposPadreSeleccionables,
            val: valores.tipoPadre,
            requerido: true,
            readonly: !isEditing || !valores.tablaTipoPadre
        },
        {
            tipo: 'select',
            label: 'Tabla del Tipo',
            id: 'tablaTipo',
            options: optionsNombresTablas,
            val: valores.tablaTipo,
            requerido: true,
            readonly: !isEditing
        },
        {
            tipo: 'select',
            label: 'Tipo',
            id: 'tipo',
            options: tiposSeleccionables,
            val: valores.tipo,
            requerido: true,
            readonly: !isEditing || !valores.tablaTipo
        },
        {
            tipo: 'datetime',
            label: 'Fecha de Inicio',
            id: 'fecha_inicio',
            val: valores.fecha_inicio ? new Date(valores.fecha_inicio) : new Date(),
            requerido: false,
            readonly: true
        },
        {
            tipo: 'datetime',
            label: 'Fecha de Fin',
            id: 'fecha_fin',
            val: valores.fecha_fin ? new Date(valores.fecha_fin) : null,
            requerido: false,
            readonly: true
        },
        {
            tipo: 'select',
            label: 'Estado',
            id: 'estado',
            options: optionsEstados,
            val: valores.estado,
            requerido: true,
            readonly: !isEditing || isCreating
        },
    ], [isEditing, isCreating, valores, tiposPadreSeleccionables, tiposSeleccionables, optionsEstados, optionsNombresTablas]);


    const handleInputChange = ({ id, val}) => {
        setValores(prev => {
            const newValues = { ...prev, [id]: val };
        
            if (id === 'tablaTipo') newValues.tipo = null;
            if (id === 'tablaTipoPadre') newValues.tipoPadre = null;

            return newValues;
        });
    };


    const handleSubmit = async () => {
        const baseApiURL = isCreating ? '/api/appweb/insertar-relacion-tipo' : '/api/appweb/actualizar-relacion-tipo';
        let reqBody = formatRelacionDeTiposToApiSubmissionFormat(valores);
        if (reqBody.cod_estado === COD_ESTADO_INACTIVO) {
            if (!reqBody.fecha_fin) reqBody.fecha_fin = new Date();
        } else {
            reqBody.fecha_fin = null;
        }
        const response = await api.post(baseApiURL, reqBody);
        if (!response.data.data.success) return;
        const cod_relacion_tipo = +response.data.data.cod_relacion_tipo;
        setValores(prev => ({ 
            ...prev,
            cod_relacion_tipo,
            fecha_fin: reqBody.fecha_fin
         }));
        if (isCreating) return navigate(`/configuracion/crud/tipo-relacionado/editar/${encryptId(cod_relacion_tipo)}`, { replace: true });
    };


    return (
        <Box display='flex' flexDirection='column'>
            <Typography variant='h4'>
                {
                isCreating
                ? 'Crear Relación de Tipos'
                : isEditing 
                ? `Editar Relación de Tipos con Cod. ${valores.cod_relacion_tipo}`
                : `Ver Relación de Tipo con Cod. ${valores.cod_relacion_tipo}`
                }
            </Typography>

            <FormularioComponent
                titulo='RelacionDeTipos'
                inputs={inputs}
                onInput={handleInputChange}
                botones={{
                    agregar: { visible: isCreating, onClick: handleSubmit },
                    editar: { visible: !isCreating && isEditing, onClick: handleSubmit }
                }}
            />
        </Box>
    );
};


FormularioRelacionTipo.propTypes = {
  isEditing: PropTypes.bool.isRequired,
  defaultValues: PropTypes.object
};


export default FormularioRelacionTipo;