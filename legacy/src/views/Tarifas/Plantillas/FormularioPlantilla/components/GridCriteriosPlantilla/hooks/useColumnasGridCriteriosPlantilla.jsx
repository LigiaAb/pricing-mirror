const useColumnasGridCriteriosPlantilla = ({
    catalogos
}) => {
    const columnas = [
        {
            type: 'singleSelect',
            headerName: 'Criterio',
            field: 'criterio',
            labelOption: 'descripcion',
            valueOption: 'cod_criterio',
            valueOptions: catalogos.criterios,
            editable: true,
        },
        // {
        //     type: 'text',
        //     headerName: 'Descripción',
        //     field: 'descripcion',
        //     editable: true
        // },
        // {
        //     type: 'boolean',
        //     headerName: 'Estado',
        //     field: 'estado',
        //     editable: false,
        // },
    ];

    return columnas;
};


export default useColumnasGridCriteriosPlantilla;