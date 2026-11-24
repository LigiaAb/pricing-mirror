import { Box, Typography, Tooltip } from '@mui/material';
import obtenerStringFecha from '../../../../../utils/fechaToString';
import { useSelector } from 'react-redux';


const useColumnasTablaResultadosObjetivos = ({
  resultado,
  setIsModalActividadesRealizadasOpen,
  setActividadesSeleccionadas = () => {}
}) => {
  const { opositeMode } = useSelector((state) => state.theme);
  const primerResultadoEmpleado = resultado.empleados[0];
  const cantPeriodos = primerResultadoEmpleado.datos.length;

  let columnas = [
    {
      label: 'Empleado',
      campo: 'nombreEmpleado',
      name: 'nombreEmpleado'
    }
  ];

  for (let i = 0; i < cantPeriodos; i++) {
    const resultadosEmpleado  = primerResultadoEmpleado.datos[i];
    const noPerido = i + 1;

    columnas.push({
      label: (
        <Box display='inline-block'>
          <Tooltip
            title={`${obtenerStringFecha(resultadosEmpleado.fecha_inicial, 'DD/MM/YYYY')} - ${obtenerStringFecha(resultadosEmpleado.fecha_final, 'DD/MM/YYYY')}`}
            placement="bottom"
          >
            <Typography sx={{ whiteSpace: "nowrap" }} textAlign="center" m={0} p={0} color={`primary.${opositeMode}`} fontWeight="bold" px={1}>
              Semana {resultadosEmpleado.numero}
            </Typography>
          </Tooltip>
        </Box>
      ),
      campo: `periodo-${noPerido}`,
      name: `periodo-${noPerido}`,
      formato: (value, rowMetadata) => {
        return (
          <Box 
            onClick={() => {
              if (value === 0) return;
              setIsModalActividadesRealizadasOpen(true);
              setActividadesSeleccionadas(rowMetadata.content[`actividades-periodo-${noPerido}`]);
            }}
            sx={{
              cursor: value > 0 ? 'pointer' : 'default',
              ':hover': {
                backgroundColor: 'primary.light',
                color: 'primary.contrastText'
              },
            }}
          >
            {value}
          </Box>
        );
      }
    });
  }

  return columnas;
};

export default useColumnasTablaResultadosObjetivos;