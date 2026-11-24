import PropTypes from "prop-types";
import GridRelacionesEntidad from "../../../views/Entidad/EntidadRelaciones/GridRelacionesEntidad/GridRelacionesEntidad";


const VistaEntidadRelacion = ({
	entidad,
}) => {
	return (
		<GridRelacionesEntidad entidad={entidad}/>
	);
};


VistaEntidadRelacion.propTypes = {
	entidad: PropTypes.object
};


export default VistaEntidadRelacion;