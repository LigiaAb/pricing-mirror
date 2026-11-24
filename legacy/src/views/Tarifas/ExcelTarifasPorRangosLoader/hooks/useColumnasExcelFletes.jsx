
import * as Yup from 'yup';


const useColumnasExcelFletes = () => {
	const columnas = [
		{
			label: 'Rubro',
			campo: 'rubro',
			yupSchema: Yup.string()
				.required('Rubro es obligatorio')
		},
		{
			label: 'Nombre de Servicio',
			campo: 'nombre',
			yupSchema: Yup.string()
				.required('Nombre de servicio es obligatorio')
		},
		{
			label: 'Siglas',
			campo: 'siglas',
			yupSchema: Yup.string()
				.required('Siglas son obligatorias')
		},
		{
			label: 'Proveedor',
			campo: 'proveedor',
			yupSchema: Yup.string()
				.required('Proveedor es obligatorio')
		},
		{
			label: 'Empresa',
			campo: 'empresa',
			yupSchema: Yup.string()
				.required('Empresa es obligatoria')
		},
		{
			label: 'Centro de Costo',
			campo: 'centroCosto',
			yupSchema: Yup.string()
				.required('Centro de Costo es obligatorio')
		},
		{
			label: 'Tipo de Transporte',
			campo: 'tipoTransporte',
			yupSchema: Yup.string()
				.required('Tipo de Transporte es obligatorio')
		},
		{
			label: 'Tipo de Servicio',
			campo: 'tipoServicio',
			yupSchema: Yup.string()
				.required('Tipo de Servicio es obligatorio')
		},
		{
			label: 'Tipo de Aplicación',
			campo: 'tipoAplicacion',
			yupSchema: Yup.string()
				.required('Tipo de Aplicación es obligatorio')
		},
		{
			label: 'Tipo de Calculo',
			campo: 'tipoCalculo',
			yupSchema: Yup.string()
				.required('Tipo de Cálculo es obligatorio')
		},
		{
			label: 'Tipo de Deudor',
			campo: 'tipoDeudor',
			yupSchema: Yup.string()
				.required('Tipo de Deudor es obligatorio')
		},
		{
			label: 'Tipo de Carga',
			campo: 'tipoCarga',
			yupSchema: Yup.string()
				.required('Tipo de Carga es obligatorio')
		},
		{
			label: 'Clasificación de Carga',
			campo: 'clasificacionCarga',
			yupSchema: Yup.string()
				.required('Clasificación de Carga es obligatorio')
		},
		{
			label: 'Incoterm',
			campo: 'incoterm',
			yupSchema: Yup.string()
				.required('Incoterm es obligatorio')
		},
		{
			label: 'Tipo de Pago',
			campo: 'tipoPago',
			yupSchema: Yup.string()
				.required('Tipo de Pago es obligatorio')
		},


		{
			label: 'Minimo',
			campo: 'minimo',
			yupSchema: Yup.number()
				.required('El ingreso de un valor es obligatorio')
				.typeError('Debe ser un número')
				.min(0, 'El valor debe ser mayor o igual a 0')
		},
		{
			label: '<45',
			campo: 'menor45',
			yupSchema: Yup.number()
				.required('El ingreso de un valor es obligatorio')
				.typeError('Debe ser un número')
				.min(0, 'El valor debe ser mayor o igual a 0')
		},
		{
			label: '>45',
			campo: 'mayor45',
			yupSchema: Yup.number()
				.required('El ingreso de un valor es obligatorio')
				.typeError('Debe ser un número')
				.min(0, 'El valor debe ser mayor o igual a 0')
		},
	];

	return columnas;
};


export default useColumnasExcelFletes;
