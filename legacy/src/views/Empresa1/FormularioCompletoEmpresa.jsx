import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api";
import { encryptId } from "../../api/encryptDecrypt";
import moment from "moment";

const FormularioCompletoEmpresa = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    empresa, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    catalogos,
  } = props;
  const { paises } = catalogos;
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    cod_empresa: "",
    nombre_emp: "",
    pais_emp: null,
    nit_emp: "",
    direccion_emp: "",
    logo_emp: "",
    fecha_ingreso: null,
  });
  const [key, setKey] = useState(0);
  /**
   * FORMULARIO
   * Es un use Memo que contiene el contenido del formulario incluyendo:
   * - inputs
   * - valores
   * - opciones
   */
  const inputs = useMemo(() => {
    return [
      { id: "cod_empresa", label: "Código", tipo: "text", val: valores["cod_empresa"], readonly: true },
      { id: "nombre_emp", label: "Nombre", tipo: "text", val: valores["nombre_emp"], readonly: location.pathname.includes("view") },
      {
        id: "pais_emp",
        label: "País",
        tipo: "select",
        options: paises.map((i) => ({ ...i, value: i.cod_pais, label: i.nombre_pais })),
        val: valores["pais_emp"],
        readonly: location.pathname.includes("view"),
      },
      { id: "nit_emp", label: "Nit", tipo: "text", val: valores["nit_emp"], readonly: location.pathname.includes("view") },
      { id: "direccion_emp", label: "Dirección", tipo: "text", val: valores["direccion_emp"], readonly: location.pathname.includes("view") },
      { id: "logo_emp", label: "Logo", tipo: "text", val: valores["logo_emp"], readonly: location.pathname.includes("view") },
      { id: "fecha_ingreso", label: "Fecha", tipo: "date", val: valores["fecha_ingreso"], readonly: true },
    ];
  }, [valores, location.pathname, paises]);

  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */
  const onInput = useCallback(({ id, val }) => {
    setValores((v) => ({ ...v, [id]: val }));
  }, []);
  const agregar = useCallback(async () => {
    const { pais_emp, cod_empresa } = valores;
    await api
      .post("api/appweb/insertarempresas", {
        ...valores,
        cod_pais: pais_emp.value,
        cod_empresa: cod_empresa,
        pais_emp: undefined,
        fecha_ingreso: undefined,
      })
      .then(({ data }) => navigate(`/crud/menu/${encryptId(data.data.cod_menu)}`));
  }, [navigate, valores]);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(async () => {
    const { pais_emp, cod_empresa } = valores;
    await api.post("api/appweb/actualizarempresas", {
      ...valores,
      cod_pais: pais_emp.value,
      cod_empresa: cod_empresa,
      pais_emp: undefined,
      fecha_ingreso: undefined,
    });
  }, [valores]);
  const filtrar = useCallback(() => {}, []);

  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    setValores(() => {
      const { pais_emp, fecha_ingreso } = empresa;
      const pais = paises.find((i) => i.cod_pais === pais_emp);
      console.log({ fecha_ingreso });
      return {
        ...empresa,
        pais_emp: pais ? { ...pais, label: pais.nombre_pais, value: pais.cod_pais } : null,
        fecha_ingreso: fecha_ingreso ? moment(fecha_ingreso) : null,
      };
    });
    setKey((i) => i + 1);
  }, [empresa, paises]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <FormularioComponent
        key={key}
        inputs={inputs}
        onInput={onInput}
        botones={{
          agregar: { visible: id === "new", onClick: agregar },
          cancelar: { visible: false, onClick: cancelar },
          guardar: { visible: id !== "new", onClick: guardar },
          filtrar: { visible: false, onClick: filtrar },
        }}
      />
    </Box>
  );
};
FormularioCompletoEmpresa.propTypes = {
  // ELEMENTO
  empresa: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,

  // CATALOGOS
  catalogos: PropTypes.object,
};
export default FormularioCompletoEmpresa;
