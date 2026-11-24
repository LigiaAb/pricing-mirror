import PropTypes from "prop-types";
import { Box } from "@mui/material";
import FormularioCorrelativos from "../../../components/FormularioCorrelativos";

const ManualCrear = ({ onSuccess, onCorrelativoCreado, maxGuias = 1 }) => {
    return (
        <Box sx={{ p: 2 }}>
            <FormularioCorrelativos
                showFields={{
                    cod_empresa: true,
                    cod_cc: true,
                    tipo: true,
                    cod_entidad: true,
                    titulo_guia: true,
                    correlativo_serie: true,
                    correlativo_inicial: false,
                    correlativo_final: false,
                    cantidad_saltos: false,
                    fecha_vence: true,
                    aplicaReplicaAnual: false,
                }}
                enableListaGuias={true}
                maxGuias={maxGuias}
                cancelButtonDisabled={false}
                hideCancel={false}
                onCancel={onSuccess}
                submitButtonPosition="bottom"
                submitButtonText="Guardar y Asignar"
                wrapperProps={{ sx: { p: 0 } }}
                showPreview={false}
                onSuccess={onSuccess}
                onCorrelativoCreado={onCorrelativoCreado}
            />
        </Box>
    );
};

ManualCrear.propTypes = {
    onSuccess: PropTypes.func.isRequired,
    onCorrelativoCreado: PropTypes.func,
    maxGuias: PropTypes.number,
};

export default ManualCrear;
