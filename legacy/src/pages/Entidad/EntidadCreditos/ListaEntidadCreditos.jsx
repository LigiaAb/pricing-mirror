import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import TablaEntidadCreditos from '../../../views/Entidad/EntidadCreditos/TablaEntidadCreditos';

const ListaEntidadCreditos = ({ entidad_id }) => {
    entidad_id = parseInt(entidad_id);
    return (
      <Box sx={{ p: 1, m: 0 }}>
        <TablaEntidadCreditos entidad_id={entidad_id}/>
      </Box>
    )
};

ListaEntidadCreditos.propTypes = {
  entidad_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default ListaEntidadCreditos;