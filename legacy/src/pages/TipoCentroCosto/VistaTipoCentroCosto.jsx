import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Icon } from '@mui/material';
import PropTypes from 'prop-types';
import { api } from '../../api';
import { decryptId } from '../../api/encryptDecrypt';
import FormularioTipoCentroCosto from '../../views/TipoCentroCosto/FormularioTipoCentroCosto';
import { apagarCarga, encenderCarga } from '../../store/slices/status/statusSlice';
import { useDispatch } from 'react-redux';


const VistaTipoCentroCosto = ({ isEditing }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { encryptedId } = useParams();
    const cod_tipo_cenco = +decryptId(encryptedId);

    const [isLoading, setIsLoading] = useState(false);
    const [tipoCentroCosto, setTipoCentrosCostos] = useState(null);
    const [tipos, setTipos] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [centrosCostos, setCentrosCostos] = useState([]);
    const [estados, setEstados] = useState([]);

    const tipo = tipos.find(t => t.cod_tipo === tipoCentroCosto?.cod_tipo);
    const empresa = empresas.find(e => e.cod_empresa === tipoCentroCosto?.cod_empresa);
    const centroCosto = centrosCostos.find(cc => cc.cod_cc === tipoCentroCosto?.cod_cenco);
    const estado = estados.find(e => e.cod_estado === tipoCentroCosto?.cod_estado);
    const tipoCentroCostoConFormatoUI = !!tipoCentroCosto && {
        ...tipoCentroCosto,
        tabla: { label: tipo?.tipo_tabla, value: tipo?.cod_tipo },
        tipo: { label: tipo?.nom_tipo, value: tipo?.cod_tipo },
        empresa: { label: empresa?.nombre_emp, value: empresa?.cod_empresa },
        centroCosto: { label: centroCosto?.nombre_cc, value: centroCosto?.cod_cc },
        fecha_inicio: new Date(tipoCentroCosto.fecha_inicio),
        fecha_fin: tipoCentroCosto.fecha_fin ? new Date(tipoCentroCosto.fecha_fin) : null,
        estado: { label: estado?.estado_desc, value: estado?.cod_estado }
    };

    const obtenerTipoCentroCosto = useCallback(async () => {
        const baseApiUrl = '/api/appweb/lista-tipo-cenco';
        const response = await api.get(baseApiUrl);
        const tiposCentrosCostos = response.data.data;
        const tipoCentroCosto = tiposCentrosCostos.find(t => t.cod_tipo_cenco === cod_tipo_cenco);
        setTipoCentrosCostos(tipoCentroCosto)
    }, [cod_tipo_cenco]);

    const obtenerTipos = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-tipo';
        const response = await api.get(baseApiURL);
        let tipos = response.data.data;
        tipos = tipos.map(t => ({ ...t, label: t.nom_tipo, value: t.cod_tipo }));
        setTipos(tipos);
    }, []);

    const obtenerEmpresas = useCallback(async () => {
        const baseApiURL = '/api/appweb/listaempresas';
        const response = await api.get(baseApiURL);
        let empresas = response.data.data;
        empresas = empresas.map(e => ({ ...e, label: e.nombre_emp, value: e.cod_empresa }));
        setEmpresas(empresas);
    }, []);

    const obtenerCentrosCostos = useCallback(async () => {
        const baseApiURL = '/api/appweb/listacentrocosto';
        const response = await api.get(baseApiURL);
        let centrosCostos = response.data.data;
        centrosCostos = centrosCostos.map(cc => ({ ...cc, label: cc.nombre_cc, value: cc.cod_cc }));
        setCentrosCostos(centrosCostos);
      }, []);

    const obtenerEstados = useCallback(async () => {
        const baseApiURL = '/api/appweb/listaestados';
        const response = await api.get(baseApiURL);
        const estados = response.data.data;
        setEstados(estados);
    }, []);

    
    useEffect(() => {
        dispatch(encenderCarga());
        setIsLoading(true);
        Promise.all([
            obtenerTipoCentroCosto(),
            obtenerTipos(),
            obtenerEmpresas(),
            obtenerCentrosCostos(),
            obtenerEstados()
        ]).then(() => {
            dispatch(apagarCarga());
            setIsLoading(false);
        });
    }, [obtenerTipoCentroCosto, obtenerTipos, obtenerEmpresas, obtenerCentrosCostos, obtenerEstados, dispatch]);


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
                ? <FormularioTipoCentroCosto isEditing={isEditing} defaultValues={tipoCentroCostoConFormatoUI} />
                : <FormularioTipoCentroCosto isEditing={isEditing} />
            }
        </Box>
    );
};


VistaTipoCentroCosto.propTypes = {
  isEditing: PropTypes.bool
};


export default VistaTipoCentroCosto;