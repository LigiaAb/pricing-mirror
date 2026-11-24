import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Icon } from '@mui/material';
import PropTypes from 'prop-types';
import { api } from '../../api';
import { decryptId } from '../../api/encryptDecrypt';
import FormularioTipoRelacionado from '../../views/RelacionTipo/FormularioRelacionTipo/FormularioRelacionTipo';
import { apagarCarga, encenderCarga } from '../../store/slices/status/statusSlice';
import { useDispatch } from 'react-redux';


const VistaRelacionTipo = ({ isEditing }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { encryptedId } = useParams();
  const cod_relacion_tipo = +decryptId(encryptedId);

  const [isLoading, setIsLoading] = useState(false);
  const [relacionDeTipos, setRelacionDeTipos] = useState(null);

  const [tipos, setTipos] = useState([]);
  const [estados, setEstados] = useState([]);
  const estado = estados.find(e => e.cod_estado === relacionDeTipos?.cod_estado);

  const tipo = tipos.find(t => t.cod_tipo === relacionDeTipos?.cod_tipo);
  const tipoPadre = tipos.find(t => t.cod_tipo === relacionDeTipos?.cod_tipo_padre);
  const relacionDeTiposConFormatoUI = relacionDeTipos &&  {
    ...relacionDeTipos,
    tipo: { label: tipo?.nom_tipo, value: tipo?.cod_tipo },
    tipoPadre: { label: tipoPadre?.nom_tipo, value: tipoPadre?.cod_tipo },
    estado: { label: estado?.estado_desc, value: estado?.cod_estado }
  } ;

  const obtenerRelacionDeTipos = useCallback(async () => {
    const baseApiUrl = '/api/appweb/lista-relacion-tipo';
    const response = await api.get(baseApiUrl, {  params: { cod_relacion_tipo } });
    const [relacionDeTipos] = response.data.data;
    setRelacionDeTipos(relacionDeTipos);
  }, [cod_relacion_tipo]);

  const obtenerTipos = useCallback(async () => {
    const baseApiURL = '/api/appweb/lista-tipo';
    const response = await api.get(baseApiURL);
    let tipos = response.data.data;
    tipos = tipos.map(t => ({ ...t, label: t?.nom_tipo, value: t.cod_tipo }));
    setTipos(tipos);
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
        obtenerRelacionDeTipos(),
        obtenerTipos(),
        obtenerEstados()
      ]).then(() => {
        dispatch(apagarCarga());
        setIsLoading(false);
      });
  }, [obtenerRelacionDeTipos, obtenerTipos, obtenerEstados, dispatch]);

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
          ? <FormularioTipoRelacionado isEditing={isEditing} defaultValues={relacionDeTiposConFormatoUI} />
          : <FormularioTipoRelacionado isEditing={isEditing} />
      }
    </Box>
  );
};


VistaRelacionTipo.propTypes = {
  isEditing: PropTypes.bool
};


export default VistaRelacionTipo;