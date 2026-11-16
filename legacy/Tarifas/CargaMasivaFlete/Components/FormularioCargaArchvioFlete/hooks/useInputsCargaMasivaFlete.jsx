const useInputsCargaMasivaFlete = ({
	valores,
	opciones
}) => {
	const inputs = [
        {
            tipo: 'select',
            label: 'Empresa',
            id:  'empresa',
            options: opciones.empresas,
            val: valores.empresa,
            requerido: true
        },
        {
            tipo: 'select',
            label: 'Centro de Costo',
            id:  'centroCosto',
            options: opciones.centrosCostos,
            val: valores.centroCosto,
            requerido: true
        },        
		{
            tipo: 'archivo2',
            label: 'Tarifas Costo',
            id: 'costo',
            val: valores.archivo_excel,
			acceptedFiles: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
            requerido: true,
            multiple: false,
            icono: "c-excel"
        },
        {
            tipo: 'archivo2',
            label: 'Tarifas Venta',
            id: 'venta',
            val: valores.archivo_excel,
			acceptedFiles: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
            requerido: true,
            multiple: false,
            icono: "c-excel"
        },
	];

	return inputs;
};

export default useInputsCargaMasivaFlete;
