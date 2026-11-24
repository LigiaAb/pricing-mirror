import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Icon } from '@mui/material';
import { api } from '../../api';
import PropTypes from 'prop-types';
import FormularioObjetivo from '../../views/Objetivos/FormularioObjetivo';
import { decryptId } from '../../api/encryptDecrypt';

const VistaObjetivos = ({ isEditing = false }) => {
    const navigate = useNavigate();
    const { encryptedCodObjetivo } = useParams();
    const cod_objetivo = decryptId(encryptedCodObjetivo);

    const [isLoading, setIsLoading] = useState(false);
    const [objetivo, setObjetivo] = useState(null);
    const [tiposActividades, setTiposActividades] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [centrosCostos, setCentrosCostos] = useState([]);
    const [estados, setEstados] = useState([]);
    const [periodicidades, setPeriodicidades] = useState([]);
    const [tiposAsignacion, setTiposAsignacion] = useState([]);

    const tipoActividad = tiposActividades.find(ta => ta.cod_tipo === objetivo?.cod_tipo_actividad);
    const empresa = empresas.find(e => e.cod_empresa === objetivo?.cod_emp);
    const centroCosto = centrosCostos.find(cc => cc.cod_cc === objetivo?.cod_cc);
    const estado = estados.find(e => e.cod_estado === objetivo?.cod_estado);
    const periodicidad = periodicidades.find(p => p.cod_periodicidad === objetivo?.cod_periodicidad);
    const tipoAsignacion = tiposAsignacion.find(ta => ta.cod_tipo === objetivo?.cod_tipo_asignacion);


    const obtjetivoConFormatoUI = !!objetivo &&{
        ...objetivo,
        tipoActividad: { label: tipoActividad?.nom_tipo, value: tipoActividad?.cod_tipo },
        empresa: { label: empresa?.nombre_emp, value: empresa?.cod_empresa },
        centroCosto: { label: centroCosto?.nombre_cc, value: centroCosto?.cod_cc },
        estado: { label: estado?.estado_desc, value: estado?.cod_estado },
        periodicidad: { ...periodicidad, label: periodicidad?.descripcion, value: periodicidad?.cod_periodicidad },
        tipoAsignacion: { label: tipoAsignacion?.nom_tipo, value: tipoAsignacion?.cod_tipo }
    };


    const obtenerObjetivo = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-objetivos';
        const response = await api.get(baseApiURL, { params: { cod_objetivo } });
        const objetivo = response.data.data[0];
        setObjetivo(objetivo);
    }, [cod_objetivo]);
    
    const obtenerTiposActividad = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-tipo';
        const response = await api.get(baseApiURL, {  params: { tipo_tabla: 'ACTIVIDAD' } });
        const tiposActividad = response.data.data;
        setTiposActividades(tiposActividad);
    }, []);
    
    const obtenerEmpresas = useCallback(async () => {
        const baseApiURL = '/api/appweb/listaempresas';
        const response = await api.get(baseApiURL);
        const empresas = response.data.data;
        setEmpresas(empresas);
    }, []);

    const obtenerCentrosCostos = useCallback(async () => {
        const baseApiURL = '/api/appweb/listacentrocosto';
        const response = await api.get(baseApiURL);
        const centrosCostos = response.data.data;
        setCentrosCostos(centrosCostos);
    }, []);

    const obtenerPeriodicidades = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-periodicidad';
        const response = await api.get(baseApiURL, {  params: { cod_estado: 1 } });
        const periodicidades = response.data.data;
        setPeriodicidades(periodicidades);
    }, []);

    const obtenerTiposAsignacion = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-tipo';
        const response = await api.get(baseApiURL, {  params: { tipo_tabla: 'ASIGNACION_ENTIDAD' } });
        const tiposAsignacion = response.data.data;
        setTiposAsignacion(tiposAsignacion);
    }, []);

    const obtenerEstados = useCallback(async () => {
        const baseApiURL = '/api/appweb/listaestados';
        const response = await api.get(baseApiURL);
        const estados = response.data.data;
        setEstados(estados);
    }, []);


    useEffect(() => {
        setIsLoading(true);
        Promise.all([
          obtenerObjetivo(),
          obtenerTiposActividad(),
          obtenerEmpresas(),
          obtenerCentrosCostos(),
          obtenerPeriodicidades(),
          obtenerTiposAsignacion(),
          obtenerEstados()
        ]).then(() => {
            setIsLoading(false);
        });
      }, [obtenerObjetivo, obtenerTiposActividad, obtenerEmpresas, obtenerCentrosCostos, obtenerPeriodicidades, obtenerTiposAsignacion, obtenerEstados]);
    
    

    return (
        <Box p={1}>
            <Button color="primary" sx={{ mb: 2 }} onClick={() => navigate(-1)}>
                <Icon className="c-derecha-arriba-izquierda" sx={{mr: 2}}/>
                Regresar a la lista
            </Button>

            {
                isLoading 
                ? <div> Cargado... </div>
                : encryptedCodObjetivo 
                ? <FormularioObjetivo isEditing={isEditing} defaultValues={obtjetivoConFormatoUI} />
                : <FormularioObjetivo isEditing={isEditing} />
            }
        </Box>
    )
};

VistaObjetivos.propTypes = {
    id_objetivo: PropTypes.number,
    isEditing: PropTypes.bool
};

export default VistaObjetivos;