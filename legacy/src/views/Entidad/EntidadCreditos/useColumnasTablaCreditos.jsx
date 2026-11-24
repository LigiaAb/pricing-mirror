const useColumnasTablaCreditos = ({
  monedas,
  centrosCostos,
  empresas,
  tipos,
  empresaSeleccionada
}) => {
  const columnas = [
    {
      headerName: 'Moneda',
      field: 'moneda',
      type: 'singleSelect',
      labelOption: 'nom_moneda',
      valueOption: 'cod_moneda',
      valueOptions: monedas,
      editable: true,
    },
    {
      headerName: 'Empresa',
      field: 'empresa',
      type: 'singleSelect',
      labelOption: 'nombre_emp',
      valueOption: 'cod_empresa',
      valueOptions: empresas,
      editable: true
    },
    {
      headerName: 'Centros de Costos',
      field: 'centroCosto',
      type: 'singleSelect',
      labelOption: 'nombre_cc',
      valueOption: 'cod_cc',
      valueOptions: centrosCostos.filter(cc => cc.cod_empresa_cc === empresaSeleccionada?.cod_empresa),
      editable: true
    },
    {
      headerName: 'Fecha de Inicio',
      field: 'entidadcredito_fecha_inicio',
      type: 'date',
      editable: true
    },
    {
      headerName: 'Fecha de Fin',
      field: 'entidadcredito_fecha_fin',
      type: 'date',
      setMin: ({ row }) => {
        return row.entidadcredito_fecha_inicio;
      },
      editable: true
    },
    {
      headerName: 'Dias',
      field: 'entidadcredito_dias_credito',
      type: 'number',
      min: 1,
      editable: true
    },
    {
      headerName: 'Tipo',
      field: 'tipo',
      type: 'singleSelect',
      labelOption: 'nom_tipo',
      valueOption: 'cod_tipo',
      valueOptions: tipos,
      editable: true
    },
    { 
      field: "estado",
      headerName: "Estado",
      editable: false,
      type: "boolean"
    },
  ];

  return columnas;
};

export default useColumnasTablaCreditos;