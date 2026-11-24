import { useState, useCallback,  useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { api } from '../../api';
import { encryptId } from '../../api/encryptDecrypt';
import FormularioComponent from '../../components/Formulario/FormularioComponent';
import { apagarCarga, encenderCarga } from '../../store/slices/status/statusSlice';
import { useDispatch } from 'react-redux';


const COD_ESTADO_INACTIVO = 2;


const formatTipoCentroCostoToApiSubmissionFormat = (tipoCentroCosto) => {
    return {
        ...tipoCentroCosto,
        cod_tipo: tipoCentroCosto.tipo.value,
        cod_empresa: tipoCentroCosto.empresa.value,
        cod_cenco: tipoCentroCosto.centroCosto.value,
        cod_estado: tipoCentroCosto.estado.value
    };
};


const FormularioTipoCentroCosto = ({ isEditing = false, defaultValues }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isCreating = !defaultValues && isEditing;

    const [valores, setValores] = useState(() => {
        if (defaultValues) return {
          ...defaultValues,
        };
    
        return {
            tabla: null,
            tipo: null,
            centroCosto: null,
            fecha_inicio: new Date(),
            fecha_fin: null,
            estado: { label: 'Activo', value: 1 }
        }
    });

    const [nombresTablas, setNombresTablas] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [centrosCostos, setCentrosCostos] = useState([]);
    const [estados, setEstados] = useState([]);
    const optionsEstados = estados.map(e => ({ label: e.estado_desc, value: e.cod_estado }));

    const tiposSeleccionables = tipos.filter(t => t.tipo_tabla === valores.tabla?.value);
    const centrosCostosSeleccionables = centrosCostos.filter(cc => cc.cod_empresa_cc === valores.empresa?.cod_empresa);

    const obtenerTipos = useCallback(async () => {
        const baseApiURL = '/api/appweb/lista-tipo';
        const response = await api.get(baseApiURL);
        let tipos = response.data.data || [];
        tipos = tipos.map(t => ({ ...t, label: t.nom_tipo, value: t.cod_tipo }));
        setTipos(tipos);

        const nombresTablasSet = new Set(tipos.map(t => t.tipo_tabla));
        const nombresTablas = Array.from(nombresTablasSet).map(tipo_tabla => ({
            label: tipo_tabla,
            value: tipo_tabla
        }));

        setNombresTablas(nombresTablas);
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
        Promise.all([
            obtenerTipos(),
            obtenerEmpresas(),
            obtenerCentrosCostos(),
            obtenerEstados()
        ]).then(() => {
            dispatch(apagarCarga());
        });
    }, [obtenerTipos, obtenerEmpresas, obtenerCentrosCostos, obtenerEstados, dispatch]);


    const inputs = [
        {
            tipo: 'select',
            label: 'Tabla',
            id: 'tabla',
            options: nombresTablas,
            val: valores.tabla,
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
            readonly: !isEditing || !valores.tabla
        },
        {
            tipo: 'select',
            label: 'Empresa',
            id: 'empresa',
            options: empresas,
            val: valores.empresa,
            requerido: true,
            readonly: !isEditing
        },
        {
            tipo: 'select',
            label: 'Centro de Costo',
            id: 'centroCosto',
            options: centrosCostosSeleccionables,
            val: valores.centroCosto,
            requerido: true,
            readonly: !isEditing || !valores.empresa
        },
        {
            tipo: 'datetime',
            label: 'Fecha Inicial',
            id: 'fecha_inicio',
            val: valores.fecha_inicio,
            requerido: false,
            readonly: true
        },
        {
            tipo: 'datetime',
            label: 'Fecha Final',
            id: 'fecha_fin',
            val: valores.fecha_fin,
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
    ];


    const handleInputChange = ({ id, val}) => {
        setValores(prev => {
            const newValues = { ...prev, [id]: val };
        
            if (id === 'tabla') newValues.tipo = null;
            if (id === 'empresa') newValues.centroCosto = null;
      
            return newValues;
          });
    };


    const handleSubmit = async () => {
        const baseApiURL = isCreating ? '/api/appweb/insertar-tipo-cenco' : 'api/appweb/actualizar-tipo-cenco';
        const reqBody = formatTipoCentroCostoToApiSubmissionFormat(valores);

        if (reqBody.cod_estado === COD_ESTADO_INACTIVO) {
            if (!reqBody.fecha_fin) reqBody.fecha_fin = new Date();
        } else {
            reqBody.fecha_fin = null;
        }

        const response = await api.post(baseApiURL, reqBody);
        if (!response.data.data.success) return;

        const { cod_tipo_cenco } = response.data.data;
        setValores(prev => ({ 
            ...prev,
            cod_tipo_cenco,
            fecha_fin: reqBody.fecha_fin
        }));

        if (isCreating) return navigate(`/configuracion/crud/tipo-centro-costo/editar/${encryptId(cod_tipo_cenco)}`, { replace: true });
    };


    return (
        <Box display='flex' flexDirection='column'>
            <Typography variant='h4'>
                {
                isCreating
                ? 'Crear Tipo Por Centro de Costo'
                : isEditing 
                ? `Editar Tipo Por Centro de Costo con Cod. ${valores.cod_tipo_cenco}`
                : `Ver Tipo Por Centro de Costo con Cod. ${valores.cod_tipo_cenco}`
                }
            </Typography>

            <FormularioComponent
                titulo='Tipos Centros Costos'
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


FormularioTipoCentroCosto.propTypes = {
  isEditing: PropTypes.bool.isRequired,
  defaultValues: PropTypes.object
};


export default FormularioTipoCentroCosto;