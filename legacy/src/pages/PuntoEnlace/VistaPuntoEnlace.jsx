import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Icon } from '@mui/material';
import PropTypes from 'prop-types';
import { api } from '../../api';
import { decryptId } from '../../api/encryptDecrypt';
import TabComponent from '../../components/Tabs/TabComponent';
import FormularioPuntoEnlace from '../../views/PuntoEnlace/FormularioPuntoEnlace';
import TablaPuntoEnlaceIdentificaciones from '../../views/PuntoEnlace/PuntoEnlaceIdentificaciones/TablaPuntoEnlaceIdentificaciones';
import TablaPuntoEnlaceNombres from '../../views/PuntoEnlace/PuntoEnlaceNombres/TablaPuntoEnlaceNombres';


const VistaPuntoEnlace = ({ isEditing = true, nombreTipo }) => {
    const navigate = useNavigate();
    const { encryptedId } = useParams();
    const cod_puntoenlace = decryptId(encryptedId);

    const [isLoading, setIsLoading] = useState(false);
    const [puntoEnlace, setPuntoEnlace] = useState(null);
    const [paises, setPaises] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [estados, setEstados] = useState([]);
    const estado = estados.find(e => e.cod_estado === puntoEnlace?.cod_estado);

    const pais = paises.find(p => p.cod_pais === puntoEnlace?.cod_pais);
    const tipo = tipos.find(t => t.cod_tipo === puntoEnlace?.cod_tipo);
    const puntoEnlaceConFormatoUI = !!puntoEnlace && {
        ...puntoEnlace,
        pais: { label: pais?.nombre_pais, value: pais?.cod_pais },
        tipo: { label: tipo?.nom_tipo, value: tipo?.cod_tipo },
        estado: { label: estado?.estado_desc, value: estado?.cod_estado }
    };


    const obtenerPuntoEnlace = useCallback(async () => {
        const baseApiUrl = '/api/appweb/lista-punto_enlace';
        const response = await api.get(baseApiUrl, {  params: { cod_puntoenlace } });
        const [puntoEnlace] = response.data.data;
        setPuntoEnlace(puntoEnlace);
    }, [cod_puntoenlace]);


    const obtenerPises = useCallback(async () => {
        const baseApiURL = 'api/appweb/listapaises';
        const response = await api.get(baseApiURL);
        const paises = response.data.data;
        setPaises(paises);
    }, []);

    const obtenerTipos = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-tipo';
        const response = await api.get(baseApiURL, { params: { tipo_tabla: 'PUNTO_ENLACE' } });
        const tipos = response.data.data;
        setTipos(tipos);

        const tipo = tipos.find(t => t.nom_tipo === nombreTipo);
        setPuntoEnlace(prev => ({
            ...prev,
            tipo
        }));
    }, [nombreTipo]);

    const obtenerEstados = useCallback(async () => {
        const baseApiURL = '/api/appweb/listaestados';
        const response = await api.get(baseApiURL);
        const estados = response.data.data;
        setEstados(estados);
    }, []);


    useEffect(() => {
        setIsLoading(true);
        Promise.all([
            obtenerPuntoEnlace(),
            obtenerPises(),
            obtenerTipos(),
            obtenerEstados()
        ]).then(() => {
            setIsLoading(false);
        });
    }, [obtenerPuntoEnlace, obtenerPises, obtenerTipos, obtenerEstados]);


    let opcionesTabs = [
        {
            id: 1,
            label: 'Información',
            content: (
                isLoading 
                ? <div> Cargando... </div>
                : encryptedId
                ? <FormularioPuntoEnlace nombreTipo={nombreTipo} isEditing={isEditing} defaultValues={puntoEnlaceConFormatoUI} />
                : <FormularioPuntoEnlace nombreTipo={nombreTipo} isEditing={isEditing} />
            )
        },
    ]

    if (encryptedId) {
        opcionesTabs = opcionesTabs.concat([
            {
                id: 2,
                label: 'Identificaciones',
                content: <TablaPuntoEnlaceIdentificaciones cod_puntoenlace={puntoEnlace?.cod_puntoenlace} />
            },
            {
                id: 3,
                label: 'Nombres',
                content: <TablaPuntoEnlaceNombres cod_puntoenlace={puntoEnlace?.cod_puntoenlace} />
            }
        ]);
    }


    return (
        <Box>
            <Button color='primary' sx={{ mb: 2 }} onClick={() => navigate(-1)}>
                <Icon className='c-derecha-arriba-izquierda' sx={{mr: 2}}/>
                Regresar a la lista
            </Button>

            <TabComponent
                opciones={opcionesTabs}
                tabInicial={1}
            />
        </Box>
    );
};


VistaPuntoEnlace.propTypes = {
  isEditing: PropTypes.bool,
  nombreTipo: PropTypes.string.isRequired
};


export default VistaPuntoEnlace;