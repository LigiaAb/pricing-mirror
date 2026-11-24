import PropTypes from 'prop-types';
import { Box, Typography, Chip, Icon } from '@mui/material';
import obtenerStringFecha from '../../../../../utils/fechaToString'; 

const HeaderTabla = ({ resultado, catalogos }) => {
  const nombrePeriodicidad = catalogos.periodicidades.find(p => p.cod_periodicidad === resultado.cod_periodicidad)?.descripcion;

  return (
    <Box mb={2}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Chip
          icon={<Icon className="c-memos" />}
          label={resultado.tipo_descripcion}
          color="primary"
          size='small'
          sx={{
            fontWeight: 500
          }}
        />
        <Typography sx={{ fontWeight: 900, fontSize: 16, color: 'grey.700' }}>{resultado.descripcion}</Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}>
          <Icon sx={{ mr: 1 }} className="c-calendario-actividad" />
          <Typography variant="body2">{obtenerStringFecha(resultado.fecha_inicial, 'DD/MM/YYYY')} - {obtenerStringFecha(resultado.fecha_final, 'DD/MM/YYYY')}</Typography>
        </Box>
        
        <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}>
          <Icon sx={{ mr: 1 }} className="c-reloj" />
          <Typography variant="body2">Periodicidad: {nombrePeriodicidad}</Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", color: "text.secondary" }}>
          <Icon sx={{ mr: 1 }} className="c-numeros" />
          <Typography variant="body2">Cantidad: {resultado.cantidad}</Typography>
        </Box>

      </Box>
    </Box>
  );
};


HeaderTabla.propTypes = {
  resultado: PropTypes.object.isRequired,
  catalogos: PropTypes.object.isRequired
};

export default HeaderTabla;