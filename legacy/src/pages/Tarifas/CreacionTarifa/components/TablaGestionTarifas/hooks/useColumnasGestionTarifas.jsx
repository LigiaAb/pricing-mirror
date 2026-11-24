const useColumnasGestionTarifas = () => {
    const columnas = [
        {
            label: '#',
            campo: 'cod_servicio',
            name: 'cod_servicio'
        },
        {
            label: 'Nombre de Serivcio',
            campo: 'nombre',
            name: 'nombre'
        },
        {
            label: 'Siglas de Servicio',
            campo: 'siglas',
            name: 'siglas'
        },
        {
            label: 'Rubro',
            campo: 'rubro',
            name: 'rubro'
        },
        {
            label: 'Tipo de Servicio',
            campo: 'tipoServicio',
            name: 'tipoServicio'
        },
        {
            label: 'Tipo de Aplicación',
            campo: 'tipoAplicacion',
            name: 'tipoAplicacion'
        },
        {
            label: 'Estado',
            campo: 'estado',
            name: 'estado'
        },
    ];

    return columnas;
};


export default useColumnasGestionTarifas;