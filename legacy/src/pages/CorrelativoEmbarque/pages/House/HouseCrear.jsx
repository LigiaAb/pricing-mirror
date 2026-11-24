import PropTypes from "prop-types";
import { Paper } from "@mui/material";
import FormularioCorrelativos from "../../components/FormularioCorrelativos";
import { getRefTipoSecuenciaHouse } from "../../utils/getRefTipoSecuencia";

const HouseCrear = ({ onCorrelativoCreado, onMostrarSecuencias, createOnServer = false }) => {
  return (
    <FormularioCorrelativos
      title="Configuración de Correlativo"
      onCorrelativoCreado={onCorrelativoCreado}
      onMostrarSecuencias={onMostrarSecuencias}
      createOnServer={createOnServer}
      getRefTipoSecuenciaFn={getRefTipoSecuenciaHouse}
      submitButtonText="Generar Secuencia"
      hideCancel={true}
      wrapperComponent={Paper}
      wrapperProps={{ sx: { p: 3 } }}
      requiredFields={[
        "cod_empresa",
        "cod_cc",
        "titulo_guia",
        "correlativo_serie",
        "correlativo_inicial",
        "correlativo_final",
        "cantidad_saltos",
      ]}
    />
  );
};

HouseCrear.propTypes = {
  onCorrelativoCreado: PropTypes.func.isRequired,
  onMostrarSecuencias: PropTypes.func,
  createOnServer: PropTypes.bool,
};

export default HouseCrear;
