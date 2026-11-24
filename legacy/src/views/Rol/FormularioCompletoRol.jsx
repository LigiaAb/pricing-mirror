import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useLocation } from "react-router-dom";
import moment from "moment/moment";
import { api } from "../../api";
import { useNavigate } from "react-router-dom/dist";
import { encryptId } from "../../api/encryptDecrypt";
const FormularioCompletoRol = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    rol, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    catalogos,
  } = props;
  const { estados = [] } = catalogos;
  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    cod_rol: 0,
    rol_desc: "",
    cod_estado: { value: 1, label: "ACTIVO" },
    fecha_reg: null,
  });
  const [key, setKey] = useState(0);
  const navigate = useNavigate();
  /**
   * FORMULARIO
   * Es un use Memo que contiene el contenido del formulario incluyendo:
   * - inputs
   * - valores
   * - opciones
   */
  const inputs = useMemo(() => {
    const { rol_desc, cod_rol, fecha_reg, cod_estado } = valores;
    return [
      {
        id: "cod_rol",
        label: "Código",
        tipo: "number",
        val: cod_rol,
        readonly: true,
        visible: id !== "new",
      },
      {
        id: "rol_desc",
        label: "Descripción",
        tipo: "text",
        val: rol_desc,
        readonly: false,
      },
      {
        id: "cod_estado",
        label: "Estado",
        tipo: "select",
        val: cod_estado,
        options: estados.map((i) => ({ ...i, value: i.cod_estado, label: i.estado_desc })),
        readonly: location.pathname.includes("view"),
      },
      {
        id: "fecha_reg",
        label: "Fecha de Registro",
        tipo: "date",
        val: fecha_reg,
        readonly: true,
      },
    ];
  }, [estados, id, valores]);
  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */
  const onInput = useCallback(({ id, val }) => {
    console.log({ id, val });
    setValores((v) => ({ ...v, [id]: val }));
    // actualizarItem({ ...valores, [id]: val });
  }, []);
  const agregar = useCallback(async () => {
    console.log("agregar");
    const { rol_desc, cod_rol, cod_estado } = valores;
    await api.post("api/appweb/insertar-rol", { rol_desc, cod_rol, cod_estado: cod_estado.value }).then(({ data }) => navigate(`../${encryptId(data.data.cod_rol)}`));
  }, [navigate, valores]);
  const cancelar = useCallback(async () => {}, []);
  const guardar = useCallback(() => {
    const { rol_desc, cod_rol, cod_estado } = valores;
    api.post("api/appweb/actualizar-rol", { rol_desc, cod_rol, cod_estado: cod_estado.value });
  }, [valores]);
  const filtrar = useCallback(async () => {}, []);

  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    setValores(() => {
      const { cod_rol, rol_desc, cod_estado, fecha_reg } = rol;

      const estado = estados.find((i) => i.cod_estado === cod_estado);
      return {
        cod_rol: cod_rol || 0,
        rol_desc: rol_desc || "",
        cod_estado: estado ? { ...estado, label: estado.estado_desc, value: estado.cod_estado } : { value: 1, label: "ACTIVO" },
        fecha_reg: fecha_reg ? moment(fecha_reg) : moment(),
      };
    });
    setKey((i) => i + 1);
  }, [estados, rol]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <FormularioComponent
        key={key}
        inputs={inputs}
        onInput={onInput}
        botones={{
          agregar: { visible: id === "new", onClick: () => agregar() },
          cancelar: { visible: false, onClick: () => cancelar() },
          guardar: { visible: id !== "new", onClick: () => guardar() },
          filtrar: { visible: false, onClick: null },
        }}
      />
    </Box>
  );
};
FormularioCompletoRol.propTypes = {
  // ELEMENTO
  rol: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,
};
export default FormularioCompletoRol;
