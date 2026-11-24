import { Box, Button, Grid, TextField } from "@mui/material";
import React, { useCallback, useState } from "react";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { useLocation, useNavigate } from "react-router-dom";
import { api_no_auth } from "../../api";
import { useForm } from "../../hooks/useForm";
const ResetPassPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");
  const { contrasena, r_contrasena, onInputChange } = useForm({
    contrasena: "",
    r_contrasena: "",
  });
  const cambiarContrasena = useCallback(async () => {
    await api_no_auth
      .post("/public/api/procesar-cambio-pass", {
        token_pass_res: token,
        pass_nuevo: btoa(unescape(encodeURIComponent(contrasena))),
      })
      .then(({ data }) => {
        const { cod_mensaje, mensaje } = data.data;
        let errorArmado = `[${cod_mensaje}]: ${mensaje}`;
        const myEvent = new CustomEvent("customError", {
          detail: { message: errorArmado, type: "error", errorToken: false },
        });
        data.data.cod_mensaje === 1003 ? window.dispatchEvent(myEvent) : null;
        navigate("/");
      });
  }, [navigate, contrasena, token]);

  return (
    <>
      <Grid size={12}>
        <TextField
          sx={{ "& *": { fontSize: 20 }, "& .MuiFilledInput-root": { backgroundColor: "#fff", borderRadius: 2 } }}
          label="Nueva Contraseña"
          variant="filled"
          size="large"
          type="password"
          placeholder="****"
          fullWidth
          name="contrasena"
          value={contrasena}
          onChange={onInputChange}
        />
      </Grid>
      <Grid size={12} sx={{ mt: 2 }}>
        <TextField
          sx={{ "& *": { fontSize: 20 }, "& .MuiFilledInput-root": { backgroundColor: "#fff", borderRadius: 2 } }}
          size="large"
          variant="filled"
          label="Repetir Contraseña"
          type="password"
          placeholder="****"
          fullWidth
          name="r_contrasena"
          value={r_contrasena}
          onChange={onInputChange}
        />
      </Grid>
      <Grid size={12} sx={{ mt: 2, textAlign: "right" }}>
        {!(contrasena === "" && r_contrasena === "") && contrasena === r_contrasena ? (
          <Button
            onClick={() => {
              cambiarContrasena();
            }}
            variant="contained"
          >
            reiniciar
          </Button>
        ) : (
          ""
        )}
      </Grid>
      {/* <Grid size={12}>
          <FormularioComponent
            inputs={[
              { id: "contrasena", label: "Contraseña Nueva", val: contrasena, tipo: "password", size: 12 },
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
                visible:
                  !(reiniciarContrasena["contrasena"] === "" && reiniciarContrasena["r_contrasena"] === "") &&
                  reiniciarContrasena["contrasena"] === reiniciarContrasena["r_contrasena"],
                onClick: () => cambiarContrasena(),
                texto: "reiniciar",
              },
              cancelar: { visible: false },
              guardar: { visible: false },
              filtrar: { visible: false },
            }}
          />
        </Grid> */}
    </>
  );
};

export default ResetPassPage;
