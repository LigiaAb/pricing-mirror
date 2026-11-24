const useColumnasGestionMetodosTarifa = () => {
    const columnas = [
        {
            headerName: 'Tipo',
            field: 'tipo_id',
            type: 'tipo_id',
            labelOption: 'nom_tipo',
            valueOption: 'cod_tipo',
            valueOptions: [],
            editable: true
        },
        {
            headerName: 'Tipo Tarifa',
            field: 'tipo_tarifa_id',
            type: 'tipo_tarifa_id',
            labelOption: 'nom_tipo',
            valueOption: 'cod_tipo',
            valueOptions: [],
            editable: true
        },
        {
            headerName: 'Fecha Inicial',
            field: 'metodo_fecha_inicial',
            type: 'date',
            editable: true
        },
        {
            headerName: 'Fecha Final',
            field: 'metodo_fecha_final',
            type: 'date',
            editable: true
        }
    ];

    return columnas;
};


export default useColumnasGestionMetodosTarifa;