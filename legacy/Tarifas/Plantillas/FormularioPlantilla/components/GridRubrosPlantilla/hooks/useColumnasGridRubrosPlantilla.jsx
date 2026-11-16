const useColumnasGridRubrosPlantilla = ({
    filaSeleccionada,
    catalogos
}) => {
    const columnas = [
        {
            type: 'singleSelect',
            headerName: 'Rubro',
            field: 'rubro',
            labelOption: 'nombre',
            valueOption: 'cod_rubro',
            valueOptions: catalogos.rubros,
            editable: true,
        },
        {
            type: 'boolean',
            headerName: 'Obligatorio',
            field: 'obligatorio',
            editable: true,
        },
        {
            type: 'number',
            headerName: 'Venta',
            field: 'venta',
            editable: true,
        },
        {
            type: 'checkbox',
            headerName: 'Estado',
            field: 'isActive',
            editable: !filaSeleccionada?.isNew,
        },
    ];

    return columnas;
};


export default useColumnasGridRubrosPlantilla;