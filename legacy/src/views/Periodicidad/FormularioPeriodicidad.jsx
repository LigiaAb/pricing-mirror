import { useState, useCallback,  useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { api } from '../../api';
import { encryptId } from '../../api/encryptDecrypt';
import FormularioComponent from '../../components/Formulario/FormularioComponent';
import { apagarCarga, encenderCarga } from '../../store/slices/status/statusSlice';
import { useDispatch } from 'react-redux';

const formatPeriodicidadToApiSubmissionFormat = (periodicidad) => {
    return {
        ...periodicidad,
        cod_estado: periodicidad.estado.value,
        no_dias: +periodicidad.no_dias
    };
};


const FormularioPeriodicidad = ({ isEditing = false, defaultValues }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isCreating = !defaultValues && isEditing;
    const [valores, setValores] = useState(() => {
      if (defaultValues) return {
        ...defaultValues,
      };
  
      return {
        descripcion: '',
        unidad: '',
        no_dias: null,
        estado: { label: 'Activo', value: 1 }
      }
    });


    const [estados, setEstados] = useState([]);
    const optionsEstados = estados.map(e => ({ label: e.estado_desc, value: e.cod_estado }));

    const obtenerEstados = useCallback(async () => {
        const baseApiURL = '/api/appweb/listaestados';
        const response = await api.get(baseApiURL);
        const estados = response.data.data;
        setEstados(estados);
    }, []);


    useEffect(() => {
        dispatch(encenderCarga());
        Promise.all([
            obtenerEstados()
        ]).then(() => {
            dispatch(apagarCarga());
        });
    }, [obtenerEstados, dispatch]);


    const inputs = [
        {
            tipo: 'text',
            label: 'Descripción',
            id: 'descripcion',
            val: valores.descripcion,
            requerido: true,
            readonly: !isEditing
        },
        {
            tipo: 'text',
            label: 'Unidad',
            id: 'unidad',
            val: valores.unidad,
            requerido: true,
            readonly: !isEditing
        },
        {
            tipo: 'number',
            label: 'No. Días',
            id: 'no_dias',
            val: valores.no_dias,
            requerido: true,
            readonly: !isEditing
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
    ];


    const handleInputChange = ({ id, val}) => {
        setValores(prev => ({...prev, [id]: val }));
    };
  

    const handleSubmit = async () => {
        const baseApiURL = isCreating ? '/api/appweb/insertar-periodicidad' : '/api/appweb/actualizar-periodicidad';
        const reqBody = formatPeriodicidadToApiSubmissionFormat(valores);
        const response = await api.post(baseApiURL, reqBody);
        if (!response.data.data.success) return;
        const cod_periodicidad = parseInt(response.data.data.cod_periodicidad);
        if (isCreating) return navigate(`/configuracion/crud/periodicidad/editar/${encryptId(cod_periodicidad)}`, { replace: true });
    };


    return (
        <Box display='flex' flexDirection='column'>
            <Typography variant='h4'>
                {
                isCreating
                ? 'Crear Periodicidad'
                : isEditing 
                ? `Editar Periodicidad Cod. ${valores.cod_periodicidad}`
                : `Ver Periodicidad Cod. ${valores.cod_periodicidad}`
                }
            </Typography>

            <FormularioComponent
                titulo='Periodicidad'
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


FormularioPeriodicidad.propTypes = {
  isEditing: PropTypes.bool.isRequired,
  defaultValues: PropTypes.object
};


export default FormularioPeriodicidad;