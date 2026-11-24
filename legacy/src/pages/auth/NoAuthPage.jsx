import { Button, Grid, Icon, Link, TextField, Typography } from "@mui/material";
import React, { useMemo } from "react";
import { MyMenu } from "../../components/MyMenu";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "../../hooks/useForm";
import { checkingAuthentication } from "../../store/slices/auth/thunks";
import { useNavigate } from "react-router-dom";

export const NoAuthPage = () => {
  const navigate = useNavigate();
  const screenSize = useSelector((state) => state.screen);
  const { status } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { email, password, onInputChange } = useForm({
    email: "test@test.test",
    password: "test",
  });
  const isAuthenticating = useMemo(() => status === "checking", [status]);

  const name = useMemo(() => screenSize.name, [screenSize]);

  const onSubmit = (event) => {
    event.preventDefault();

    dispatch(checkingAuthentication(email, password));
  };

  return (
    <Grid container direction="column">
      <Grid size={{ xs: 12, sx: 6 }} color={"dark.main"} sx={{ p: 3 }}>
        <Typography variant={name == "xs" ? "h5" : name == "md" ? "h4" : "h4"} align="center" fontWeight={"bolder"} bgcolor={"white.main"}>
          BIENVENIDO/A A LA PLATAFORMA WEB DE <br /> <Icon className="c-cropa-dsv" color={`primary`} sx={{ width: "auto", fontSize: "2em" }} />
        </Typography>
      </Grid>
      <Grid size={{ xs: 12, sx: 6 }} sx={{ mx: "auto" }} color={"dark.main"}>
        <MyMenu menus={[{ id: 0, bg: "primary", onClick: () => navigate("/auth/login"), icon: "c-log-in", title: "IR A INICIO DE SESIÓN" }]} />
      </Grid>
    </Grid>
  );
};
