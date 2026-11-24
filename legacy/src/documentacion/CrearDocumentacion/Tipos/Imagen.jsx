import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Divider, Grid, Icon, IconButton, Typography } from "@mui/material";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import AcordionTipo from "./AcordionTipo";
import { useSelector } from "react-redux";

const Imagen = (props) => {
  const { puesto } = useSelector((store) => store.auth);

  const { item, primero, ultimo, ejecutarAccion, mostrarBotones } = props;

  const [valorDeTexto, setValorDeTexto] = useState("");
  const [guardado, setGuardado] = useState(item.guardado);

  const elemento = useMemo(() => ({ ...item, imagen: valorDeTexto, guardado }), [item, valorDeTexto, guardado]);

  useEffect(() => {
    setValorDeTexto(item.texto);
    // setGuardado(false);
  }, [item]);

  const handleKeyPress = (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S" || e.key === "G" || e.key === "g")) {
      e.preventDefault();
      setGuardado(true);
      ejecutarAccion("actualizar", { ...item, imagen: valorDeTexto, guardado: true });
    } else return;
  };

  return (
    <AcordionTipo
      {...{
        item: elemento,
        primero,
        ultimo,
        ejecutarAccion,
        mostrarBotones,
        guardar: () => {
          setGuardado(true);
          ejecutarAccion("actualizar", elemento);
        },
      }}
    >
      <Grid container direction="column" sx={{ "&:hover": { bgcolor: "primary.200_10" } }}>
        <Divider />
        <Grid container direction="row">
          <Grid size="grow">
            <FormularioComponent
              botones={{ agregar: { visible: false } }}
              inputs={[{ id: "imagen", label: "texto", val: item.imagen, tipo: "archivo", teclaPresionada: handleKeyPress, useB64: true }]}
              onInput={({ id, val }) => {
                setValorDeTexto(val);
                ejecutarAccion("actualizar", { ...item, imagen: val, guardado: true });
                // console.log(id, val);
                setGuardado(false);
              }}
              unaColumna
            />
          </Grid>
          <Grid size="auto"></Grid>
        </Grid>
        <Divider />
      </Grid>
    </AcordionTipo>
  );
};

Imagen.propTypes = {
  item: PropTypes.object,
  primero: PropTypes.bool,
  ultimo: PropTypes.bool,

  mostrarBotones: PropTypes.bool,

  ejecutarAccion: PropTypes.func,
};

export default Imagen;
