import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import TablaEntidadImpuestos from '../../../views/Entidad/EntidadImpuestos/TablaEntidadImpuestos';

const ListaEntidadImpuestos = ({ entidad_id }) => {
    entidad_id = parseInt(entidad_id);
    return (
      <Box sx={{ p: 1, m: 0 }}>
        <TablaEntidadImpuestos entidad_id={entidad_id}/>
      </Box>
    )
};

ListaEntidadImpuestos.propTypes = {
  entidad_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default ListaEntidadImpuestos;