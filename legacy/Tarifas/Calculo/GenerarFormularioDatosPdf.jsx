import React from "react";
import PropTypes from "prop-types";
import FormularioComponent from "@/components/Formulario/FormularioComponent";
import AcordeonComponent2 from "@/components/AcordeonComponent/AcordeonComponent2";
import { Box, Icon, Typography } from "@mui/material";
import BandaAlertaComponent from "@/components/Alertas/BandaAlertaComponent";
/**
OPCIONALES: null
SALIDA: null
TIPO_TRANSITO: null
 */
const GenerarFormularioDatosPdf = (props) => {
  const { lectura, valoresDefault, onValoresChange, cotizacion } = props;
  // const [valores, setValores] = React.useState({ tipo_transito: null, salida: null, opcionales: null });

  const [abrir, setAbrir] = React.useState(true);

  const inputs = React.useMemo(
    () => [
      {
        id: "observacion",
        label: "Observacion",
        val: valoresDefault?.observacion || "",
        tipo: "textarea",
        required: false,
        readonly: lectura,
        size: 12,
        rows: 2,
      },
      { id: "tipo_servicio", label: "Tipo de Servicio", val: valoresDefault?.tipo_servicio || "", tipo: "text", required: true, requerido: true, readonly: lectura, size: 12 },
      { id: "tipo_transito", label: "Tiempo de Transito", val: valoresDefault?.tipo_transito || "", tipo: "text", required: true, requerido: true, readonly: lectura, size: 12 },
      { id: "salida", label: "Salida", val: valoresDefault?.salida || "", tipo: "text", required: true, requerido: true, readonly: lectura, size: 12 },
      { id: "tipo_producto", label: "Tipo de Producto", val: valoresDefault?.tipo_producto || "", tipo: "text", required: true, requerido: true, readonly: lectura, size: 12 },
      { id: "opcionales", label: "Opcionales", val: valoresDefault?.opcionales || "", tipo: "textarea", required: false, readonly: lectura, size: 12, rows: 2 },
    ],
    [valoresDefault, lectura],
  );

  const camposFaltantes = React.useMemo(() => {
    const data = [];
    if (!valoresDefault?.tipo_servicio) data.push("Tipo de Servicio");
    if (!valoresDefault?.tipo_transito) data.push("Tiempo de Transito");
    if (!valoresDefault?.salida) data.push("Salida");
    if (!valoresDefault?.tipo_producto) data.push("Tipo de Producto");
    // if (!!cotizacion?.entidad_id_estacion && !valoresDefault?.contacto_estacion) data.push("Contacto de la Estación");
    return data;
  }, [valoresDefault]);
  const faltanDatos = React.useMemo(() => {
    return !!camposFaltantes.length;
  }, [camposFaltantes]);

  const handleOnInputChange = ({ id, val }) => {
    onValoresChange({ id, val });
  };

  const toggleAcordeon = (p, exp) => {
    p.preventDefault();
    if (exp === undefined) return;
    setAbrir(exp);
  };

  return (
    <>
      <AcordeonComponent2
        expandido={abrir}
        expandir={toggleAcordeon}
        propiedades={{
          bgcolorAcordeon: "transparent",
          bgcolor: "primary.main",
          titulo: { color: "white.main" },
          borderRadius: 1.5,
        }}
        titulo={
          <Box display="flex" justifyContent="space-between" p={0.8} width="100%">
            <Typography variant="h6">Datos complementarios de cotización</Typography>
            <Icon className={abrir ? "c-arriba-simple" : "c-abajo-simple"} />
          </Box>
        }
        cuerpo={
          <Box display="flex" flexDirection="column" px={1}>
            {!lectura && faltanDatos && <BandaAlertaComponent tipo="error">Debe llenar los campos: {camposFaltantes.join(", ")}</BandaAlertaComponent>}
            <FormularioComponent key={valoresDefault?.cod_cotizaciondetalle || 0} inputs={inputs} botones={{ agregar: { visible: false } }} onInput={handleOnInputChange} />
          </Box>
        }
      />
    </>
  );
};

GenerarFormularioDatosPdf.propTypes = {
  lectura: PropTypes.bool,
  valoresDefault: PropTypes.shape({
    cod_cotizaciondetalle: PropTypes.number,
    tipo_transito: PropTypes.string,
    salida: PropTypes.string,
    opcionales: PropTypes.string,
    observacion: PropTypes.string,
    tipo_servicio: PropTypes.string,
    tipo_producto: PropTypes.string,
    contacto_estacion: PropTypes.string,
  }),
  cotizacion: PropTypes.object,
  onValoresChange: PropTypes.func,
};

export default GenerarFormularioDatosPdf;
