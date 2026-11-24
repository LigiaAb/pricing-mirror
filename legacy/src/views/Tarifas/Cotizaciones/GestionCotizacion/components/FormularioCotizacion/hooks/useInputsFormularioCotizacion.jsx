import { CODS_ESTADOS } from "../../../../../constants/estados";
import { REL_TIPOS_CLASIFICACION_TARIFAS } from "../../../../../constants/clasifacionesTarifas";


const useInputsFormularioCotizacion = ({
    valores,
    isLoadingInputProveedor,
	isLoadingInputCliente,
    isItCreating,
    opciones,
    defaultValues,
    readonly,
    setIsOpenDialogBusquedaProveedor,
    setIsOpenDialogCrearProveedor,
	setIsOpenDialogBusquedaCliente,
	setIsOpenDialogCrearCliente,
    hideLabels = false,
    inputsToHide,
    inputsNoObligatorios = [],
	setIsOpenDialogCrearContacto
}) => {
	const centrosCostosSeleccionables = opciones.centrosCostos?.filter(cc => 
		cc.cod_empresa_cc === valores.empresa?.cod_empresa
	);

	const tiposServicioSeleccionables = [
		...(
			opciones.tiposServicio.filter(
				ts => ts.cod_tipo_padre === valores.tipoTransporte?.cod_tipo &&
				ts.cod_estado === CODS_ESTADOS.ACTIVO
			)
		),
		{ label: 'TODOS', value: 0 }
	];

	const tiposAplicacionSeleccionables = [ 
		...(opciones.tiposAplicacion.filter(ta => ta.cod_estado === CODS_ESTADOS.ACTIVO)),
		{ label: 'TODOS', value: 0 }
	];

	const tiposCalculoSeleccionables = opciones.tiposCalculo?.filter(tc => 
		tc.cod_tipo_padre === valores.tipoTransporte?.cod_tipo  &&
		tc.cod_estado === CODS_ESTADOS.ACTIVO
	);

	const tiposCargaSelecionables = [
		...(opciones.tiposCarga.filter(tc => tc.cod_estado === CODS_ESTADOS.ACTIVO)),
		{ label: 'TODOS', value: 0 }
	];

	const clasificacionesCarga = [
		...(opciones.clasificacionesCarga.filter(cc => cc.cod_estado === CODS_ESTADOS.ACTIVO)),
		{ label: 'TODOS', value: 0 }
	];

	const tiposClasificacionSeleccionables = REL_TIPOS_CLASIFICACION_TARIFAS.filter(td => td.cod_tipo_padre === valores.tipoTransporte?.cod_tipo);

	const puntosEnlaceOrigenSeleccionables = opciones.puntosEnlace.filter(pe => 
		pe.cod_pais === valores.paisOrigen?.cod_pais && 
		pe.cod_tipo === valores.tipoPuntoEnlaceOrigen?.cod_tipo
	);

	const puntosEnlaceDestinoSeleccionables = opciones.puntosEnlace.filter(pe => 
		pe.cod_pais === valores.paisDestino?.cod_pais &&
		pe.cod_tipo === valores.tipoPuntoEnlaceDestino?.cod_tipo
	);

	const tiposSeguimientoSeleccionables = opciones.tiposSeguimiento.filter(ts => 
		ts.cod_estado === CODS_ESTADOS.ACTIVO
	);


	const inputs = [
		{
			tipo: 'titulo',
			val: 'Datos',
			variant: 'h6',
			visible: !hideLabels
		},
		{
			tipo: 'select',
			label: 'Empresa',
			id:  'empresa',
			options: opciones.empresas,
			val: valores.empresa,
			requerido: !inputsToHide?.includes('empresa'),
			readonly: readonly || (isItCreating && defaultValues?.cod_empresa),
			visible: !inputsToHide?.includes('empresa')
		},
		{
			tipo: 'select',
			label: 'Centro de Costo',
			id:  'centroCosto',
			options: centrosCostosSeleccionables,
			val: valores.centroCosto,
			requerido: !inputsToHide?.includes('centroCosto'),
			readonly: readonly || !valores.empresa || (isItCreating && defaultValues?.cod_cc),
			visible: !inputsToHide?.includes('centroCosto')
		},
		{
			tipo: 'select',
			label: 'Cliente',
			id:  'cliente',
			options: opciones.clientes,
			val: isLoadingInputCliente ? { label: 'CARGANDO...', value: null } : valores.cliente,
			requerido: !(inputsNoObligatorios?.includes('cliente') || inputsToHide?.includes('cliente')),
			readonly: readonly || isLoadingInputCliente || (isItCreating && defaultValues?.entidad_id),
			visible: !inputsToHide?.includes('cliente'),
			actions:[
				{
					nombre: 'Agregar',
					icono: 'c-suma',
					onClick: () => setIsOpenDialogCrearCliente(true)
				}
			]
		},
		{
			tipo: 'select',
			label: 'Contacto',
			id:  'contacto',
			options: opciones.contactos,
			val: valores.contacto,
			requerido: !(inputsNoObligatorios?.includes('contacto') || inputsToHide?.includes('contacto')),
			readonly: readonly || !valores.cliente || (isItCreating && defaultValues?.entidadcontacto_id),
			visible: !inputsToHide?.includes('contacto'),
			actions: [
				{
					nombre: 'Agregar',
					icono: 'c-suma',
					onClick:  () => setIsOpenDialogCrearContacto(true),
				}
			]
		},
		{
			tipo: 'titulo',
			val: 'Transporte',
			variant: 'h6',
			visible: !hideLabels
		},
		{
			tipo: 'select',
			label: 'Tipo de Transporte',
			id:  'tipoTransporte',
			options: opciones.tiposTransporte.filter(tt => tt.cod_estado === CODS_ESTADOS.ACTIVO),
			val: valores.tipoTransporte,
			requerido: !(inputsNoObligatorios?.includes('tipoTransporte') || inputsToHide?.includes('tipoTransporte')),
			readonly: readonly || (isItCreating && defaultValues?.cod_tipo_transporte),
			visible: !inputsToHide?.includes('tipoTransporte')
		},
		{
			tipo: 'select',
			label: 'Tipo de Servicio',
			id:  'tipoServicio',
			options: tiposServicioSeleccionables,
			val: valores.tipoServicio,
			requerido: !(inputsNoObligatorios?.includes('tipoServicio') || inputsToHide?.includes('tipoServicio')),
			readonly: readonly || !valores.tipoTransporte || (isItCreating && defaultValues?.cod_tipo_servicio),
			visible: !inputsToHide?.includes('tipoServicio')
		},
		{
			tipo: 'titulo',
			val: 'Carga',
			variant: 'h6',
			visible: !hideLabels
		},
		{
			tipo: 'select',
			label: 'Tipo de Carga',
			id:  'tipoCarga',
			options: tiposCargaSelecionables,
			val: valores.tipoCarga,
			requerido: false,
			readonly: readonly || (isItCreating && defaultValues?.cod_tipo_carga),
			visible: !inputsToHide?.includes('tipoCarga')
		},
		{
			tipo: 'select',
			label: 'Clasificación de Carga',
			id:  'clasificacionCarga',
			options: clasificacionesCarga,
			val: valores.clasificacionCarga,
			requerido: false,
			readonly: readonly || (isItCreating && defaultValues?.cod_clasificacion_carga),
			visible: !inputsToHide?.includes('clasificacionCarga')
		},
		{
			tipo: 'titulo',
			val: 'Terminos de Comercio',
			variant: 'h6',
			visible: !hideLabels
		},
		{
			tipo: 'select',
			label: 'Incoterm',
			id:  'incoterm',
			options: opciones.incoterms,
			val: valores.incoterm,
			requerido: false,
			readonly: readonly || (isItCreating && defaultValues?.incoterm_id),
			visible: !inputsToHide?.includes('incoterm')
		},
		{
			tipo: 'select',
			label: 'Tipo de Pago',
			id:  'tipoPago',
			options: opciones.tiposPago.filter(tp => tp.cod_estado === CODS_ESTADOS.ACTIVO),
			val: valores.tipoPago,
			requerido: false,
			readonly: readonly || (isItCreating && defaultValues?.cod_tipo_pago) || valores.estado === CODS_ESTADOS.INACTIVO,
			visible: !inputsToHide?.includes('tipoPago')
		},
		{
			tipo: 'titulo',
			val: 'Origen',
			variant: 'h6',
			visible: !hideLabels && (
                !inputsToHide.includes('paisOrigen') ||
                !inputsToHide.includes('tipoPuntoEnlaceOrigen') ||
                !inputsToHide.includes('puntoEnlaceOrigen')
            )
		},
		{
            tipo: 'select',
            label: 'Pais de Origen',
            id:  'paisOrigen',
            options: opciones.paises,
            val: valores.paisOrigen,
            requerido: true,
            readonly: false,
            visible: true,
            size: 4
        },
		{
            tipo: 'select',
            label: 'Tipo de Origen',
            id:  'tipoPuntoEnlaceOrigen',
            options: opciones.tiposPuntoEnlace,
            val: valores.tipoPuntoEnlaceOrigen,
            requerido: false,
            readonly: !valores.paisOrigen,
            visible: true,
            size: 4
        },
        {
            tipo: 'select',
            label: 'Aduana/Puerto/Aeropuerto de Origen',
            id:  'puntoEnlaceOrigen',
            options: puntosEnlaceOrigenSeleccionables,
            val: valores.puntoEnlaceOrigen,
            requerido: !!valores.tipoPuntoEnlaceOrigen,
            readonly: !valores.tipoPuntoEnlaceOrigen,
            visible: true,
            size: 4
        },
		{
			tipo: 'titulo',
			val: 'Destino',
			variant: 'h6',
			visible: !hideLabels && (
                !inputsToHide.includes('paisDestino') ||
                !inputsToHide.includes('tipoPuntoEnlaceDestino') ||
                !inputsToHide.includes('puntoEnlaceDestino')
            )
		},
    	{
            tipo: 'select',
            label: 'Pais de Destino',
            id:  'paisDestino',
            options: opciones.paises,
            val: valores.paisDestino,
            requerido: true,
            readonly: false,
            visible: true,
            size: 4
        },
		{
            tipo: 'select',
            label: 'Tipo de Destino',
            id:  'tipoPuntoEnlaceDestino',
            options: opciones.tiposPuntoEnlace,
            val: valores.tipoPuntoEnlaceDestino,
            requerido: false,
            readonly: !valores.paisDestino,
            visible: true,
            size: 4
        },
        {
            tipo: 'select',
            label: 'Aduana/Puerto/Aeropuerto de Destino',
            id:  'puntoEnlaceDestino',
            options: puntosEnlaceDestinoSeleccionables,
            val: valores.puntoEnlaceDestino,
            requerido: !!valores.tipoPuntoEnlaceDestino,
            readonly: !valores.tipoPuntoEnlaceDestino,
            visible: true,
            size: 4
        },
	];

	return inputs;
};

export default useInputsFormularioCotizacion;
