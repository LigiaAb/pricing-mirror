const useInputsFormularioRelacionTipo = ({
    tipos,
    tiposPadreSeleccionables,
    valores,
    isEditing,
    optionsEstados,
    isCreating
}) => {
    const inputs = [
        {
            tipo: 'select',
            label: 'Tipo',
            id: 'tipo',
            options: tipos,
            val: valores.tipo,
            requerido: true,
            readonly: !isEditing
        },
        {
            tipo: 'select',
            label: 'Tipo Padre',
            id: 'tipoPadre',
            options: tiposPadreSeleccionables,
            val: valores.tipoPadre,
            requerido: true,
            readonly: !isEditing
        },
        {
            tipo: 'datetime',
            label: 'Fecha de Inicio',
            id: 'fecha_inicio',
            val: valores.fecha_inicio || new Date(),
            requerido: true,
            readonly: true
        },
        {
            tipo: 'select',
            label: 'Estado',
            id: 'estado',
            options: optionsEstados,
            val: valores.estado,
            requerido: true,
            readonly: !isEditing || isCreating
        },
    ];

    return inputs;
};


export default useInputsFormularioRelacionTipo;