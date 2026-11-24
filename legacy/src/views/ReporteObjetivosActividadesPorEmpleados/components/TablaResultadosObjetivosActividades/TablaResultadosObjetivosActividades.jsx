import { useState } from 'react';
import PropTypes from 'prop-types';
import TablaComponent from '../../../../components/Tabla/TablaComponent';
import useColumnasTablaResultadosObjetivos from './hooks/useColumnasTablaResultadosObjetivos';
import HeaderTabla from './components/EncabezadoTablaObjetivosActividades';
import ModalActividades from './components/ModalActividades/ModalActividades';


const TablaResultadosObjetivosActividad = ({ resultado, catalogos }) => {
  const [isModalActividadesRealizadasOpen, setIsModalActividadesRealizadasOpen] = useState(false);
  const [actividadesSeleccionadas, setActividadesSeleccionadas] = useState([]);


  const filasResultadosEmpleados = resultado.empleados.map(empleado => {
    let resultadosEmpleado = empleado.datos;
    const filaResultadosEmpleado = {
      cod_empleado: empleado.cod_usuario,
      nombreEmpleado: empleado.nombre,
    };

    for (let i = 0; i < resultadosEmpleado.length; i++) {
      const cantActividadesRealizadas = resultadosEmpleado[i].actividades.length;
      const nombreColumna = `periodo-${i + 1}`;
      filaResultadosEmpleado[nombreColumna] = cantActividadesRealizadas;
      filaResultadosEmpleado[`actividades-${nombreColumna}`] = resultadosEmpleado[i].actividades;
      filaResultadosEmpleado.propiedadesDeTabla = {
        ...filaResultadosEmpleado.propiedadesDeTabla,
        [nombreColumna]: {
          color: cantActividadesRealizadas >= resultado.cantidad? 'green.main' :'red.main'
        }
      }
    }

    return filaResultadosEmpleado;
  });

  
  const columnas = useColumnasTablaResultadosObjetivos({
    resultado,
    setIsModalActividadesRealizadasOpen,
    setActividadesSeleccionadas
  });


  return (
    <>
      <TablaComponent
        id='cod_empleado'
        titulo={<HeaderTabla resultado={resultado} catalogos={catalogos} />}
        encabezado={columnas}
        datos={filasResultadosEmpleados}
      />

      <ModalActividades
        isOpen={isModalActividadesRealizadasOpen}
        setIsOpen={setIsModalActividadesRealizadasOpen}
        actividades={actividadesSeleccionadas}
      />
    </>
  );
};


TablaResultadosObjetivosActividad.propTypes = {
  catalogos: PropTypes.arrayOf(PropTypes.object),
  resultado: PropTypes.object.isRequired
};


export default TablaResultadosObjetivosActividad;