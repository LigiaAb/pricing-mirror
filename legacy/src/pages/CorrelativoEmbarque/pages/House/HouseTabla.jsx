import PropTypes from "prop-types";
import { Box } from "@mui/material";
import TablaCorrelativos from "../../components/TablaCorrelativos";

const HouseTabla = ({
    datos = undefined,
    titulo = "Correlativos House",
    tipoFilter = "HAWB",
    acciones = {},
    ocultarColumnas = [],
}) => {
    const mergedAcciones = { ver: false, editar: false, eliminar: false, agregar: false, ...acciones };
    const mergedOcultar = [...(Array.isArray(ocultarColumnas) ? ocultarColumnas : [ocultarColumnas]), "correlativoTabla"];
    // Pasar datos tal cual (si no se proporciona, será undefined y TablaCorrelativos hará fetch)
    const datosPropToPass = datos;

    return (
        <Box sx={{ p: 1 }}>
            <TablaCorrelativos
                datos={datosPropToPass}
                titulo={titulo}
                tipoFilter={tipoFilter}
                acciones={mergedAcciones}
                ocultarColumnas={mergedOcultar}
            />
        </Box>
    );
};

HouseTabla.propTypes = {
    titulo: PropTypes.string,
    tipoFilter: PropTypes.string,
    acciones: PropTypes.object,
    ocultarColumnas: PropTypes.arrayOf(PropTypes.string),
    datos: PropTypes.array,
};

export default HouseTabla;
