
import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import PropTypes from 'prop-types';
import { api } from '../../../../api';
import FormularioComponent from '../../../../components/Formulario/FormularioComponent';
import FormularioTarifa from '../../../../pages/Tarifas/CreacionTarifa/components/FormularioTarifa/FormularioTarifa';
import GridRubrosPlantilla from './components/GridRubrosPlantilla/GridRubrosPlantilla';
import useObtenerOpcionesAcciones from '../../../../hooks/useObtenerOpcionesAcciones';
import { useSelector } from 'react-redux';
import { CODS_ESTADOS } from '../../../../constants/estados';


const selectsConValoresLimpios = {
    empresa: null,
    centroCosto: null,
    tipoTransporte: null,
    tipoServicio: null,
    tipoCarga: null,
    clasificacionCarga: null,
    incoterms: null,
    tiposPago: null,
};

const formatRubroToApiSubmissionFormat = (plantilla) => {
    const rubroConFormato = {
        ...plantilla,
        cod_empresa: plantilla.empresa?.value,
        cod_cc: plantilla.centroCosto?.value,
        cod_tipo_transporte: plantilla.tipoTransporte?.value,
        cod_tipo_servicio: plantilla.tipoServicio?.value,
        cod_tipo_carga: plantilla.tipoCarga?.value,
        cod_clasificacion_carga: plantilla.clasificacionCarga?.value,
        incoterm_id: plantilla.incoterm?.value,
        cod_tipo_pago: plantilla.tipoPago?.value,
        cod_estado: plantilla.estado?.value,
    };

    if (!plantilla.tipoServicio?.value) rubroConFormato.cod_tipo_servicio = null;
    if (!plantilla.tipoCarga?.value) rubroConFormato.cod_tipo_carga = null;
    if (!plantilla.tipoPago?.value) rubroConFormato.cod_tipo_pago = null;

    delete rubroConFormato.empresa
    delete rubroConFormato.centroCosto
    delete rubroConFormato.tipoTransporte
    delete rubroConFormato.tipoServicio
    delete rubroConFormato.tipoCarga
    delete rubroConFormato.clasificacionCarga
    delete rubroConFormato.incoterm
    delete rubroConFormato.tipoPago
    delete rubroConFormato.estado
    return rubroConFormato;
};


const FormularioPlantilla = ({
    defaultValues,
    isItCreating = true,
    readonly = false,
    onSubmit = () => {},
    catalogos
}) => {
    const { permisosArray } = useObtenerOpcionesAcciones();
    const formularioFiltroTarifasRef = useRef(null);
    const { empresas = [], centrosCosto = [], tiposTransporte = [], tiposServicio = [], tiposCarga = [], clasificacionesCarga = [], incoterms = [], tiposPago = [], estados = [] } = catalogos;

    const opcion = permisosArray.find(o => o.nom_opcion === 'Información');
    const puedeEditar = opcion?.acciones?.some(a => a.nom_accion === 'Editar') && (isItCreating || !readonly);

    const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
    const isItEditing = !isItCreating && !readonly;

    const valoresIniciales = useMemo(() => {
        const estado = estados.find(e => e.cod_estado === CODS_ESTADOS.ACTIVO);
        return {
            descripcion: '',
            ...selectsConValoresLimpios,
            empresa: currentEmpresa,
            centroCosto: currentCentroCosto,
            estado
        };
    }, [currentEmpresa, currentCentroCosto, tiposCarga, clasificacionesCarga, estados]);

    const [valores, setValores] = useState(valoresIniciales);

    useEffect(() => {
        if (defaultValues) {
            const empresa = empresas.find(e => e.cod_empresa === defaultValues.cod_empresa);
            const centroCosto = centrosCosto.find(cc => cc.cod_cc === defaultValues.cod_cc);
            const tipoTransporte = tiposTransporte.find(t => t.cod_tipo === defaultValues.cod_tipo_transporte);
            const tipoServicio = tiposServicio.find(t => t.cod_tipo === defaultValues.cod_tipo_servicio);
            const tipoCarga = tiposCarga.find(tc => tc.cod_tipo === defaultValues.cod_tipo_carga);
            const clasificacionCarga = clasificacionesCarga.find(c => c.cod_tipo === defaultValues.cod_clasificacion_carga);
            const incoterm = incoterms.find(i => i.cod_incoterm === defaultValues.incoterm_id);
            const tipoPago = tiposPago.find(tp => tp.cod_tipo === defaultValues.cod_tipo_pago);
            const estado = estados.find(e => e.cod_estado === defaultValues.cod_estado);
            setValores({
                ...defaultValues,
                ...selectsConValoresLimpios,
                empresa,
                centroCosto,
                tipoTransporte,
                tipoServicio,
                tipoCarga,
                clasificacionCarga,
                incoterm,
                tipoPago,
                estado
            });
        } else {
            setValores(valoresIniciales);
        }
    }, [defaultValues, valoresIniciales, empresas, centrosCosto, tiposTransporte, tiposServicio, estados, tiposCarga, clasificacionesCarga, incoterms, tiposPago]);


    const formatPlantillaToFormFormat = useCallback(plantilla => {
        const plantillaConFormato = {
            ...plantilla,
            empresa: plantilla.empresa || empresas.find(e => e.cod_empresa === plantilla.cod_empresa),
            centroCosto: plantilla.centroCosto || centrosCosto.find(cc => cc.cod_cc === plantilla.cod_cc),
            tipoTransporte: plantilla.tipoTransporte || tiposTransporte.find(t => t.cod_tipo === plantilla.cod_tipo_transporte),
            tipoServicio: !plantilla.tipoServicio || plantilla.tipoServicio?.value === 0
                ? { label: 'TODOS', value: 0 }
                : plantilla.tipoServicio || tiposServicio.find(ts => ts.cod_tipo === plantilla.cod_tipo_servicio),
            tipoCarga: !plantilla.tipoCarga || plantilla.tipoCarga?.value === 0
                ? { label: 'TODOS', value: 0 }
                : plantilla.tipoCarga || tiposCarga.find(tc => tc.cod_tipo === plantilla.cod_tipo_carga),
            clasificacionCarga: plantilla.clasificacionCarga || (
                plantilla.cod_clasificacion_carga ?
                clasificacionesCarga.find(c => c.cod_tipo === plantilla.cod_clasificacion_carga) :
                clasificacionesCarga.find(c => c.label === 'GENERAL')
            ),
            incoterm: plantilla.incoterm || incoterms.find(i => i.incoterm_id === plantilla.incoterm_id),
            tipoPago: !plantilla.tipoPago
                ? tiposPago.find(tp => tp.label === 'PREPAID / COLLECT')
                : plantilla.tipoPago || tiposPago.find(tp => tp.cod_tipo_pago === plantilla.cod_tipo),
            estado: plantilla.estado || estados.find(e => e.cod_estado === plantilla.cod_estado),
        };
        return plantillaConFormato;
    }, [empresas, centrosCosto, tiposTransporte, tiposServicio, tiposCarga, clasificacionesCarga, incoterms, tiposPago, estados]);


    
    const valoresConFormatoDeFormulario = formatPlantillaToFormFormat(valores);


    const handleInputChange = ({ id, val}) => {
        setValores(prev => {
            const nuevoValor = { ...prev, [id]: val };

            if (id === 'empresa') nuevoValor.centroCosto = nuevoValor.cod_cc = null;
            if (id === 'tipoTransporte') nuevoValor.tipoServicio = nuevoValor.cod_tipo_servicio = null;

            return nuevoValor;
        });
    };


    const centrosCostoSeleccinables = centrosCosto.filter(c => c.cod_empresa_cc === valores.empresa?.cod_empresa);
    const tiposServicioSeleccionables = [
        ...(tiposServicio.filter(ts => ts.codsTiposPadres.includes(valores.tipoTransporte?.cod_tipo))),
        { label: 'TODOS', value: 0 } 
    ];
    const tiposCargaSelecionables = [
        ...tiposCarga,
        { label: 'TODOS', value: 0 }
    ]
    const estadosSeleccionables = estados.filter(e => [CODS_ESTADOS.ACTIVO, CODS_ESTADOS.INACTIVO].includes(e.cod_estado));
    let inputs = [
        {
            tipo: 'textarea',
            label: 'Descripción',
            id: 'descripcion',
            val: valoresConFormatoDeFormulario.descripcion,
            requerido: true,
            readonly: !puedeEditar,
            size: 12
        },
        {
            tipo: 'select',
            label: 'Empresa',
            id: 'empresa',
            options: empresas,
            val: valoresConFormatoDeFormulario.empresa,
            requerido: true,
            readonly: !puedeEditar
        },
        {
            tipo: 'select',
            label: 'Centro de Costo',
            id: 'centroCosto',
            options: centrosCostoSeleccinables,
            val: valoresConFormatoDeFormulario.centroCosto,
            requerido: true,
            readonly: !puedeEditar || !valoresConFormatoDeFormulario.empresa
        },
        {
            tipo: 'select',
            label: 'Tipo de Transporte',
            id: 'tipoTransporte',
            options: tiposTransporte,
            val: valoresConFormatoDeFormulario.tipoTransporte,
            requerido: true,
            readonly: !puedeEditar
        },
        {
            tipo: 'select',
            label: 'Tipo de Servicio',
            id: 'tipoServicio',
            options: tiposServicioSeleccionables,
            val: valoresConFormatoDeFormulario.tipoServicio,
            requerido: true,
            readonly: !puedeEditar || !valoresConFormatoDeFormulario.tipoTransporte
        },
        {
            tipo: 'select',
            label: 'Tipo de Carga',
            id:  'tipoCarga',
            options: tiposCargaSelecionables,
            val: valoresConFormatoDeFormulario.tipoCarga,
            requerido: true,
            readonly: !puedeEditar
        },
        {
            tipo: 'select',
            label: 'Clasificación de Carga',
            id:  'clasificacionCarga',
            options: clasificacionesCarga,
            val: valoresConFormatoDeFormulario.clasificacionCarga,
            requerido: true,
            readonly: !puedeEditar
        },
        {
            tipo: 'select',
            label: 'Incoterm',
            id:  'incoterm',
            options: incoterms,
            val: valoresConFormatoDeFormulario.incoterm,
            requerido: true,
            readonly: !puedeEditar || (isItCreating && defaultValues?.incoterm_id)
        },
        {
            tipo: 'select',
            label: 'Tipo de Pago',
            id:  'tipoPago',
            options: tiposPago,
            val: valoresConFormatoDeFormulario.tipoPago,
            requerido: true,
            readonly: !puedeEditar
        },
        {
            tipo: 'select',
            label: 'Estado',
            id: 'estado',
            options: estadosSeleccionables,
            val: valoresConFormatoDeFormulario.estado,
            requerido: true,
            readonly: true,
            visible: !isItCreating
        }
    ];


    const handleSubmit = async () => {
        let baseApiURL = isItCreating ? '/api/appweb/insertar-tarifa-plantilla' : '/api/appweb/actualizar-tarifa-plantilla';
        const reqBody = formatRubroToApiSubmissionFormat(valores);

        if (reqBody.cod_estado === CODS_ESTADOS.INACTIVO) {
            if (!reqBody.fecha_final) reqBody.fecha_final = new Date();
        } else {
            reqBody.fecha_final = null;
        }

        let response = await api.post(baseApiURL, reqBody);
        if (!response.data.data.success) return;

        const cod_tarifaplantilla = +response.data.data.cod_tarifaplantilla;

        baseApiURL = '/api/appweb/lista-tarifa-plantilla';
        response = await api.get(baseApiURL, { params: { cod_tarifaplantilla } });
        const plantilla = response.data.data.find(p => p.cod_tarifaplantilla === cod_tarifaplantilla);
        const nuevosValores = formatPlantillaToFormFormat(plantilla);
        setValores(nuevosValores)

        onSubmit(plantilla);
    };


    return (
        <Box display='flex' flexDirection='column' gap={2}>
            <FormularioComponent
                titulo='Plantilla'
                inputs={inputs}
                onInput={handleInputChange}
                botones={{
                    agregar: { visible: isItCreating, onClick: handleSubmit },
                    editar: { visible: isItEditing, onClick: handleSubmit }
                }}
            />

            {
                !!valores.cod_tarifaplantilla && (
                    <Box display='flex' flexDirection='column' gap={3}>
                        <Box display='flex' flexDirection='column' gap={1}>
                            <Typography variant='h6'>Rubros de la Plantilla</Typography>
                            <GridRubrosPlantilla
                                cod_tarifaplantilla={valores.cod_tarifaplantilla}
                                catalogos={catalogos}
                            />
                        </Box>
                    </Box>
                )
            }
        </Box>
    );
};


FormularioPlantilla.propTypes = {
    defaultValues: PropTypes.object,
    isItCreating: PropTypes.bool,
    readonly: PropTypes.bool,
    onSubmit: PropTypes.func,
    catalogos: PropTypes.shape({
        empresas: PropTypes.array,
        centrosCosto: PropTypes.array,
        tiposTransporte: PropTypes.array,
        tiposServicio: PropTypes.array,
        tiposCarga: PropTypes.array,
        clasificacionesCarga: PropTypes.array,
        incoterms: PropTypes.array,
        tiposPago: PropTypes.array,
        estados: PropTypes.array
    })
};


export default FormularioPlantilla;