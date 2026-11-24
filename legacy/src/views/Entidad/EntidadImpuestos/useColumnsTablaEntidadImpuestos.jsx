const useColumnsTablaEntidadImpuestos = ({
  paisesEntidad,
  impuestosSeleccionables,
  editable = true,
}) => {
  const columnas = [
    {
      headerName: 'Pais',
      field: 'pais',
      type: 'singleSelect',
      labelOption: 'nombre_pais',
      valueOption: 'cod_pais',
      valueOptions: paisesEntidad,
      editable: true
    },
    {
      headerName: 'Tipo de Impuesto',
      field: 'impuestoPais',
      type: 'singleSelect',
      labelOption: 'nom_impuesto',
      valueOption: 'cod_impuesto',
      valueOptions: impuestosSeleccionables,
      editable: true
    },
    {
      headerName: 'Porcentaje de Impuesto',
      field: 'porcentaje_impuesto',
      type: 'number',
      editable: false
    },
    {
      headerName: 'Aplica',
      field: 'aplica',
      type: 'boolean',
      editable: true
    },
    { 
      field: 'estado',
      headerName: 'Estado',
      type: 'boolean',
      editable: false
    }
  ];

  return columnas;
};

export default useColumnsTablaEntidadImpuestos;