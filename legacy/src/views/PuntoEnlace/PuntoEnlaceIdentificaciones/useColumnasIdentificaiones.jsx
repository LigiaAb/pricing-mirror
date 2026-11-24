const useColumnasIdentificaiones = ({
    tipos = [],
    estados = []
}) => {
    const columnas = [
        { 
            type: 'text',
            headerName: 'Codigo',
            field: 'codigo',
            editable: true,
        },
        {
            type: 'singleSelect',
            headerName: 'Tipo',
            field: 'tipo',
            labelOption: 'nom_tipo',
            valueOption: 'cod_tipo',
            valueOptions: tipos,
            editable: true,
        },
        {
            type: 'singleSelect',
            headerName: 'Estado',
            field: 'estado',
            labelOption: 'estado_desc',
            valueOption: 'cod_estado',
            valueOptions: estados,
            editable: false,
        }
    ];

    return columnas;
};


export default useColumnasIdentificaiones;