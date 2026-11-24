
import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Icon } from '@mui/material';
import PropTypes from 'prop-types';
import { api } from '../../api';
import { decryptId } from '../../api/encryptDecrypt';
import FormularioPeriodicidad from '../../views/Periodicidad/FormularioPeriodicidad';


const VistaPeriodicidades = ({ isEditing }) => {
    const navigate = useNavigate();
    const { encryptedId } = useParams();
    const cod_periodicidad = decryptId(encryptedId);

    const [isLoading, setIsLoading] = useState(false);
    const [periodicidad, setPeriodicidad] = useState(null);
    const [estados, setEstados] = useState([]);
    const estado = estados.find(e => e.cod_estado === periodicidad?.cod_estado);

    const periodidcidadConFormatoUI = !!periodicidad && {
        ...periodicidad,
        estado: { label: estado?.estado_desc, value: estado?.cod_estado }
    };


    const obtenerPeriodicidad = useCallback(async () => {
        const baseApiUrl = '/api/appweb/lista-periodicidad';
        const response = await api.get(baseApiUrl, {  params: { cod_periodicidad } });
        const [periodicidad] = response.data.data;
        setPeriodicidad(periodicidad);
    }, [cod_periodicidad]);

    const obtenerEstados = useCallback(async () => {
        const baseApiURL = '/api/appweb/listaestados';
        const response = await api.get(baseApiURL);
        const estados = response.data.data;
        setEstados(estados);
    }, []);


    useEffect(() => {
        setIsLoading(true);
        Promise.all([
            obtenerPeriodicidad(),
            obtenerEstados()
        ]).then(() => {
            setIsLoading(false);
        });
    }, [obtenerPeriodicidad, obtenerEstados]);


    return (
        <Box>
            <Button color="primary" sx={{ mb: 2 }} onClick={() => navigate(-1)}>
                <Icon className="c-derecha-arriba-izquierda" sx={{mr: 2}}/>
                Regresar a la lista
            </Button>

            {
                isLoading 
               ? <div> Cargando... </div>
               : encryptedId
               ? <FormularioPeriodicidad isEditing={isEditing} defaultValues={periodidcidadConFormatoUI} />
               : <FormularioPeriodicidad isEditing={isEditing} />
            }
        </Box>
    );
};

VistaPeriodicidades.propTypes = {
    isEditing: PropTypes.bool
};

export default VistaPeriodicidades;