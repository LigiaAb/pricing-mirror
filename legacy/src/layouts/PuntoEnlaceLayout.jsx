import PropTypes from 'prop-types';
import { Outlet, Route } from 'react-router-dom';
import ListaPuntosEnlaces from '../pages/PuntoEnlace/ListaPuntosEnlace';
import VistaPuntoEnlace from '../pages/PuntoEnlace/VistaPuntoEnlace';


const PuntoEnlaceLayout = ({ tipo, ruta }) => {
    return (
        <Route path={ruta} element={<Outlet />} loader={() => ({ name: "Accesos-punto-enlace" })}>
          <Route index element={<ListaPuntosEnlaces  tipo={tipo} />} />
          <Route path="crear" element={<VistaPuntoEnlace tipo={tipo} isEditing={true} />} />
          <Route path="editar/:encryptedId" element={<VistaPuntoEnlace tipo={tipo} isEditing={true} />} />
          <Route path=":encryptedId" element={<VistaPuntoEnlace tipo={tipo} />} />
        </Route>
    );
};


PuntoEnlaceLayout.propTypes = {
    tipo: PropTypes.string.isRequired,
    ruta: PropTypes.string.isRequired
};



export default PuntoEnlaceLayout;