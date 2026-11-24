import PropTypes from "prop-types";
import { Grid, List, Card, CardHeader, ListItemButton, ListItemText, ListItemIcon, Checkbox, Button, Divider, Typography, IconButton, Icon, Box, Tooltip } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import FormularioComponent from "../Formulario/FormularioComponent";
import { useSelector } from "react-redux";
import TabComponent from "../Tabs/TabComponent";

// Devuelve los elementos del arreglo a que no están en el arreglo b, comparando los valores de la clave especificada (key).
const not = (a, b, key) => a.filter((value) => b.findIndex((item) => item[key] === value[key]) === -1);
// Devuelve los elementos de a que también están en b, comparando los valores de la clave especificada (key).
const intersection = (a, b, key) => a.filter((value) => b.findIndex((item) => item[key] === value[key]) !== -1);
// Devuelve la unión de los dos arreglos a y b, eliminando duplicados basados en la clave especificada (key).
const union = (a, b, key) => [...a, ...not(b, a, key)];

const TransferListsComponent = (props) => {
  const {
    listaPrincipal = [],
    listaSecundaria = [],
    objectLabel = "label",
    objectValue = "value",
    permitirPasarTodos,
    readonly = false,
    guardarListas,
    propFiltro,
    size,
    tituloListaPrincipal,
    tituloListaSecundaria,
    cambioEnLista,
    actualizacionListas,
    mostrarBotonGuardar = true,
    preserveState = false,
  } = props;
  const screenSize = useSelector((state) => state.screen);

  const { fontSize, themeMode, opositeMode } = useSelector((state) => state.theme);

  const [checked, setChecked] = useState([]);
  const [left, setLeft] = useState([]);
  const [right, setRight] = useState([]);

  const prevLeft = useRef(left);
  const prevRight = useRef(right);

  const [botonGuardar, setBotonGuardar] = useState(mostrarBotonGuardar);

  useEffect(() => {
    setLeft(listaPrincipal || []);
    setRight(listaSecundaria || []);
  }, [listaPrincipal, listaSecundaria]);

  const leftChecked = intersection(checked, left, objectValue);
  const rightChecked = intersection(checked, right, objectValue);

  const handleToggle = (item) => () => {
    if (readonly) return; // No permitir interacción si es readonly
    const currentIndex = checked.findIndex((i) => i[objectValue] === item[objectValue]);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(item);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  const numberOfChecked = (items) => intersection(checked, items, objectValue).length;

  const handleToggleAll = (items) => () => {
    if (readonly) return; // No permitir interacción si es readonly
    if (numberOfChecked(items) === items.length) {
      setChecked(not(checked, items, objectValue));
    } else {
      setChecked(union(checked, items, objectValue));
    }
  };

  const handleCheckedRight = () => {
    setRight(right.concat(leftChecked));
    setLeft(not(left, leftChecked, objectValue));
    setChecked(not(checked, leftChecked, objectValue));
  };

  const handleCheckedLeft = () => {
    setLeft(left.concat(rightChecked));
    setRight(not(right, rightChecked, objectValue));
    setChecked(not(checked, rightChecked, objectValue));
  };

  const handleAllRight = () => {
    setRight(right.concat(left));
    setLeft([]);
  };

  const handleAllLeft = () => {
    setLeft(left.concat(right));
    setRight([]);
  };

  const reiniciarListas = () => {
    setLeft(listaPrincipal);
    setRight(listaSecundaria);
    setChecked([]);
  };

  const handleSaveList = (ev) => {
    ev.preventDefault();
    guardarListas && guardarListas(left, right);
  };

  useEffect(() => {
    setLeft(listaPrincipal || []);
    setRight(listaSecundaria || []);
  }, [listaPrincipal, listaSecundaria]);

  useEffect(() => {
    const leftChanged = JSON.stringify(prevLeft.current) !== JSON.stringify(left);
    const rightChanged = JSON.stringify(prevRight.current) !== JSON.stringify(right);

    // Solo ejecutar si los valores de left o right han cambiado
    if (leftChanged || rightChanged) {
      cambioEnLista && cambioEnLista(right);
      actualizacionListas && actualizacionListas(left, right);

      // Actualizar las referencias a los valores actuales
      prevLeft.current = left;
      prevRight.current = right;
    }
  }, [left, right, cambioEnLista, actualizacionListas]);

  useEffect(() => {
    // Solo actualiza si no estamos preservando el estado o si es la primera carga
    if (!preserveState || left.length === 0) {
      setLeft(listaPrincipal || []);
    }
  }, [listaPrincipal, preserveState]);

  useEffect(() => {
    // Solo actualiza si no estamos preservando el estado o si es la primera carga
    if (!preserveState || right.length === 0) {
      setRight(listaSecundaria || []);
    }
  }, [listaSecundaria, preserveState]);

  const CustomList = (title, items) => {
    const [valores, setValores] = useState({ filtro: "" });

    const lista = useMemo(
      () => items.filter((i) => (propFiltro ? propFiltro.filter((f) => `${i[f]}`.toUpperCase().includes(`${valores["filtro"]}`.toUpperCase())).length > 0 : true)),
      [items, valores]
    );

    return (
      <Card sx={{ boxShadow: "none", borderWidth: 2.5, borderColor: "none", borderStyle: "none" }}>
        <CardHeader
          sx={{
            px: 1,
            py: 0.5,
            my: 0,
            bgcolor: "background.100",
            borderRadius: "0px 15px 0px 15px",
            borderWidth: 2.5,
            borderColor: "background.400",
            borderStyle: "solid",
          }}
          // avatar={
          //   <Checkbox
          //     onClick={handleToggleAll(items)}
          //     checked={numberOfChecked(items) === items.length && items.length !== 0}
          //     indeterminate={numberOfChecked(items) !== items.length && numberOfChecked(items) !== 0}
          //     disabled={items.length === 0 || readonly} // Deshabilitado si está en modo readonly
          //     inputProps={{ "aria-label": "all items selected" }}
          //     sx={{ m: 0, p: 0 }}
          //   />
          // }
          title={
            <Grid sx={{ m: 0, p: 0 }} container>
              <Grid size={12} sx={{ m: 0, p: 0 }}>
                <Typography sx={{ m: 0, p: 0 }} variant="h6">
                  {title}
                </Typography>
              </Grid>
              <Grid size="auto" sx={{ m: 0, p: 0 }}>
                <Typography sx={{ m: 0, p: 0 }} variant="caption">{`${numberOfChecked(items)}/${items.length} selected`}</Typography>
              </Grid>
              {/* <Grid size="auto" sx={{ m: 0, p: 0 }}>
                <Typography sx={{ m: 0, p: 0 }} variant="caption">{`${valores["filtro"]}`}</Typography>
              </Grid> */}
            </Grid>
          }
        />
        {/* <Divider sx={{ mb: 1, borderColor: "background.400", borderBottomWidth: 2.5 }} /> */}
        <Box sx={{ ml: 1.5, borderWidth: 2.5, borderColor: "background.400", borderStyle: "solid", borderTopWidth: 0 }}>
          {!readonly && (
            <Grid size={{ xs: 12, sm: "grow" }} px={1}>
              <FormularioComponent
                botones={{ agregar: { visible: false } }}
                onInput={({ id, val }) => setValores((v) => ({ ...v, [id]: val }))}
                inputs={[{ id: "filtro", label: "Filtrar", val: valores["filtro"], tipo: "text" }]}
                sx={{ m: 0, p: 0 }}
                unaColumna
              />
            </Grid>
          )}
          <List
            sx={{
              width: "100%",
              height: 200,
              overflow: "auto",
              bgcolor: "background.paper",
              p: 0,
              px: 1,
              m: 0,
            }}
            dense
            component="div"
            role="list"
          >
            {lista?.map((item) => {
              const labelId = `transfer-list-all-item-${item[objectValue]}-label`;

              return (
                <ListItemButton sx={{ m: 0, p: 0 }} key={item[objectValue]} role="listitem" onClick={handleToggle(item)} disabled={item["readonly"] || readonly}>
                  <ListItemIcon sx={{ m: 0, p: 0, "&.MuiListItemIcon-root": { minWidth: "10px" } }}>
                    <Checkbox
                      sx={{ m: 0, p: 0, mr: 1 }}
                      checked={checked.some((i) => i[objectValue] === item[objectValue])}
                      tabIndex={-1}
                      disableRipple
                      inputProps={{ "aria-labelledby": labelId }}
                      disabled={readonly}
                    />
                  </ListItemIcon>
                  <ListItemText
                    id={labelId}
                    primary={
                      typeof item[objectLabel] === "function"
                        ? item[objectLabel](
                            item,
                            checked.some((i) => i[objectValue] === item[objectValue])
                          )
                        : item[objectLabel]
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      </Card>
    );
  };

  return (
    <Grid container size={size} spacing={2} sx={{ justifyContent: "center", alignItems: "center" }}>
      {screenSize.name !== "xs" ? (
        <Grid container justifyContent="center" alignContent="center">
          <Grid size="grow">{CustomList(tituloListaPrincipal, left)}</Grid>
          <Grid container direction="column" justifyContent="center" sx={{ alignItems: "center", "& .Mui-disabled": { opacity: 1, color: "background.main" } }}>
            {permitirPasarTodos && (
              <Grid size={12} sx={{ m: 0, p: 0 }}>
                <IconButton sx={{ m: 0, p: 0 }} variant="outlined" size="small" onClick={handleAllRight} disabled={left.length === 0 || readonly} aria-label="move all right">
                  <Typography sx={{ m: 0, p: 0, color: left.length === 0 || readonly ? "grey.main" : `primary.${opositeMode}` }} className="c-derecha-doble" />
                </IconButton>
              </Grid>
            )}
            <Grid size={12} sx={{ m: 0, p: 0 }}>
              <IconButton sx={{ m: 0, p: 0 }} variant="outlined" size="small" onClick={handleCheckedRight} disabled={leftChecked.length === 0 || readonly} aria-label="move selected right">
                <Typography sx={{ m: 0, p: 0, color: leftChecked.length === 0 || readonly ? "grey.main" : `primary.${opositeMode}` }} className="c-derecha-simple" />
              </IconButton>
            </Grid>
            <Grid size={12} sx={{ m: 0, p: 0 }}>
              <IconButton sx={{ m: 0, p: 0 }} variant="outlined" size="small" onClick={handleCheckedLeft} disabled={rightChecked.length === 0 || readonly} aria-label="move selected left">
                <Typography sx={{ m: 0, p: 0, color: rightChecked.length === 0 || readonly ? "grey.main" : `primary.${opositeMode}` }} className="c-izquierda-simple" />
              </IconButton>
            </Grid>
            {permitirPasarTodos && (
              <Grid size={12} sx={{ m: 0, p: 0 }}>
                <IconButton variant="outlined" size="small" onClick={handleAllLeft} sx={{ m: 0, p: 0 }} disabled={right.length === 0 || readonly} aria-label="move all left">
                  <Typography sx={{ m: 0, p: 0, color: right.length === 0 || readonly ? "grey.main" : `primary.${opositeMode}` }} className="c-izquierda-doble" />
                </IconButton>
              </Grid>
            )}
            <Grid size={12} sx={{ m: 0, p: 0 }}>
              {!((numberOfChecked(left) === 0 && numberOfChecked(right) === 0) || readonly) ? (
                <Tooltip title="Limpiar Selección">
                  <IconButton color="primary" sx={{ m: 0, p: 0 }} variant="outlined" size="small" onClick={() => setChecked([])} aria-label="save">
                    {<Typography className="c-cuadrado-menos" />}
                  </IconButton>
                </Tooltip>
              ) : (
                <IconButton color="primary" sx={{ m: 0, p: 0 }} variant="outlined" size="small" aria-label="save">
                  <Typography color="grey" className="c-cuadrado" />
                </IconButton>
              )}
            </Grid>
            {botonGuardar && (
              <Grid size={12} sx={{ m: 0, p: 0 }}>
                <IconButton sx={{ m: 0, p: 0 }} variant="outlined" size="small" onClick={handleSaveList} aria-label="save" disabled={readonly}>
                  <Typography sx={{ m: 0, p: 0, color: readonly ? "grey.main" : `primary.${opositeMode}` }} className="c-guardar" />
                </IconButton>
              </Grid>
            )}
            <Grid size={12} sx={{ m: 0, p: 0 }}>
              <IconButton color={readonly ? "black" : "error"} sx={{ m: 0, p: 0 }} variant="outlined" size="small" onClick={reiniciarListas} aria-label="save" disabled={readonly}>
                <Typography className="c-cancelar" />
              </IconButton>
            </Grid>
          </Grid>
          <Grid size="grow">{CustomList(tituloListaSecundaria, right)}</Grid>
        </Grid>
      ) : (
        <Grid>
          <Grid size="grow">{CustomList(tituloListaPrincipal, left)}</Grid>
          <Grid container justifyContent="center" direction="row" sx={{ alignItems: "center", "& .Mui-disabled": { opacity: 1, color: "background.main" } }}>
            <IconButton color="primary" sx={{ my: 0.5 }} variant="outlined" size="small" onClick={handleCheckedLeft} disabled={rightChecked.length === 0 || readonly} aria-label="move selected left">
              <Typography className="c-arriba-simple" />
            </IconButton>
            {permitirPasarTodos && (
              <IconButton color="primary" sx={{ my: 0.5 }} variant="outlined" size="small" onClick={handleAllLeft} disabled={right.length === 0 || readonly} aria-label="move all left">
                <Typography className="c-arriba-doble" />
              </IconButton>
            )}
            {!((numberOfChecked(left) === 0 && numberOfChecked(right) === 0) || readonly) ? (
              <Tooltip title="Limpiar Selección">
                <IconButton color="primary" sx={{ my: 0.5 }} variant="outlined" size="small" onClick={() => setChecked([])} aria-label="save">
                  {<Typography className="c-cuadrado-menos" />}
                </IconButton>
              </Tooltip>
            ) : (
              <IconButton color="primary" sx={{ my: 0.5 }} variant="outlined" size="small" aria-label="save">
                <Typography color="grey" className="c-cuadrado" />
              </IconButton>
            )}
            {botonGuardar && (
              <IconButton color="primary" sx={{ my: 0.5 }} variant="outlined" size="small" onClick={handleSaveList} aria-label="save" disabled={readonly}>
                <Typography className="c-guardar" />
              </IconButton>
            )}
            <IconButton color={readonly ? "black" : "error"} sx={{ my: 0.5 }} variant="outlined" size="small" onClick={reiniciarListas} aria-label="save" disabled={readonly}>
              <Typography className="c-cancelar" />
            </IconButton>
            {permitirPasarTodos && (
              <IconButton color="primary" sx={{ my: 0.5 }} variant="outlined" size="small" onClick={handleAllRight} disabled={left.length === 0 || readonly} aria-label="move all right">
                <Typography className="c-abajo-doble" />
              </IconButton>
            )}
            <IconButton color="primary" sx={{ my: 0.5 }} variant="outlined" size="small" onClick={handleCheckedRight} disabled={leftChecked.length === 0 || readonly} aria-label="move selected right">
              <Typography className="c-abajo-simple" />
            </IconButton>
          </Grid>
          <Grid size="grow">{CustomList(tituloListaSecundaria, right)}</Grid>
        </Grid>
      )}
      {/* <Grid size={12}></Grid>
      <Grid size={6}>
        <pre>{JSON.stringify(left, null, 2)}</pre>
      </Grid>
      <Grid size={6}>
        <pre>{JSON.stringify(right, null, 2)}</pre>
      </Grid> */}
    </Grid>
  );
};

TransferListsComponent.propTypes = {
  propFiltro: PropTypes.array,
  listaPrincipal: PropTypes.array,
  listaSecundaria: PropTypes.array,
  objectLabel: PropTypes.string,
  objectValue: PropTypes.string,
  permitirPasarTodos: PropTypes.bool,
  mostrarBotonGuardar: PropTypes.bool,
  readonly: PropTypes.bool,
  guardarListas: PropTypes.func,
  cambioEnLista: PropTypes.func,
  actualizacionListas: PropTypes.func,
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  tituloListaPrincipal: PropTypes.string,
  tituloListaSecundaria: PropTypes.string,
  preserveState: PropTypes.bool,
};

export default TransferListsComponent;
