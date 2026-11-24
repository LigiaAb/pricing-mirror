import { Grid, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { cerrarAnuncios } from "../../store/slices/anuncios/anunciosSlice";
import ActionAlertComponent from "../Dialog/ActionAlertComponent";
import { handleLogout } from "../../store/slices/auth/thunks";

/**
 * Componente global de anuncios/modales.
 *
 * Maneja tres “canales”:
 * - **Errores** (type === "error" y !errorToken): muestra códigos de referencia.
 * - **Mensajes OK / info** (type !== "error"): confirmación de acción exitosa.
 * - **Token vencido** (errorToken === true): muestra modal de "Sesión finalizada".
 *
 * Reglas de seguridad para token vencido:
 * - El modal NO debe cerrarse con Escape ni click afuera.
 * - El logout se ejecuta SOLO cuando el usuario confirma (botón "iniciar sesión").
 */
const AnuncioComponent = () => {
  const { anuncios, bgcolor = "primary" } = useSelector((state) => state.anuncios);
  const dispatch = useDispatch();

  const [abierto, setAbierto] = useState(false);
  const [abiertoP, setAbiertoP] = useState(false);
  const [abiertoT, setAbiertoT] = useState(false);

  const listaAnuncios = useMemo(() => {
    return anuncios.filter((snack) => snack.open && snack.type === "error" && !snack.errorToken);
  }, [anuncios]);
  const listaAnunciosP = useMemo(() => {
    return anuncios.filter((snack) => snack.open && snack.type !== "error");
  }, [anuncios]);
  const listaAnunciosT = useMemo(() => {
    return anuncios.filter((snack) => snack.open && snack.errorToken);
  }, [anuncios]);

  // Abrir diálogos solo cuando aparezcan anuncios correspondientes (sin auto-cerrar aquí).
  useEffect(() => {
    if (listaAnuncios.length > 0) setAbierto(true);
  }, [listaAnuncios.length]);
  useEffect(() => {
    if (listaAnunciosP.length > 0) setAbiertoP(true);
  }, [listaAnunciosP.length]);
  useEffect(() => {
    if (listaAnunciosT.length > 0) setAbiertoT(true);
  }, [listaAnunciosT.length]);

  const cerrarSnackbar = (key) => {
    dispatch(cerrarAnuncios({ key }));
  };

  /**
   * Cierra todos los anuncios de error (no token) abiertos.
   */
  const cerrarTodos = useCallback(() => {
    listaAnuncios.forEach((i) => cerrarSnackbar(i.key));
    setAbierto(false);
  }, [listaAnuncios]);

  /**
   * Cierra todos los anuncios de éxito/info abiertos.
   */
  const cerrarTodosP = useCallback(() => {
    listaAnunciosP.forEach((i) => cerrarSnackbar(i.key));
    setAbiertoP(false);
  }, [listaAnunciosP]);

  /**
   * Confirmación de "Sesión finalizada":
   * - Cierra anuncios de token vencido.
   * - Ejecuta logout y limpia storage.
   */
  const cerrarTodosT = useCallback(() => {
    listaAnunciosT.forEach((i) => cerrarSnackbar(i.key));
    setAbiertoT(false);
    dispatch(handleLogout());
  }, [dispatch, listaAnunciosT]);
  return (
    <>
      <ActionAlertComponent openDialog={abiertoP} handleClose={() => cerrarTodosP()} activarCanecelar={false} cancelar={() => cerrarTodosP()} aceptar={() => cerrarTodosP()} tipo="success">
        <Typography variant="h6" sx={{ m: 0, p: 0, textTransform: "uppercase" }}>
          Se ha realizado correctamente la accion
        </Typography>
      </ActionAlertComponent>
      <ActionAlertComponent
        openDialog={abiertoT}
        // No permitimos cerrar el diálogo para que no cambie la pantalla hasta confirmar.
        handleClose={() => {}}
        activarCanecelar={false}
        tipo="info"
        width="30vw"
        titulo="Sesión finalizada"
        onConfirm={cerrarTodosT}
        textoConfirmar="iniciar sesión"
      >
        <Typography sx={{ m: 0, p: 0, fontWeight: "normal !important", my: "auto", fontSize: 16 }}>Por razones de seguridad, tu sesión ha finalizado automáticamente.</Typography>
        <Typography sx={{ m: 0, p: 0, fontWeight: "normal !important", my: "auto", fontSize: 10, textAlign: "right" }}>Para continuar, es necesario que vuelvas a iniciar sesión.</Typography>
      </ActionAlertComponent>
      <ActionAlertComponent openDialog={abierto} titulo="ERROR" handleClose={() => cerrarTodos()} activarCanecelar={false} cancelar={() => cerrarTodos()} aceptar={() => cerrarTodos()} tipo="error">
        <Typography variant="h6" sx={{ m: 0, p: 0, textTransform: "uppercase" }}>
          ha ocurrido un error
        </Typography>
        <br />
        <Typography variant="caption" sx={{ m: 0, p: 0 }}>
          {`${listaAnuncios.length === 1 ? "Código de referencia:" : "Códigos de referencia:"}`}
          <br />
          <Grid pl={2} container width="100%" direction="column">
            {listaAnuncios.map((snack, ind) => (
              <Grid item xs={12} key={snack.key}>
                <Typography variant="caption" sx={{ m: 0, p: 0 }}>
                  {snack.message}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Typography>
      </ActionAlertComponent>
    </>
  );
};

export default AnuncioComponent;
