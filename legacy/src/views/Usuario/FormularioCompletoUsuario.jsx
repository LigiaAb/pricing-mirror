import { Box, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useNavigate } from "react-router-dom/dist";
import { encryptId } from "../../api/encryptDecrypt";
import moment from "moment";
import { api } from "../../api";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import DialogComponent from "../../components/Dialog/DialogComponent";
const FormularioCompletoUsuario = (props) => {
  /**
   * PROPS
   * Obtener las propiedades y eventos del componente
   */
  const {
    usu, // Elemento del formulario basado en la base de datos
    id, // Id del elemento en el formato: Number | String | Objeto en caso de que sea un id compuesto
    catalogos, // Catalogos referentes al crud
    esComponente = false,
    cancelarSeleccion,
  } = props;
  const { estados = [] } = catalogos;
  /**
   * USE STATE
   * Lista de States
   */
  // State que contiene los valores del formulario
  const [valores, setValores] = useState({
    cod_usuario: 0,
    usuario: "",
    pass: "",
    cod_estado: {
      cod_estado: 1,
      estado_desc: "ACTIVO",
    },
    cod_cambio_pass: 8,
    ultima_conexion: null,
    json: "",
    ruta_inicial: "",
  });
  const navigate = useNavigate();
  const [key, setKey] = useState(0);
  const [mostrarCambioContrasena, setMostrarCambioContrasena] = useState(false);
  const [reiniciarContrasena, setReiniciarContrasena] = useState({
    contrasena: "",
    r_contrasena: "",
  });
  /**
   * FORMULARIO
   * Es un use Memo que contiene el contenido del formulario incluyendo:
   * - inputs
   * - valores
   * - opciones
   */
  const inputs = useMemo(() => {
    const { cod_usuario, cod_estado } = valores;
    return [
      {
        id: "usuario",
        label: "usuario",
        tipo: "email",
        val: valores["usuario"],
        requerido: true,
        errorMessage: valores["usuario"] === "" ? "El campo usuario es requerido" : "",
      },
      {
        id: "pass",
        label: "contraseña",
        tipo: "password",
        val: valores["pass"],
        requerido: true,
        errorMessage: valores["contraseña"] === "" ? "El campo contraseña es requerido" : "",
        readonly: id !== "new",
      },
      {
        id: "cod_estado",
        label: "Estado",
        tipo: "select",
        options: estados,
        val: valores["cod_estado"],
        valueOption: "cod_estado",
        labelOption: "estado_desc",
      },
      {
        id: "cod_cambio_pass",
        label: "REQUIERE CAMBIO DE CONTRASEÑA",
        tipo: "radio",
        options: [
          { value: 8, label: "NO" },
          { value: 9, label: "SI" },
        ],
        val: valores["cod_cambio_pass"],
      },
      {
        id: "ruta_inicial",
        label: "Ruta Inicial",
        tipo: "text",
        val: valores["ruta_inicial"],
        message: "La ruta por defecto se ingresa al ingresar el puesto principal del usuario. En este campo se sobreescribe la ruta.",
      },
    ];
  }, [valores, id, estados]);
  /**
   * FUNCIONES
   * Utilizando useCallback se generan las funciones para manejar los valores de los inputs
   */
  const onInput = useCallback(({ id, val }) => {
    setValores((v) => ({ ...v, [id]: val }));
  }, []);
  const agregar = useCallback(async () => {
    const { cod_estado } = valores;
    await api
      .post("api/appweb/insertarusuario", {
        ...valores,
        cod_usuario: undefined,
        ultima_conexion: undefined,
        json: undefined,
        cod_estado: cod_estado?.value || 1,
      })
      .then(({ data }) => navigate(`../${encryptId(data.data.cod_usuario)}`));
  }, [navigate, valores]);
  const cancelar = useCallback(() => {}, []);
  const guardar = useCallback(async () => {
    const { cod_estado } = valores;
    await api.post("api/appweb/actualizarusuario", {
      ...valores,
      pass: undefined,
      cod_estado: cod_estado.cod_estado,
    });
  }, [valores]);
  const cambiarContrasena = useCallback(async () => {
    await api
      .post("api/appweb/actualizarusuariopass", {
        cod_usuario: id,
        pass: btoa(unescape(encodeURIComponent(reiniciarContrasena["contrasena"]))),
      })
      .then(() => {
        setMostrarCambioContrasena(false);
        setReiniciarContrasena({ contrasena: "", r_contrasena: "" });
      });
  }, [id, reiniciarContrasena]);

  const filtrar = useCallback(() => {}, []);
  /**
   * ESTABLECER ESTADO INICIAL
   */
  useEffect(() => {
    id !== "new" &&
      setValores(() => {
        const { cod_estado } = usu;
        const estado = estados.find((i) => i.cod_estado === cod_estado);
        return {
          ...usu,
          pass: "***",
          cod_estado: estado ? { ...estado, label: estado.estado_desc, value: estado.cod_estado } : { cod_estado: 1, estado_desc: "ACTIVO" },
        };
      });
    setKey((i) => i + 1);
  }, [estados, id, usu]);
  return (
    <Box sx={{ p: 1, m: 0 }}>
      <FormularioComponent
        key={key}
        inputs={inputs}
        onInput={onInput}
        botones={{
          actualizarContrasena: {
            visible: id !== "new",
            texto: "actualizar contraseña",
            onClick: () => {
              setMostrarCambioContrasena(true);
            },
            color: "primary",
          },
          agregar: { visible: id === "new", onClick: () => agregar() },
          cancelar: { visible: esComponente, onClick: cancelarSeleccion },
          guardar: { visible: id !== "new", onClick: () => guardar() },
          filtrar: { visible: false, onClick: filtrar },
        }}
      />
      <DialogComponent
        openDialog={mostrarCambioContrasena}
        handleClose={() => {
          setMostrarCambioContrasena(false);
        }}
        width={{ xs: "90vw", md: "50vw" }}
        titulo="Reinicio de contraseña"
      >
        <FormularioComponent
          key={key}
          inputs={[
            { id: "contrasena", label: "Contraseña", val: reiniciarContrasena["contrasena"], tipo: "password", size: 12 },
            {
              id: "r_contrasena",
              label: "Repetir Contraseña",
              val: reiniciarContrasena["r_contrasena"],
              tipo: "password",
              size: 12,
              error: reiniciarContrasena["r_contrasena"] !== "" && reiniciarContrasena["contrasena"] !== reiniciarContrasena["r_contrasena"],
              errorMessage: "Contraseñas no coinciden",
            },
          ]}
          onInput={({ id, val }) => setReiniciarContrasena((v) => ({ ...v, [id]: val }))}
          botones={{
            agregar: {
              visible: !(reiniciarContrasena["contrasena"] === "" && reiniciarContrasena["r_contrasena"] === "") && reiniciarContrasena["contrasena"] === reiniciarContrasena["r_contrasena"],
              onClick: () => cambiarContrasena(),
            },
            cancelar: { visible: false, onClick: cancelar },
            guardar: { visible: false, onClick: () => guardar() },
            filtrar: { visible: false, onClick: filtrar },
          }}
        />
      </DialogComponent>
    </Box>
  );
};
FormularioCompletoUsuario.propTypes = {
  // ELEMENTO
  usu: PropTypes.object,
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.object, PropTypes.string]),
  // EVENTOS
  reConsultar: PropTypes.func,
  //CATALOGOS
  catalogos: PropTypes.object,
  //TIPO DE LLAMADA
  esComponente: PropTypes.bool,
  cancelarSeleccion: PropTypes.bool,
};
export default FormularioCompletoUsuario;
