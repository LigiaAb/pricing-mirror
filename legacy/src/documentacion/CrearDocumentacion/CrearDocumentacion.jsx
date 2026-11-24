import { Box, Button, Divider, Grid, Icon, IconButton } from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import OVERFLOW_STYLES from "../../style/scrollStyle";
import renderItem from "../renderDocumentacion";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { tipos, basesSegunTipo } from "./tipos";
import Simple from "./Tipos/Simple";
import Tabla from "./Tipos/Tabla";
import Detalle from "./Tipos/Detalle";
import TabComponent from "../../components/Tabs/TabComponent";
import documentacionFormulario from "../componentes/documentacionFormulario";
import PropTypes from "prop-types";
import Imagen from "./Tipos/Imagen";
import Codigo from "./Tipos/Codigo";
import { useSelector } from "react-redux";
import DialogComponent from "../../components/Dialog/DialogComponent";
import Lista from "./Tipos/Lista";
function replaceId(o, oldId, newId) {
  // Verifica si es un objeto
  if (Array.isArray(o)) {
    return o.map((i) => replaceId(i, oldId, newId));
  } else if (typeof o === "object" && o !== null) {
    let obj = { ...o };
    Object.keys(obj).map((key) => {
      // Si el valor es un objeto o array, aplica la función recursivamente
      if (typeof obj[key] === "object") {
        replaceId(obj[key], oldId, newId);
      }
      if (obj["datos"]) obj["datos"] = replaceId(obj["datos"], oldId, newId);
      if (obj["encabezado"]) obj["encabezado"] = replaceId(obj["encabezado"], oldId, newId);
      // Si encuentra un id que empieza con oldId, lo reemplaza
      if (key === "id" && obj[key].startsWith(oldId)) {
        obj[key] = obj[key].replace(oldId, newId);
      }
    });
    return obj;
  }
}

const CrearDocumentacion = (props) => {
  const { jsonDocumentacion, guardarJSON } = props;
  const [items, setItems] = useState(typeof jsonDocumentacion === "string" ? JSON.parse(jsonDocumentacion) : jsonDocumentacion);
  const [tipo, setTipo] = useState(tipos[0].value);
  const [contador, setContador] = useState(jsonDocumentacion?.length);
  const [renderKey, setRenderKey] = useState(0);
  const [itemCopiado, setItemCopiado] = useState(null);
  const { puesto, cod_usuario } = useSelector((store) => store.auth);
  const [itemJSON, setItemJSON] = useState("");
  const [mostrarDocumentacion, setMostrarDocumentacion] = useState(false);

  useEffect(() => {
    setItems(jsonDocumentacion);
  }, [jsonDocumentacion]);

  useEffect(() => {
    setItemJSON(JSON.stringify(items, null, 2));
  }, [items]);

  const [valores, setValores] = useState({ nombre: "", tipo: 1 });

  const inputs = useMemo(
    () => [
      {
        tipo: "radio",
        label: "Tipo de Documentación",
        options: [
          { value: "base de datos", label: "Base de Datos" },
          { value: "apis", label: "Apis" },
          { value: "diseño", label: "Diseño" },
          { value: "componentes", label: "Componentes" },
        ],
        val: valores["tipo"],
        id: "tipo",
      },
      { tipo: "text", label: "Nombre de la Documentación", val: valores["nombre"], id: "nombre" },
    ],
    [valores]
  );

  const manejarLista = (accion, item) => {
    setItems((array) => {
      let newArray = [...array];
      let index = item ? newArray.findIndex((i) => i.id === item.id) : 0;

      switch (accion) {
        case "cancelar":
          newArray = newArray.filter((i) => i.id !== item?.id).map((i, ind) => replaceId({ ...i }, i.id, `${i.tipo[0].toUpperCase()}${i.tipo[1].toUpperCase()}${ind}`));
          // let a = [...newArray, { ...replaceId({ ...item }, item.id, `${item.tipo[0].toUpperCase()}${contador}`) }];
          setRenderKey((v) => v + 1);
          break;

        case "subir":
          if (index > 0) {
            const temp = newArray[index];
            newArray[index] = newArray[index - 1];
            newArray[index - 1] = temp;
          }
          setRenderKey((v) => v + 1);
          break;

        case "bajar":
          if (index < newArray.length - 1) {
            const temp = newArray[index];
            newArray[index] = newArray[index + 1];
            newArray[index + 1] = temp;
          }
          setRenderKey((v) => v + 1);
          break;

        case "actualizar":
          newArray[index] = item;
          break;

        case "agregar": {
          setTipo(tipo);
          let a = [...newArray, { ...basesSegunTipo[item], id: `${item[0].toUpperCase()}${contador}` }];
          console.log(item, a, newArray);
          newArray = a.map((i, ind) => {
            console.log(tipo);
            console.log(i);
            return replaceId({ ...i }, i.id, `${i.tipo[0].toUpperCase()}${i.tipo[1].toUpperCase()}${ind}`);
          });
          break;
        }

        case "agregar item": {
          let a = [...newArray, { ...replaceId({ ...item }, item.id, `${item.tipo[0].toUpperCase()}${contador}`) }];
          newArray = a.filter((i) => i.id !== item?.id).map((i, ind) => replaceId({ ...i }, i.id, `${i.tipo[0].toUpperCase()}${i.tipo[1].toUpperCase()}${ind}`));
          setItemCopiado(null);
          return a;
        }

        case "copiar":
          setItemCopiado({ ...item });
          break;

        default:
          break;
      }

      return newArray;
    });
    setContador((i) => i + 1);
  };

  return (
    <Box sx={{ m: 0, p: 0, py: 0 }}>
      <Grid container>
        <Grid size={12} sx={{ p: 2, borderRadius: 1, bgcolor: "primary.300_20" }}>
          <Grid container direction="row">
            {tipos.map(({ value, label }) => (
              <Grid size="auto" sx={{ borderRadius: 1 }} key={value}>
                <Button
                  variant="contained"
                  sx={{ m: 0, p: 0, ml: 1, px: 1, color: "white.main" }}
                  size="small"
                  onClick={() => manejarLista("agregar", value)}
                  startIcon={<Icon sx={{ m: 0, p: 0, fontSize: "10px !important" }} className="c-suma" color="inherit" />}
                >
                  {label}
                </Button>
              </Grid>
            ))}
            {itemCopiado && (
              <Grid size="auto" sx={{ borderRadius: 1 }}>
                <Button
                  variant="contained"
                  sx={{ m: 0, p: 0, ml: 1, px: 1, color: "white.main" }}
                  size="small"
                  onClick={() => manejarLista("agregar item", itemCopiado)}
                  startIcon={<Icon sx={{ m: 0, p: 0, fontSize: "10px !important" }} className="c-suma" color="inherit" />}
                >
                  Pegar
                </Button>
              </Grid>
            )}
            <Grid size="grow"></Grid>
            <Grid size="auto" sx={{ borderRadius: 1, bgcolor: "white.300_20" }}>
              <Button variant="outlined" sx={{ m: 0, p: 0, ml: 1, px: 1 }} size="small" onClick={() => guardarJSON(items)}>
                GUARDAR
              </Button>
            </Grid>
            <Grid size="auto" sx={{ borderRadius: 1, bgcolor: "white.300_20" }}>
              <Button variant="outlined" sx={{ m: 0, p: 0, ml: 1, px: 1 }} size="small" onClick={() => setMostrarDocumentacion(true)}>
                PREVIEW
              </Button>
            </Grid>
          </Grid>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ m: 0, mt: 1, p: 0, maxWidth: "100%", ...OVERFLOW_STYLES }}>
          <Grid container sx={{ m: 0, p: 0, maxWidth: "100%", maxHeight: "65vh", height: "65vh", overflowY: "auto", ...OVERFLOW_STYLES }} direction="column">
            <Grid size={"grow"} sx={{ m: 0, p: 0, maxWidth: "100% !important" }}>
              {[...(items || [])].map((item, index) =>
                ["texto", "titulo", "hr", "subtitulo", "html"].includes(item.tipo) ? (
                  <Simple mostrarBotones item={item} key={item.id} ejecutarAccion={manejarLista} primero={index === 0} ultimo={index === items.length - 1} />
                ) : item.tipo === "lista" ? (
                  <Lista mostrarBotones item={item} key={item.id} ejecutarAccion={manejarLista} primero={index === 0} ultimo={index === items.length - 1} />
                ) : item.tipo === "codigo" ? (
                  <Codigo mostrarBotones item={item} key={item.id} ejecutarAccion={manejarLista} primero={index === 0} ultimo={index === items.length - 1} />
                ) : item.tipo === "tabla" ? (
                  <Tabla mostrarBotones item={item} key={item.id} ejecutarAccion={manejarLista} primero={index === 0} ultimo={index === items.length - 1} />
                ) : item.tipo === "detalle" ? (
                  <Detalle mostrarBotones item={item} key={item.id} ejecutarAccion={manejarLista} primero={index === 0} ultimo={index === items.length - 1} />
                ) : item.tipo === "imagen" ? (
                  <Imagen mostrarBotones item={item} key={item.id} ejecutarAccion={manejarLista} primero={index === 0} ultimo={index === items.length - 1} />
                ) : (
                  <></>
                )
              )}
            </Grid>
          </Grid>
          {cod_usuario && (
            <Grid>
              <FormularioComponent
                inputs={[{ id: "json", val: itemJSON, tipo: "textarea", size: 12, height: 400 }]}
                onInput={({ id, val }) => {
                  setItemJSON(val);
                }}
                key={itemJSON}
                botones={{
                  agregar: {
                    onClick: () => {
                      setItems(JSON.parse(itemJSON));
                    },
                  },
                }}
              />
            </Grid>
          )}
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ m: 0, p: 1, maxHeight: "70vh", overflowY: "auto", ...OVERFLOW_STYLES }}>
          {renderItem(items)}
          {/* <pre>{JSON.stringify(items, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(itemJSON, null, 2)}</pre> */}
        </Grid>
        <DialogComponent width="90vw" handleClose={() => setMostrarDocumentacion(false)} openDialog={mostrarDocumentacion}>
          {renderItem(items)}
        </DialogComponent>
        {/* <Grid size={12} md={6} sx={{ m: 0, p: 1, maxHeight: "75vh", overflowY: "auto", ...OVERFLOW_STYLES }}>
          {JSON.stringify(itemCopiado)}
        </Grid> */}
      </Grid>
    </Box>
  );
};

CrearDocumentacion.propTypes = {
  jsonDocumentacion: PropTypes.any,
  guardarJSON: PropTypes.func,
};

export default CrearDocumentacion;
