import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Divider, Grid, Icon, IconButton, Typography } from "@mui/material";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import AcordionTipo from "./AcordionTipo";
import { useSelector } from "react-redux";

const Simple = (props) => {
  const { puesto } = useSelector((store) => store.auth);

  const { item, primero, ultimo, ejecutarAccion, mostrarBotones } = props;

  const [propiedades, setPropiedades] = useState({ variant: item.variant, component: item.component, color: item.color });
  const [valorDeTexto, setValorDeTexto] = useState(item.texto);
  const [guardado, setGuardado] = useState(item.guardado);

  const elemento = useMemo(() => ({ ...item, texto: valorDeTexto, ...propiedades, guardado }), [item, propiedades, valorDeTexto, guardado]);

  useEffect(() => {
    setPropiedades({ variant: item.variant, component: item.component, color: item.color });
    setValorDeTexto(item.texto);
    // setGuardado(false);
  }, [item]);

  const handleKeyPress = (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S" || e.key === "G" || e.key === "g")) {
      e.preventDefault();
      setGuardado(true);
      ejecutarAccion("actualizar", { ...item, texto: valorDeTexto, ...propiedades, guardado: true });
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
            <Typography>
              Usar <kbd>CTRL + S</kbd> para aplicar los cambios
            </Typography>
            {
              <FormularioComponent
                inputs={[
                  { tipo: "text", id: "variant", label: "variante", val: propiedades.variant, teclaPresionada: handleKeyPress },
                  { tipo: "text", id: "component", label: "component", val: propiedades.component, teclaPresionada: handleKeyPress },
                  { tipo: "text", id: "color", label: "color", val: propiedades.color, teclaPresionada: handleKeyPress },
                ]}
                onInput={({ id, val }) => {
                  setPropiedades((p) => ({ ...p, [id]: val }));
                  setGuardado(false);
                }}
                botones={{ agregar: { visible: false } }}
              />
            }
            <FormularioComponent
              botones={{ agregar: { visible: false } }}
              inputs={[{ id: "texto", label: "texto", val: valorDeTexto, tipo: "texteditor", teclaPresionada: handleKeyPress }]}
              onInput={({ id, val }) => {
                setValorDeTexto(val);
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

Simple.propTypes = {
  item: PropTypes.object,
  primero: PropTypes.bool,
  ultimo: PropTypes.bool,

  mostrarBotones: PropTypes.bool,

  ejecutarAccion: PropTypes.func,
};

export default Simple;
