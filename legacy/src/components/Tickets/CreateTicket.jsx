import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { api } from "../../api";
import { useSelector } from "react-redux";
import { Box } from "@mui/material";
import { id } from "date-fns/locale";

const CreateTicket = (props) => {
  const auth = useSelector((state) => state.auth);
  const menu = useSelector((state) => state.menu);

  const [descripcion, setDescripcion] = useState("");

  const objetoParaTicket = useMemo(() => {
    const empresa = menu.currentEmpresa?.nombre_emp || "EMPRESA NO SELECCIONADA";
    const centroCosto = menu.currentCentroCosto?.nombre_cc || "CENTRO DE COSTO NO SELECCIONADO";
    const modulo = menu.currentModulo?.nom_modulo || "MODULO NO SELECCIONADO";
    const menu_ = menu.currentMenu?.nom_menu || "MENU NO SELECCIONADO";
    const categoria = menu.currentCategoria?.nom_cat || "CATEGORIA NO SELECCIONADA";
    const usuario = auth?.usuario || "[NO ENCONTRADO]";

    const asunto = `SOPORTE NUEVO ERP WEB - [${empresa} - ${centroCosto}] - ${modulo} - ${menu_} - ${categoria}`;

    const descripcion_ = `Se reporta error en nuevo erp web por usuario <b>${usuario}</b> logueado con [${empresa} - ${centroCosto}] <br/> En la ruta: <br/> <b>MODULO:</b> ${modulo || ""} <br/> <b>MENU:</b> ${menu_ || ""} <br/> <b>CATEGORIA:</b> ${categoria || ""} <br/> Nota del usuario: <br/>${descripcion || ""}`;

    return {
      id_estado: 1,
      estado_interno: 1,
      id_agente: null,
      email: auth?.usuario,
      id_departamento: null,
      id_servicio: 11,
      id_categoria: 16,
      id_padre: null,
      asunto,
      prioridad: 1,
      descripcion: descripcion_,
    };
  }, [auth, menu, descripcion]);

  // api.post("tickets", {
  // });

  return (
    <Box>
      <pre>{JSON.stringify(objetoParaTicket, null, 2)}</pre>
    </Box>
  );
};

CreateTicket.propTypes = {};

export default CreateTicket;
