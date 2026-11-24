import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Button, Divider, Grid, Icon, IconButton, Typography } from "@mui/material";
import TablaComponent from "../../components/Tabla/TablaComponent";
import TransferListsComponent from "../../components/Lists/TransferListsComponent";
import { useFetchEmpUsuPuesto, useFetchPuestos } from "../../hooks/Fetch/useFetchConfiguracion";
import { useFetchCentrosCosto, useFetchEmpresas, useFetchUsuarios } from "../../hooks/Fetch/useFetchCatalog";
import { milliseconds } from "date-fns";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { api } from "../../api";
import ActionAlertComponent from "../../components/Dialog/ActionAlertComponent";

const EmpleadoUsuarioPuesto = (props) => {
  const { id } = props;
  const empresas = useFetchEmpresas({ cod_estado: 1 });
  const centrosCosto = useFetchCentrosCosto({ cod_estado: 1 });
  const listaEmpUsuPue = useFetchEmpUsuPuesto({ cod_estado: 1 });
  const listaPuestos = useFetchPuestos({ cod_estado: 1 });
  const listaUsu = useFetchUsuarios({ cod_estado: 1 });
  const [uAsignados, setUAsignados] = useState([]);
  const [uNoAsignados, setUNoAsignados] = useState([]);
  const [listaUsuariosAsignables, setlistaUsuariosAsignables] = useState([]);
  const [listaPuestosAsignables, setlistaPuestosAsignables] = useState([]);
  const [listaPuestosAsignablesFiltrados, setlistaPuestosAsignablesFiltrados] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [pAsignadosSinFiltro, setPAsignadosSinFiltro] = useState([]);
  const [pAsignados, setPAsignados] = useState([]);
  const [pNoAsignados, setPNoAsignados] = useState([]);
  const [clearSelectionUsuario, setClearSelectionUsuario] = useState(1);
  const [filtro, setFiltro] = useState({ empresa: null, centroCosto: null });
  const centrosCostoFiltrados = useMemo(() => centrosCosto.data?.filter((i) => i.cod_empresa_cc === filtro.empresa?.value) || [], [centrosCosto, filtro]);
  const [pAsignadosSeleccionados, setPAsignadosSeleccionados] = useState([]);
  const [pNoAsignadosSeleccionados, setPNoAsignadosSeleccionados] = useState([]);

  const [mostrarAlerta, setMostrarAlerta] = useState(false);

  const usuariosAsignables = useMemo(
    () => (listaUsu.data || []).filter((u) => u.cod_estado === 1).filter((u) => !(listaEmpUsuPue.data || []).some((eup) => eup.cod_usuario === u.cod_usuario)),
    [listaEmpUsuPue.data, listaUsu.data]
  );
  const usuariosAsignados = useMemo(
    () => (listaUsu.data || []).filter((u) => (listaEmpUsuPue.data || []).some((eup) => eup.cod_usuario === u.cod_usuario && eup.cod_empleado === id)).map((i) => ({ ...i, json: "" })),
    [id, listaEmpUsuPue.data, listaUsu.data]
  );
  const puestosAsignables = useMemo(
    () =>
      (listaPuestos.data || [])
        .filter((u) => u.cod_estado === 1)
        .filter((u) => !(listaEmpUsuPue.data || []).some((eup) => usuarioSeleccionado && usuarioSeleccionado.value === eup.cod_usuario && eup.cod_puesto === u.cod_puesto)),
    [listaEmpUsuPue.data, listaPuestos.data, usuarioSeleccionado]
  );
  const puestosAsignados = useMemo(
    () =>
      (listaPuestos.data || []).filter((u) =>
        (listaEmpUsuPue.data || []).some((eup) => usuarioSeleccionado && usuarioSeleccionado.value === eup.cod_usuario && eup.cod_puesto === u.cod_puesto && eup.cod_empleado === id)
      ),
    [id, listaEmpUsuPue.data, listaPuestos.data, usuarioSeleccionado]
  );
  const puestosAsignablesFiltrados = useMemo(
    () => (puestosAsignables || []).filter((l) => (filtro.empresa ? l.cod_emp === filtro.empresa.value : true)).filter((l) => (filtro.centroCosto ? l.cod_cc === filtro.centroCosto.value : true)),
    [puestosAsignables, filtro]
  );
  const puestosAsignadosFiltrados = useMemo(
    () => (puestosAsignados || []).filter((l) => (filtro.empresa ? l.cod_emp === filtro.empresa.value : true)).filter((l) => (filtro.centroCosto ? l.cod_cc === filtro.centroCosto.value : true)),
    [puestosAsignados, filtro]
  );
  // Función para marcar un puesto como default
  const marcarComoDefault = (row) => {
    const puestoSeleccionado = row.content;
    console.log("Marcando como default: ", puestoSeleccionado);
    // 1. Crear una función de actualización que:
    //    - Marque el puesto seleccionado como 'S'
    //    - Marque todos los demás como 'N'
    const actualizarLista = (lista) => {
      return lista.map((puesto) => ({
        ...puesto,
        usuemppue_default: puesto.cod_puesto === puestoSeleccionado?.cod_puesto ? "S" : "N",
      }));
    };

    // 2. Actualizar todos los estados relevantes
    setPAsignados((prev) => actualizarLista(prev));
    setPAsignadosSeleccionados((prev) => actualizarLista(prev));
    setPAsignadosSinFiltro((prev) => actualizarLista(prev));

    // 3. Actualizar la lista de puestos global
    const nuevosPuestos = listaPuestos.data?.map((puesto) => {
      if (puesto.cod_puesto === puestoSeleccionado?.cod_puesto) {
        return { ...puesto, usuemppue_default: "S" };
      } else if (puesto?.usuemppue_default === "S") {
        return { ...puesto, usuemppue_default: "N" };
      }
      return puesto;
    });

    // Si estás usando un hook que permite actualizar los datos, deberías hacerlo aquí
    // Ejemplo: listaPuestos.updateData(nuevosPuestos);
  };

  const obtenerPuestoDefault = (cod_puesto) => {
    const puesto = listaEmpUsuPue.data?.find((p) => p.cod_puesto === cod_puesto && usuarioSeleccionado?.cod_usuario === p.cod_usuario);
    return puesto ? puesto.usuemppue_default : "N";
  };

  const actualizarUsuariosAsignados = (right) => {
    const jsonRight = JSON.stringify(right || {});
    const jsonAsign = JSON.stringify(uAsignados);

    if (right.length === 0 || !right.some((i) => i.cod_usuario === usuarioSeleccionado?.cod_usuario)) setClearSelectionUsuario((v) => v + 1);

    if (jsonRight !== jsonAsign) {
      setUAsignados(listaUsuariosAsignables.filter((i) => right.some((item) => i.cod_usuario === item.cod_usuario)));
      setUNoAsignados(listaUsuariosAsignables.filter((i) => !right.some((item) => i.cod_usuario === item.cod_usuario)));
    }
  };

  const actualizarPuestosAsignados = (right) => {
    // Guardar la selección actual del usuario
    if (JSON.stringify(right) !== JSON.stringify(pAsignados)) {
      const rightConDefault = right.map((item) => {
        return {
          ...item,
          usuemppue_default: obtenerPuestoDefault(item.cod_puesto),
        };
      });
      setPAsignadosSeleccionados(rightConDefault);
      setPNoAsignadosSeleccionados(listaPuestosAsignablesFiltrados.filter((i) => !right.some((r) => r.cod_puesto === i.cod_puesto)));

      // También actualizar los estados principales
      setPAsignados(right);
      setPNoAsignados(listaPuestosAsignablesFiltrados.filter((i) => !right.some((r) => r.cod_puesto === i.cod_puesto)));
    }
  };

  const seleccionarFilaUsuario = (row) => {
    setUsuarioSeleccionado(row);
  };

  const encabezadosDeUsuarios = [
    { name: "COD_USUARIO", label: "Código", campo: "cod_usuario" },
    { name: "USUARIO", label: "Usuario", campo: "usuario" },
  ];
  const encabezadosDePuestos = [
    { name: "COD_PUESTO", label: "Código", campo: "cod_puesto" },
    { name: "NOMMBRE", label: "Puesto", campo: "puesto_desc" },
    { name: "DEFAULT", label: "Default", campo: "usuemppue_default", format: (val, row) => (row.usuemppue_default === "S" ? "Sí" : "No") },
  ];

  const filtroPuestos = useMemo(
    () => [
      { id: "empresa", label: "Empresa", tipo: "select", options: empresas.data, val: filtro.empresa },
      { id: "centroCosto", label: "Centro de Costo", tipo: "select", options: centrosCostoFiltrados, val: filtro.centroCosto },
    ],
    [empresas, centrosCostoFiltrados, filtro]
  );

  const onInput = ({ id, val }) => {
    if (id === "empresa") setFiltro((v) => ({ ...v, [id]: val, centroCosto: null }));
    else if (id === "centroCosto") setFiltro((v) => ({ ...v, [id]: val }));
    else setFiltro((v) => ({ ...v, [id]: val }));
  };

  const isLoading = useMemo(
    () => empresas.isLoading || centrosCosto.isLoading || listaEmpUsuPue.isLoading || listaPuestos.isLoading || listaUsu.isLoading,
    [empresas, centrosCosto, listaEmpUsuPue, listaPuestos, listaUsu]
  );

  useEffect(() => {
    setUAsignados(usuariosAsignados);
    setUNoAsignados(usuariosAsignables);
    setlistaUsuariosAsignables([...usuariosAsignados, ...usuariosAsignables]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listaEmpUsuPue.data, listaUsu.data, id]);

  // useEffect(() => {
  //   setPAsignados(puestosAsignados);
  //   setPNoAsignados(puestosAsignables);
  //   setlistaPuestosAsignables([...puestosAsignados, ...puestosAsignables]);
  //   setlistaPuestosAsignablesFiltrados([...puestosAsignadosFiltrados, ...puestosAsignablesFiltrados]);
  // }, [puestosAsignados, puestosAsignables, puestosAsignadosFiltrados, puestosAsignablesFiltrados]);

  useEffect(() => {
    if (!usuarioSeleccionado) return;

    // Sincronizar estados cuando cambian los datos de la API o el usuario seleccionado
    setPAsignadosSinFiltro(puestosAsignados);

    // Actualizar listas visibles al cambiar filtros
    const nuevosAsignados = puestosAsignadosFiltrados.map((item) => ({
      ...item,
      usuemppue_default: obtenerPuestoDefault(item.cod_puesto) || "N",
    }));

    const nuevosNoAsignados = puestosAsignablesFiltrados.filter(
      (item) => !puestosAsignados.some((a) => a.cod_puesto === item.cod_puesto)
    );

    setPAsignados(nuevosAsignados);
    setPNoAsignados(nuevosNoAsignados);
    setPAsignadosSeleccionados([]);
    setPNoAsignadosSeleccionados([]);

    // Mantener lista completa de puestos asignables (para filtros)
    setlistaPuestosAsignablesFiltrados([...nuevosAsignados, ...nuevosNoAsignados]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioSeleccionado?.value, filtro.empresa?.value, filtro.centroCosto?.value, listaPuestos.data, listaEmpUsuPue.data]);

  const guardarPuestos = useCallback(async () => {
    listaEmpUsuPue;
    const puestosAsignadosEnBaseDeDatos = listaEmpUsuPue.data.filter((p) => p.cod_empleado === id);

    if (!pAsignados.some((i) => i.usuemppue_default === "S")) {
      setMostrarAlerta(true);
      return;
    }

    const usuariosXPuestoActualizar = [];
    pAsignados.forEach(
      (i) =>
        puestosAsignadosEnBaseDeDatos.some((a) => a.cod_puesto === i.cod_puesto && usuarioSeleccionado.cod_usuario === a.cod_usuario) &&
        usuariosXPuestoActualizar.push({
          cod_empleado: Number(id),
          cod_puesto: Number(i.cod_puesto),
          usuemppue_default: i.usuemppue_default || "N",
          cod_estado: 1,
          cod_usuario: usuarioSeleccionado.cod_usuario,
        })
    );

    const usuariosXPuestoAInsertar = [];
    pAsignados.forEach(
      (i) =>
        !puestosAsignadosEnBaseDeDatos.some((a) => a.cod_puesto === i.cod_puesto && usuarioSeleccionado.cod_usuario === a.cod_usuario) &&
        usuariosXPuestoAInsertar.push({
          cod_empleado: Number(id),
          cod_puesto: Number(i.cod_puesto),
          usuemppue_default: i.usuemppue_default || "N",
          cod_estado: 1,
          cod_usuario: usuarioSeleccionado.cod_usuario,
        })
    );

    const usuariosXPuestoAEliminar = [];
    puestosAsignadosEnBaseDeDatos.forEach((p) =>
      !pAsignados.some((a) => a.cod_puesto === p.cod_puesto && usuarioSeleccionado.cod_usuario === p.cod_usuario)
        ? usuariosXPuestoAEliminar.push({
            cod_empleado: Number(id),
            cod_puesto: Number(p.cod_puesto),
            usuemppue_default: p.usuemppue_default || "N",
            cod_estado: 1,
            cod_usuario: p.cod_usuario,
          })
        : null
    );

    usuariosXPuestoAEliminar.length > 0 && (await Promise.all(usuariosXPuestoAEliminar.map((i) => api.post("api/appweb/eliminaremp-usu-puesto", i))));
    usuariosXPuestoAInsertar.length > 0 && (await Promise.all(usuariosXPuestoAInsertar.map((i) => api.post("api/appweb/insertaremp-usu-puesto", i))));
    usuariosXPuestoActualizar.length > 0 && (await Promise.all(usuariosXPuestoActualizar.map((i) => api.post("api/appweb/actualizaremp-usu-puesto", i))));

    await listaEmpUsuPue.refetchData();
  }, [listaEmpUsuPue, pAsignados, id, usuarioSeleccionado]);

  return (
    <Box sx={{ m: 0, p: 0 }}>
      <Grid container width="100%">
        <Grid></Grid>
        {!isLoading && (
          <>
            <Grid size={12}>
              <Box p={1}>
                <Divider
                  sx={{
                    "&:before": { borderTopColor: "primary.main", borderTopWidth: 2 },
                    "&:after": { borderTopColor: "primary.main", borderTopWidth: 2 },
                  }}
                  textAlign="left"
                >
                  <Typography p={0} m={0} color={"primary.main"} variant={"h5"}>
                    Usuarios
                  </Typography>
                </Divider>
              </Box>
            </Grid>
            <Grid size={12} container spacing={5}>
              <Grid size="grow">
                <TransferListsComponent
                  tituloListaPrincipal="Disponibles en el sistema"
                  tituloListaSecundaria="Asignados al empleado"
                  listaPrincipal={usuariosAsignables}
                  listaSecundaria={usuariosAsignados}
                  cambioEnLista={actualizarUsuariosAsignados}
                  objectLabel="label"
                  permitirPasarTodos
                  mostrarBotonGuardar={false}
                />
              </Grid>
              <Grid size="grow">
                <TablaComponent
                  titulo="Seleccione un usuario para asignarle puestos"
                  id="value"
                  onClearSelection={clearSelectionUsuario}
                  onFilaSeleccionada={seleccionarFilaUsuario}
                  select
                  encabezado={encabezadosDeUsuarios}
                  datos={uAsignados}
                />
              </Grid>
            </Grid>
          </>
        )}
        {!isLoading && (
          <>
            <Grid size={12}>
              <Box p={1}>
                <Divider
                  sx={{
                    "&:before": { borderTopColor: !usuarioSeleccionado || uAsignados.length == 0 ? "error.main" : "accent.700" },
                    "&:after": { borderTopColor: !usuarioSeleccionado || uAsignados.length == 0 ? "error.main" : "accent.700" },
                  }}
                  textAlign="left"
                >
                  <Typography p={0} m={0} color={uAsignados.length == 0 || !usuarioSeleccionado ? "error.main" : "accent.700"} variant={"h6"}>
                    {uAsignados.length == 0 ? "No hay usuarios asignados para el empleado" : !usuarioSeleccionado ? "No se ha seleccionado ningun usuario" : "Puestos por Usuario"}
                  </Typography>
                </Divider>
              </Box>
            </Grid>
            {usuarioSeleccionado && (
              <Grid size={12} container direction="column">
                <Grid size={12}>
                  <FormularioComponent botones={{ enviar: { visible: false } }} inputs={filtroPuestos} onInput={onInput} />
                </Grid>
                <Grid size={12} container spacing={5}>
                  <Grid size="grow">
                    <TransferListsComponent
                      key={`${filtro.empresa?.value || "noemp"}-${filtro.centroCosto?.value || "nocencos"}-${usuarioSeleccionado?.cod_usuario || "nouser"}`}
                      tituloListaPrincipal="Disponibles en el sistema"
                      tituloListaSecundaria="Asignados al empleado"
                      listaPrincipal={pNoAsignados}
                      listaSecundaria={pAsignados}
                      cambioEnLista={actualizarPuestosAsignados}
                      objectLabel="puesto_desc"
                      objectValue="cod_puesto"
                      permitirPasarTodos
                      mostrarBotonGuardar={false}
                      // Añadir esta prop para mantener el estado interno del componente
                      preserveState={true}
                    />
                  </Grid>
                  <Grid size="grow">
                    <TablaComponent
                      key={`puestos-${usuarioSeleccionado?.cod_usuario}-${JSON.stringify(pAsignados.length)}`}
                      titulo="Seleccione indique el puesto para dejar como default"
                      id="cod_puesto"
                      encabezado={encabezadosDePuestos}
                      datos={pAsignados.map((i) => ({ ...i, accionesDeTabla: { auth: true } }))}
                      eventosDeTabla={{ auth: marcarComoDefault }}
                    />
                    <Grid size={12} width="100%" container my={3} textAlign="center">
                      <Grid size="grow"></Grid>
                      <Grid size="auto">
                        <Button variant="contained" size="small" onClick={() => guardarPuestos()}>
                          Guardar Asingacion de Puestos a Usuario
                        </Button>
                      </Grid>
                      <Grid size="grow"></Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            )}
          </>
        )}
      </Grid>
      <ActionAlertComponent
        openDialog={mostrarAlerta}
        aceptar={() => setMostrarAlerta(false)}
        activarCanecelar={false}
        tipo="error"
        titulo="Error al asingar puestos a usuario"
        content="No se selecciono ningun puesto por default para el usuario"
      />
      <Grid container width="100%">
        {/* EmpleadoUsuarioPuesto */}
        {/* <pre>{JSON.stringify({ usuarioSeleccionado }, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(pNoAsignados, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(pAsignados, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(usuarioSeleccionado, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(puestosAsignables, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(puestosAsignados, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(usuariosAsignados,null,2)}</pre> */}
        {/* <pre>{JSON.stringify(usuariosAsignables,null,2)}</pre> */}
        {/* <pre>{JSON.stringify(listaPuestos.data, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(listaUsu, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(listaEmpUsuPue, null, 2)}</pre>{" "} */}
      </Grid>
    </Box>
  );
};

EmpleadoUsuarioPuesto.propTypes = {
  id: PropTypes.number,
};

export default EmpleadoUsuarioPuesto;
