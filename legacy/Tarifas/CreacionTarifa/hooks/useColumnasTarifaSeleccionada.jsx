const useColumnasTarifaSeleccionada = () => {
    const columnas = [
        {
            label: 'Nombre de Serivcio',
            campo: 'servicio_nombre',
            name: 'servicio_nombre'
        },
        {
            label: 'Siglas de Servicio',
            campo: 'servicio_siglas',
            name: 'servicio_siglas'
        },
        {
            label: 'Rubro',
            campo: 'rubro_id',
            name: 'rubro_id'
        },
        {
            label: 'Tipo de Servicio',
            campo: 'tipo_servicio_id',
            name: 'tipo_servicio_id'
        },
        {
            label: 'Tipo de Aplicación',
            campo: 'nombre',
            name: 'nombre'
        },
        {
            label: 'Estado',
            campo: 'nombre',
            name: 'nombre'
        },
    ];

    return columnas;
};


export default useColumnasTarifaSeleccionada;