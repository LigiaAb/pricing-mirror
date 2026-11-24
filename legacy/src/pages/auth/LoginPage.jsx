import { Box, Button, Grid, TextField, Typography } from "@mui/material";
import React, { useMemo } from "react";
import { MyMenu } from "../../components/MyMenu";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "../../hooks/useForm";
import { checkingAuthentication, handleLogout } from "../../store/slices/auth/thunks";

import { useNavigate } from "react-router-dom";
import DialogComponent from "../../components/Dialog/DialogComponent";
import { useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { api_no_auth } from "../../api";
import { useCallback } from "react";
import { logout } from "../../store/slices/auth/authSlice";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";
import { redirectToUserHome } from "../../store/slices/menu/thunks";

export const LoginPage = () => {
  const { status } = useSelector((state) => state.auth);
  const { themeMode } = useSelector((state) => state.theme);
  const [mostrarDialog, setMostrarDialog] = useState(false);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [mostrarErrorContrasena, setMostrarErrorContrasena] = useState(false);
  const [correo, setCorreo] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { email, password, onInputChange } = useForm({ email: "", password: "" });
  const isAuthenticating = useMemo(() => status === "checking", [status]);

  const login = useCallback(async () => {
    await api_no_auth
      .post("/public/api/ingresar", { usuario: email, pass: btoa(unescape(encodeURIComponent(password))) })
      .then(async ({ data }) => {
        const d = data.data;
        if (d) {
          const url = await dispatch(checkingAuthentication({ email, password, ...d }));
          if (url) navigate(url);
        }
      })
      .catch((error) => {
        if (error.statusCode === 1077) setMostrarAlerta(true);
        if (error.statusCode === 1073) setMostrarErrorContrasena(true);
        // console.error(error);
        // dispatch(handleLogout({ errorMessage: error.message }));
      });
  }, [dispatch, email, navigate, password]);

  const onSubmit = (event) => {
    event.preventDefault();
    login();
  };

  const solicitarCambio = async () => {
    // public/api/solicitud-cambio-pass
    await api_no_auth.post("public/api/solicitud-cambio-pass", { usuario: correo });
    setMostrarDialog(false);
  };

  return (
    <Grid container direction="column" sx={{ flex: 1, p: 0 }} borderRadius={2} id="LoginPage">
      {/* <Grid size={12} sx={{ m: 0, p: 1 }} alignItems="center" justifyContent="center" display="flex" flexDirection="column" bgcolor="background.main_40" borderRadius={2}>
        <Typography sx={{ fontSize: 20, textAlign: "center", color: "primary.main" }} >
          Acceso al sistema
        </Typography>
        <Typography sx={{ fontSize: 12, textAlign: "center" }}>Bienvenido, ingrese sus credenciales para continuar</Typography>
      </Grid> */}
      <form onSubmit={onSubmit}>
        <Grid size={12} sx={{ mt: 2 }}>
          <TextField
            sx={{ "& *": { fontSize: 20 }, "& .MuiInputBase-root": email && { backgroundColor: "background.main_20", borderRadius: 2, px: 0.5, mt: email && 4 } }}
            size="large"
            variant="standard"
            label={
              <Grid container spacing={0.5} wrap="nowrap" justifyContent="center" alignItems="center" color={themeMode === "dark" ? "primary.light" : "primary.main"}>
                <Typography sx={{ fontSize: email ? 20 : 15 }} className="c-mail" />
                <Typography sx={{ fontSize: email ? 20 : 15 }}>Correo electrónico</Typography>
              </Grid>
            }
            type="email"
            fullWidth
            name="email"
            value={email}
            onChange={onInputChange}
          />
        </Grid>
        <Grid size={12} sx={{ mt: 2 }}>
          <TextField
            sx={{ "& *": { fontSize: 20 }, "& .MuiInputBase-root": password && { backgroundColor: "background.main", borderRadius: 2, px: 0.5, mt: password && 4 } }}
            size="large"
            variant="standard"
            label={
              <Grid container spacing={0.5} wrap="nowrap" justifyContent="center" alignItems="center" color={themeMode === "dark" ? "primary.light" : "primary.main"}>
                <Typography sx={{ fontSize: password ? 20 : 15 }} className="c-candado" />
                <Typography sx={{ fontSize: password ? 20 : 15 }}>Contraseña</Typography>
              </Grid>
            }
            type="password"
            placeholder="******"
            fullWidth
            name="password"
            value={password}
            onChange={onInputChange}
          />
        </Grid>
        {mostrarErrorContrasena && (
          <Grid container spacing={2} sx={{ my: 0.5 }}>
            <Typography color="red.main">La contraseña no es correcta</Typography>
          </Grid>
        )}
        <Grid container spacing={2} sx={{ my: 3 }}>
          <Button
            variant="contained"
            aria-label="Login"
            type="submit"
            fullWidth
            onClick={(ev) => {
              onSubmit(ev);
            }}
            sx={{
              borderRadius: 2.5,
              background: !(password !== "" && email !== "") ? "#6666" : "#0B2967",
            }}
            disabled={!(password !== "" && email !== "")}
          >
            <Typography sx={{ fontSize: 20, textTransform: "none" }} color="white">
              Iniciar Sesión
            </Typography>
          </Button>
        </Grid>
      </form>
      <Grid width="100%" container spacing={2} sx={{ my: 0 }}>
        <Button
          disabled={isAuthenticating}
          variant="text"
          fullWidth
          aria-label="Reiniciar Contraseña"
          onClick={() => setMostrarDialog(true)}
          sx={{ m: 0, px: 2, borderRadius: 2, textTransform: "none" }}
        >
          <Typography sx={{ fontSize: 12, textTransform: "none" }} color={themeMode === "dark" ? "primary.light" : "primary.main"}>
            Reiniciar Contraseña
          </Typography>
        </Button>
      </Grid>
      <DialogComponent width={{ xs: "90vw", md: "50vw" }} openDialog={mostrarDialog} handleClose={() => setMostrarDialog(false)} titulo="Petición de reinicio de contraseña">
        <Typography>Ingrese el correo del usuario al que desea reiniciar su contraseña</Typography>
        <FormularioComponent
          inputs={[{ id: "correo", tipo: "email", size: 12, label: "Correo", val: correo, error: correo === "" ? false : undefined }]}
          botones={{ agregar: { visible: false } }}
          onInput={({ id, val }) => setCorreo(val)}
        />
        <Typography sx={{ mt: 2 }}>
          Al solicitar el reinicio de contraseña para el usuario se enviará un correo electrónico que incluye un enlace para poder acceder a la página que permite el reinicio de su contraseña.
        </Typography>
        <Button variant="contained" sx={{ m: 0, p: 0.5 }} onClick={solicitarCambio}>
          Solicitar Reinicio de Contraseña
        </Button>
      </DialogComponent>
      <ActionAlertComponent
        tipo={"alert"}
        titulo="Error al Iniciar Sesión"
        openDialog={mostrarAlerta}
        width={{ xs: "90%", md: "30%" }}
        handleClose={() => setMostrarAlerta(false)}
        cancelar={() => setMostrarAlerta(false)}
        aceptar={() => {
          setMostrarDialog(true);
          setMostrarAlerta(false);
          setCorreo(email);
        }}
      >
        El usuario requiere reiniciar su contraseña para poder iniciar sesión.
      </ActionAlertComponent>
    </Grid>
  );
};
