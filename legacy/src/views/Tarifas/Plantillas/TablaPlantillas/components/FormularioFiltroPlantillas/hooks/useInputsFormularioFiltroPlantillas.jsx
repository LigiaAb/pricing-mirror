const useInputsFormularioFiltroPlantillas = ({
	valores,
	opciones
}) => {
    const centrosCostosSeleccionables = opciones.centrosCostos?.filter(cc => 
        cc.cod_empresa_cc === valores.empresa?.cod_empresa
    );
	
	const inputs = [
		{
			tipo: 'select',
			label: 'Empresa',
			id: 'empresa',
			options: opciones.empresas,
			val: valores.empresa,
			requerido: false,
			readonly: false,
		},
		{
			tipo: 'select',
			label: 'Centro Costo',
			id: 'centroCosto',
			options: centrosCostosSeleccionables,
			val: valores.centroCosto,
			requerido: false,
			readonly: false,
		},
	];

	return inputs;
};

export default useInputsFormularioFiltroPlantillas;
