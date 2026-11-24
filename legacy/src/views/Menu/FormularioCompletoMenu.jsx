import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useNavigate } from "react-router-dom/dist";
import { encryptId } from "../../api/encryptDecrypt";
import moment from "moment";
import { api } from "../../api";
const FormularioCompletoMenu = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    menu, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    catalogos, // Catalogos referentes al crud
  } = props;
  const { empresas = [], centrosCosto = [], modulos = [] } = catalogos;

  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    cod_menu: "",
    nom_menu: "",
    ico_menu: "",
    menu_ruta: "",
    cod_emp: null,
    cod_cc: null,
    cod_modulo: null,
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
    const { cod_menu, nom_menu, ico_menu, cod_emp, cod_cc, cod_modulo, menu_ruta } = valores;
    return [
      { id: "cod_menu", label: "Código", tipo: "text", val: cod_menu, readonly: true },
      { id: "nom_menu", label: "Nombre", tipo: "text", val: nom_menu },
      { id: "menu_ruta", label: "Ruta", tipo: "text", val: menu_ruta },
      { id: "ico_menu", label: "Ícono", tipo: "text", val: ico_menu },
      {
        id: "cod_emp",
        label: "Empresa",
        tipo: "select",
        val: cod_emp,
        options: empresas.map((i) => ({ ...i, label: i.nombre_emp, value: i.cod_empresa })),
      },
      {
        id: "cod_cc",
        label: "Centro de Costo",
        tipo: "select",
        val: cod_cc,
        readonly: !cod_emp,
        options: centrosCosto.filter((i) => i.cod_empresa_cc === cod_emp?.value).map((i) => ({ ...i, label: i.nombre_cc, value: i.cod_cc })),
      },
      {
        id: "cod_modulo",
        label: "Modulos",
        tipo: "select",
        val: cod_modulo,
        options: modulos.map((i) => ({ ...i, label: i.nom_modulo, value: i.cod_modulo })),
      },
      // { id: "nombre_emp", label: "nombre_emp", tipo: "text", val: nombre_emp },
      // { id: "nombre_cc", label: "nombre_cc", tipo: "text", val: nombre_cc },
    ];
  }, [centrosCosto, empresas, valores, modulos]);

  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */
  const onInput = useCallback(({ id, val }) => {
    setValores((v) => ({ ...v, [id]: val }));
  }, []);
  const agregar = useCallback(async () => {
    const { cod_cc, cod_emp, cod_modulo } = valores;
    await api
      .post("api/appweb/insertar-menu", { ...valores, cod_cc: cod_cc.value, cod_emp: cod_emp.cod_empresa, cod_modulo: cod_modulo.value })
      .then(({ data }) => navigate(`/configuracion/accesos/menu/${encryptId(data.data.cod_menu)}`));
  }, [navigate, valores]);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(() => {
    const { cod_cc, cod_emp, cod_modulo } = valores;
    console.log({ ...valores, cod_cc: cod_cc.value, cod_emp: cod_emp.cod_empresa, cod_modulo: cod_modulo.value });
    api.post("api/appweb/actualizar-menu", { ...valores, cod_cc: cod_cc.value, cod_emp: cod_emp.value, cod_modulo: cod_modulo.value });
  }, [valores]);
  const filtrar = useCallback(() => {}, []);

  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    setValores(() => {
      const { cod_menu, cod_cc, cod_emp, cod_modulo, menu_ruta } = menu;
      const empresa = empresas.find((i) => i.cod_empresa === cod_emp);
      const centroCosto = centrosCosto.find((i) => i.cod_cc === cod_cc);
      const modulo = modulos.find((i) => i.cod_modulo === cod_modulo);
      return {
        ...menu,
        cod_menu: cod_menu || 0,
        menu_ruta: menu_ruta || "",
        cod_emp: empresa ? { ...empresa, label: empresa.nombre_emp, value: empresa.cod_empresa } : null,
        cod_cc: centroCosto ? { ...centroCosto, label: centroCosto.nombre_cc, value: centroCosto.cod_cc } : null,
        cod_modulo: modulo ? { ...modulo, label: modulo.nom_modulo, value: modulo.cod_modulo } : null,
      };
    });
  }, [empresas, centrosCosto, menu, modulos]);
  useEffect(() => {
    setKey((i) => i + 1);
  }, [valores]);

  return (
    <Box sx={{ p: 1, m: 0 }}>
      <FormularioComponent
        inputs={inputs}
        onInput={onInput}
        botones={{
          agregar: { visible: id === "new", onClick: () => agregar() },
          cancelar: { visible: false, onClick: cancelar },
          guardar: { visible: id !== "new", onClick: () => guardar() },
          filtrar: { visible: false, onClick: filtrar },
        }}
      />
    </Box>
  );
};
FormularioCompletoMenu.propTypes = {
  // ELEMENTO
  menu: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),

  // EVENTOS
  reConsultar: PropTypes.func,

  //CATALOGOS
  catalogos: PropTypes.object,
};
export default FormularioCompletoMenu;
