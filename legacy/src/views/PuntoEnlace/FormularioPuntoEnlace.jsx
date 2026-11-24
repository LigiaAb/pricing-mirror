import { useState, useCallback,  useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { api } from '../../api';
import { encryptId } from '../../api/encryptDecrypt';
import FormularioComponent from '../../components/Formulario/FormularioComponent';
import { apagarCarga, encenderCarga } from '../../store/slices/status/statusSlice';
import { useDispatch } from 'react-redux';


const formatPuntoEnlaceToApiSubmissionFormat = (puntoEnlace) => {
    return {
        ...puntoEnlace,
        cod_pais: puntoEnlace.pais.value,
        cod_tipo: puntoEnlace.tipo.value,
        cod_estado: puntoEnlace.estado.value
    };
};


const FormularioPuntoEnlace = ({ isEditing = false, defaultValues, nombreTipo }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isCreating = !defaultValues && isEditing;
    
    const [valores, setValores] = useState(() => {
        if (defaultValues) return {
          ...defaultValues,
        };
    
        return {
          nombre: '',
          pais: null,
          tipo: null,
          estado: { label: 'Activo', value: 1 }
        }
    });
    
    const [paises, setPaises] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [estados, setEstados] = useState([]);


    useEffect(() => {
        const tipo = tipos.find(t => t.nom_tipo === nombreTipo)
        setValores(prev => ({
            ...prev,
            tipo
        }));
    }, [nombreTipo, tipos]);


    const obtenerPises = useCallback(async () => {
        const baseApiURL = 'api/appweb/listapaises';
        const response = await api.get(baseApiURL);
        let paises = response.data.data;
        paises = paises.map(p => ({ label: p.nombre_pais, value: p.cod_pais }));
        setPaises(paises);
    }, []);

    const obtenerTipos = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-tipo';
        const response = await api.get(baseApiURL, { params: { tipo_tabla: 'PUNTO_ENLACE' } });
        let tipos = response.data.data;
        tipos = tipos.map(t => ({ ...t, label: t.nom_tipo, value: t.cod_tipo }));
        setTipos(tipos);
    }, []);

    const obtenerEstados = useCallback(async () => {
        const baseApiURL = '/api/appweb/listaestados';
        const response = await api.get(baseApiURL);
        let estados = response.data.data;
        estados = estados = estados.map(e => ({ ...e, label: e.estado_desc, value: e.cod_estado }));
        setEstados(estados);
    }, []);

    useEffect(() => {
        dispatch(encenderCarga());
        Promise.all([
            obtenerPises(),
            obtenerTipos(),
            obtenerEstados()
        ]).then(() => {
            dispatch(apagarCarga());
        });
    }, [obtenerPises, obtenerTipos, obtenerEstados, dispatch]);


    const inputs = [
        {
            tipo: 'text',
            label: 'Nombre',
            id: 'nombre',
            val: valores.nombre,
            requerido: true,
            readonly: !isEditing
        },
        {
            tipo: 'select',
            label: 'Pais',
            id: 'pais',
            options: paises,
            val: valores.pais,
            requerido: true,
            readonly: !isEditing
        },
        {
            tipo: 'select',
            label: 'Estado',
            id: 'estado',
            options: estados,
            val: valores.estado,
            requerido: true,
            readonly: !isEditing || isCreating
        }
    ];


    const handleInputChange = ({ id, val}) => {
        setValores(prev => ({...prev, [id]: val }));
    };

    const handleSubmit = async () => {
        const baseApiURL = isCreating ? '/api/appweb/insertar-punto_enlace' : '/api/appweb/actualizar-punto_enlace';
        const reqBody = formatPuntoEnlaceToApiSubmissionFormat(valores);
        const response = await api.post(baseApiURL, reqBody);
        if (!response.data.data.success) return;
        const cod_puntoenlace = parseInt(response.data.data.cod_puntoenlace);
        if (isCreating) return navigate(`/configuracion/geolocalizacion/${nombreTipo.toLowerCase()}/editar/${encryptId(cod_puntoenlace)}`, { replace: true });
    };


    return (
        <Box display='flex' flexDirection='column' mt={2}>
            <Typography variant='h4'>
                {
                    !isCreating ? `Codigo No. ${valores.cod_puntoenlace}`  : ''
                }
            </Typography>

            <FormularioComponent
                titulo='Punto de Enlace'
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


FormularioPuntoEnlace.propTypes = {
    isEditing: PropTypes.bool.isRequired,
    defaultValues: PropTypes.object,
    nombreTipo: PropTypes.string.isRequired
};


export default FormularioPuntoEnlace;