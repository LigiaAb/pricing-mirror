import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useNavigate } from "react-router-dom/dist";
import { encryptId } from "../../api/encryptDecrypt";
import moment from "moment";
import { api } from "../../api";
const FormularioCompletoCorrelativo = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    correlativo, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    catalogos, // Catalogos referentes al crud
  } = props;
  const { estados = [], tipo = [], empresa = [], centrosCosto = [] } = catalogos;
  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    correlativo_id: 0,
    tabla_correlativo: "",
    correlativo_codigo: "",
    correlativo_actual: 0,
    correlativo_inicial: 0,
    correlativo_final: 0,
    correlativo_serie: "",
    correlativo_fecha_vencimiento: null,
    correlativo_fecha: null,
    cod_cc: null,
    cod_empresa: null,
    cod_tipo: null,
    cod_estado: null,
  });
  const navigate = useNavigate();
  const [key, setKey] = useState(0);
  /**
   * FORMULARIO
   * Es un use Memo que contiene el contenido del formulario incluyendo:
   * - inputs
   * - valores
   * - opciones
   */
  const inputs = useMemo(() => {
    const {
      correlativo_id,
      tabla_correlativo,
      correlativo_codigo,
      correlativo_actual,
      correlativo_inicial,
      correlativo_final,
      correlativo_fecha,
      correlativo_fecha_vencimiento,
      correlativo_serie,
      cod_empresa,
      cod_cc,
      cod_tipo,
      cod_estado,
    } = valores;

    let estadosLista = estados.map((i) => ({ ...i, label: i.estado_desc, value: i.cod_estado }));

    let tipoLista = tipo.map((i) => ({ ...i, label: i.nom_tipo, value: i.cod_tipo }));
    let empresaLista = empresa.map((i) => ({ ...i, label: i.nombre_emp, value: i.cod_empresa }));
    let centrosCostoLista = cod_empresa ? centrosCosto.map((i) => ({ ...i, label: i.nombre_cc, value: i.cod_cc })).filter((i) => i.cod_empresa_cc === cod_empresa.cod_empresa) : [];

    return [
      { id: "correlativo_id", label: "correlativo", tipo: "number", val: correlativo_id, readonly: true },
      { id: "tabla_correlativo", label: "tabla", tipo: "text", val: tabla_correlativo, readonly: false },
      { id: "correlativo_codigo", label: "Codigo", tipo: "text", val: correlativo_codigo, readonly: false },
      { id: "correlativo_actual", label: "Actual", tipo: "number", val: correlativo_actual, readonly: false },
      { id: "correlativo_inicial", label: "Inicial", tipo: "number", val: correlativo_inicial, readonly: false },
      { id: "correlativo_final", label: "Final", tipo: "number", val: correlativo_final, readonly: false },
      { id: "correlativo_serie", label: "Serie", tipo: "text", val: correlativo_serie, readonly: false },
      {
        id: "correlativo_fecha_vencimiento",
        label: "Fecha de vencimiento",
        tipo: "date",
        min: new Date(),
        val: correlativo_fecha_vencimiento,
        readonly: false,
      },
      { id: "cod_empresa", label: "empresa", tipo: "select", val: cod_empresa, options: empresaLista },
      { id: "cod_cc", label: "centro de costo", tipo: "select", val: cod_cc, options: centrosCostoLista },
      { id: "cod_tipo", label: "tipo", tipo: "select", val: cod_tipo, options: tipoLista?.filter((i) => i.tipo_tabla === valores?.tabla_correlativo) },
      { id: "correlativo_fecha", label: "Fecha de ingreso", tipo: "date", val: correlativo_fecha, readonly: true },
      { id: "cod_estado", label: "Estado", tipo: "select", val: cod_estado, options: estadosLista, readonly: true },
    ];
  }, [valores, estados, tipo, empresa, centrosCosto]);
  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */
  const onInput = useCallback(({ id, val }) => {
    console.log(id, val);
    setValores((v) => ({ ...v, [id]: val }));
  }, []);
  const agregar = useCallback(async () => {
    const {
      correlativo_id,
      tabla_correlativo,
      correlativo_codigo,
      correlativo_actual,
      correlativo_inicial,
      correlativo_final,
      correlativo_fecha,
      correlativo_fecha_vencimiento,
      correlativo_serie,
      cod_empresa,
      cod_cc,
      cod_tipo,
      cod_estado,
    } = valores;
    await api
      .post("api/appweb/insertar-correlativos", {
        correlativo_id,
        correlativo_tabla: tabla_correlativo,
        correlativo_codigo,
        correlativo_actual,
        correlativo_inicial,
        correlativo_final,
        correlativo_fecha,
        correlativo_fecha_vencimiento,
        correlativo_serie,
        cod_empresa: cod_empresa?.value || null,
        cod_cc: cod_cc?.value || null,
        cod_tipo: cod_tipo?.value || null,
        cod_estado: cod_estado?.value || null,
      })
      .then(({ data }) => navigate(`/configuracion/crud/correlativo/${encryptId(data.data.correlativo_id)}`));
  }, [navigate, valores]);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(() => {
    const {
      correlativo_id,
      tabla_correlativo,
      correlativo_codigo,
      correlativo_actual,
      correlativo_inicial,
      correlativo_final,
      correlativo_fecha,
      correlativo_fecha_vencimiento,
      correlativo_serie,
      cod_empresa,
      cod_cc,
      cod_tipo,
      cod_estado,
    } = valores;
    api.post("api/appweb/actualizar-correlativos", {
      correlativo_id,
      correlativo_tabla: tabla_correlativo,
      correlativo_codigo,
      correlativo_actual,
      correlativo_inicial,
      correlativo_final,
      correlativo_fecha,
      correlativo_fecha_vencimiento,
      correlativo_serie,
      cod_empresa: cod_empresa?.value || null,
      cod_cc: cod_cc?.value || null,
      cod_tipo: cod_tipo?.value || null,
      cod_estado: cod_estado?.value || null,
    });
  }, [valores]);
  const filtrar = useCallback(() => {}, []);
  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    setValores(() => {
      const {
        correlativo_id,
        tabla_correlativo,
        correlativo_codigo,
        correlativo_actual,
        correlativo_inicial,
        correlativo_final,
        correlativo_fecha,
        correlativo_tabla,
        correlativo_fecha_vencimiento,
        correlativo_serie,
        cod_estado,
      } = correlativo;
      const estado = estados.find((i) => i.cod_estado === cod_estado);
      return {
        correlativo_id: correlativo_id || 0,
        correlativo_tabla: tabla_correlativo,
        tabla_correlativo,
        correlativo_codigo,
        correlativo_actual: correlativo_actual || 0,
        correlativo_inicial: correlativo_inicial || 0,
        correlativo_final: correlativo_final || 0,
        correlativo_fecha: correlativo_fecha ? new Date(correlativo_fecha) : new Date(),
        correlativo_fecha_vencimiento: correlativo_fecha_vencimiento ? new Date(correlativo_fecha_vencimiento) : null,
        correlativo_serie: correlativo_serie || "",
        cod_empresa: correlativo.cod_empresa ? { value: correlativo.cod_empresa, label: correlativo.nombre_emp } : null,
        cod_cc: correlativo.cod_cc ? { value: correlativo.cod_cc, label: correlativo.nombre_cc } : null,
        cod_tipo: correlativo.cod_tipo ? { value: correlativo.cod_tipo, label: correlativo.nom_tipo } : null,
        cod_estado: estado ? { ...estado, label: estado.estado_desc, value: estado.cod_estado } : { value: 1, label: "ACTIVO" },
      };
    });
    setKey((i) => i + 1);
  }, [estados, correlativo]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      {correlativo.correlativo_fecha}
      <FormularioComponent
        key={key}
        inputs={inputs}
        onInput={onInput}
        botones={{
          agregar: { visible: id === "new", onClick: () => agregar() },
          cancelar: { visible: false, onClick: cancelar },
          guardar: { visible: id !== "new", onClick: () => guardar() },
          filtrar: { visible: false, onClick: filtrar },
        }}
      />
      {/* <pre>{JSON.stringify(valores, null, 2)}</pre> */}
    </Box>
  );
};
FormularioCompletoCorrelativo.propTypes = {
  // ELEMENTO
  correlativo: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,
};
export default FormularioCompletoCorrelativo;
