const useColumnasNombres = ({
    estados
}) => {
    const columnas = [
        { 
            type: 'text',
            headerName: 'Nombre',
            field: 'nombre',
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


export default useColumnasNombres;