import TablaComponent from '../../components/Tabla/TablaComponent';

const TablaObjetivos = () => {
  const columnas = [
    {
      label: "Descripción",
      campo: "descripcion",
      name: "descripcion"
    },
    {
      label: "Fecha Inicial",
      campo: "fecha_inicial",
      name: "fecha_final"
    },
    {
      label: "Fecha Final",
      campo: "fecha_final",
      name: "fecha_final"
    },
    {
      label: "Cantidad",
      campo: "Cantidad",
      name: "Cantidad"
    }
  ];


  return (
    <TablaComponent
      titulo={'Objetivos'}
      id={'cod_objetivo'}
      encabezado={columnas}
      datos={[]}
      select={false}
      eventosDeTabla={{}}
      botones={{}}
    />
  );
};

export default TablaObjetivos;