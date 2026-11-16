// import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import PropTypes from "prop-types";
// import { Box, Typography, Grid, Table, TableBody, TableRow, TableCell, TableHead, Stack, Icon, Button, IconButton, Tooltip, TableContainer, Pagination, Checkbox } from "@mui/material";
// import FormularioComponent from "../../../components/Formulario/FormularioComponent";
// import GenerarTablaCalculo from "./GenerarTablaCalculo";
// import GenerarTablaTotal from "./GenerarTablaTotal";
// import ActionAlertComponent from "../../../components/Dialog/ActionAlertComponent";
// import { useSelector } from "react-redux";
// import TooltipComponent from "../../../components/TooltipComponent/TooltipComponent";
// import GenerarFiltroInicial from "./GenerarFiltroInicial";
// import GenerarFiltrosCriterios from "./GenerarFiltrosCriterios";
// import BandaAlertaComponent from "../../../components/Alertas/BandaAlertaComponent";
// import DialogComponent from "../../../components/Dialog/DialogComponent";
// import CreacionTarifa from "../CreacionTarifa/CreacionTarifa";
// import generarPDF from "./_generarPdfCotizacion";
// import moment from "moment";
// import { api } from "../../../api";
// import GenerarTablaTotalCalculado from "./GenerarTablaTotalCalculado";
// import AcordeonComponent from "../../../components/AcordeonComponent/AcordeonComponent";
// import LoaderComponent from "../../../components/Loader/LoaderComponent";
// import GenerarTablaRubrosInternos from "./GenerarTablaRubrosInternos";
// import { useFetchMonedas } from "../../../hooks/Fetch/useFetchCatalog";

// const CalcularTarifa = (props) => {
//   const [calculando, setCalculando] = useState(false);
//   const [embarqueAbierto, setEmbarqueAbierto] = useState(true);
//   const [data_criterios, setData_criterios] = useState([]);
//   const [data_calculo, setData_calculo] = useState([]);

//   const monedas = useFetchMonedas();

//   const [rubros, setRubros] = useState([]);
//   const [listaGrupos, setListaGrupos] = useState([]);
//   const [filtros, setFiltros] = useState({});
//   const [filtrosPlantilla, setFiltrosPlantilla] = useState({});
//   const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
//   const [tarifaSeleccionada, setTarifaSeleccionada] = useState([]);
//   const [listaTarifasSeleccionadas, setListaTarifasSeleccionadas] = useState([]);
//   const [key, setKey] = useState(0);
//   const [pdfUrl, setPdfUrl] = useState("");
//   const [reconsultarPlantilla, setReconsultarPlantilla] = useState(0);
//   const [reconsultarCalculo, setReconsultarCalculo] = useState(0);
//   const [nuevoCalculo, setNuevoCalculo] = useState(0);
//   const [isOpenDialogCreacionTarifa, setIsOpenDialogCreacionTarifa] = useState(false);
//   const [rubroSeleccionado, setRubroSeleccionado] = useState(null);
//   const [MostrarErrorAlAgregarTarifaSeleccionada, setMostrarErrorAlAgregarTarifaSeleccionada] = useState(false);
//   const [alertaAccion, setAlertaAccion] = useState({
//     visible: false,
//     text: "",
//     tipo: "alert",
//     onAceptar: () => {},
//     aceptar: false,
//     onCancelar: () => {},
//     cancelar: false,
//   });
//   const [page, setPage] = useState(1);
//   const [tarifasInternas, setTarifasInternas] = useState([]);
//   const [showError, setShowError] = useState(false);
//   const [errorMessage, setErrorMessage] = useState("");

//   const theme = useSelector((state) => state.theme);
//   const informacionDeUsuario = useSelector((state) => state.auth);

//   const tarifasPorcentaje = useMemo(
//     () => data_calculo.filter((i) => !!i.servicios.some((s) => s.porcentaje)).map((i) => ({ ...i, servicios: i.servicios.filter((i) => i.porcentaje) })),
//     [data_calculo]
//   );

//   const rubrosProcesados = useMemo(() => {
//     const rubros_procesados = [];

//     rubros?.map((r) => {
//       if (listaGrupos.filter((lg) => lg.rubros.some((gr) => gr.cod_rubro === r.cod_rubro)).length > 0) rubros_procesados.push(r);
//     });

//     return rubros_procesados;
//   }, [rubros, listaGrupos]);

//   const gruposProcesados = useMemo(() => {
//     const listaGeneradoa = new Map(),
//       lista = [];

//     listaGrupos.forEach((i) => listaGeneradoa.set(i.cod_grupo_rubro, { grupo_nombre: i.nombre || " ", cod_grupo: i.cod_grupo_rubro, rubros: [] }));

//     rubros.forEach((r) => {
//       listaGrupos.forEach((lg) => {
//         if (lg.rubros.some((lgr) => lgr.cod_rubro === r.cod_rubro)) {
//           if (!listaGeneradoa.get(lg.cod_grupo_rubro).rubros.some((lgr) => lgr.cod_rubro === r.cod_rubro)) listaGeneradoa.get(lg.cod_grupo_rubro).rubros.push({ ...r, completo: false });
//         } else {
//           if (!listaGrupos.some((lg) => lg.rubros.some((lgr) => lgr.cod_rubro === r.cod_rubro)))
//             if (!listaGeneradoa.get(0).rubros.some((lgr) => lgr.cod_rubro === r.cod_rubro)) listaGeneradoa.get(0).rubros.push({ ...r, completo: false });
//         }
//       });
//     });

//     listaGeneradoa.forEach((val, key) => lista.push(val));

//     return lista.filter((lg) => lg.rubros.length > 0);
//   }, [rubros, listaGrupos]);

//   const proveedores = useMemo(() => {
//     const proveedores = [];

//     (data_calculo || [])?.forEach((item) =>
//       item.servicios?.length > 0
//         ? item.servicios
//             ?.filter((i) => !i.servicio_interno)
//             .map((s) => (proveedores.some((p) => p.entidad_id === s.entidad_id) ? null : proveedores.push({ entidad_id: s.entidad_id, entidad_nombre: s.entidad_nombre })))
//         : item.valor && item.costo
//           ? proveedores.some((p) => p.entidad_id === 0)
//             ? null
//             : proveedores.unshift({ entidad_nombre: "VALOR POR DEFECTO", entidad_id: 0 })
//           : null
//     );
//     return proveedores;
//   }, [data_calculo]);

//   const datos = useMemo(() => {
//     let datos = [];

//     const estaSeleccionado = (item) => {
//       return tarifaSeleccionada.some((t) => t.entidad_id === item.entidad_id && t.cod_rubro === item.cod_rubro && t.cod_servicio === item.cod_servicio);
//     };

//     const esSeleccionable = (item) => {
//       if (estaSeleccionado(item)) return true;
//       if (tarifaSeleccionada.length === 0) return true;

//       const rubroSeleccionado = tarifaSeleccionada.some((t) => t.cod_rubro === item.cod_rubro);

//       const grupo = gruposProcesados.find((g) => g.cod_grupo === item.cod_grupo);
//       const perteneceAGrupoSeleccionado = tarifaSeleccionada.find((g) => g.cod_grupo === item.cod_grupo);
//       const tieneEntidadEnGrupoSeleccionado = tarifaSeleccionada.find((g) => g.entidad_id === item.entidad_id && g.cod_grupo === item.cod_grupo);

//       const perteneceAGrupoCompleto = item.completo;
//       const grupoSeleccioadoCompleto = tarifaSeleccionada.some((g) => g.cod_grupo === item.cod_grupo && g.completo);

//       // console.log(item.cod_servicio);
//       // console.log({ item, grupo, perteneceAGrupoCompleto, tieneEntidadEnGrupoSeleccionado, perteneceAGrupoSeleccionado });
//       if (!grupo) return true;

//       if (grupo.cod_grupo !== 0) {
//         if (grupoSeleccioadoCompleto) {
//           if (perteneceAGrupoSeleccionado) {
//             if (tieneEntidadEnGrupoSeleccionado) {
//               if (!rubroSeleccionado) return true;
//               else return false;
//             } else return false;
//           }
//         } else {
//           if (perteneceAGrupoCompleto) {
//             if (perteneceAGrupoSeleccionado) {
//               if (tieneEntidadEnGrupoSeleccionado) return true;
//               else return false;
//             }
//           }
//         }
//       }
//       if (!rubroSeleccionado) return true;

//       // if (!grupoSeleccioadoCompleto && grupo && perteneceAGrupoCompleto) return false;

//       // if (grupoSeleccioadoCompleto && grupo && !perteneceAGrupoCompleto) return false;

//       // if (!rubroSeleccionado) return true;

//       return false;
//     };

//     gruposProcesados.forEach(({ grupo_nombre, cod_grupo, ...gp }) => {
//       gp.rubros.forEach(({ cod_rubro, nombre: rubro_nombre, ...gpr }) => {
//         data_calculo
//           .filter((d) => d.cod_rubro === cod_rubro)
//           .forEach(({ servicios, ...d }) => {
//             servicios.forEach(({ entidad_id, entidad_nombre, cod_servicio, ...s }) => {
//               let obj = {
//                 g: { cod: cod_grupo, cod_grupo, grupo_nombre },
//                 r: { cod: cod_rubro, cod_rubro, rubro_nombre },
//                 e: { cod: entidad_id, entidad_id, entidad_nombre },
//                 s: {
//                   cod: cod_servicio,
//                   cod_servicio,
//                   ...s,
//                   metodo: s.metodo
//                     ? {
//                         ...s.metodo,
//                         moneda_venta: (monedas.data || []).find((m) => m.cod_moneda === s.metodo?.cod_moneda_venta),
//                         moneda_costo: (monedas.data || []).find((m) => m.cod_moneda === s.metodo?.cod_moneda_costo),
//                       }
//                     : undefined,
//                   porcentaje: s.porcentaje
//                     ? {
//                         ...s.porcentaje,
//                         moneda_venta: (monedas.data || []).find((m) => m.cod_moneda === s.porcentaje?.cod_moneda_venta),
//                         moneda_costo: (monedas.data || []).find((m) => m.cod_moneda === s.porcentaje?.cod_moneda_costo),
//                       }
//                     : undefined,
//                 },
//               };

//               datos.push({ ...obj, s: { ...obj.s, completo: false } });
//             });
//           });
//       });
//     });

//     datos = datos.map((obj) => {
//       if (obj.g.cod === 0) return { ...obj, s: { ...obj.s, completo: false } };

//       const { rubros } = gruposProcesados.find((gp) => gp.cod_grupo === obj.g.cod);

//       let verificacion = [];

//       rubros.forEach((r) => (datos.some((d) => d.e.cod === obj.e.cod && r.cod_rubro === d.r.cod) ? verificacion.push(true) : verificacion.push(false)));

//       const completo = !verificacion.some((i) => !i);

//       return { ...obj, s: { ...obj.s, completo } };
//     });

//     return datos
//       .filter((obj) => !obj.s.servicio_interno)
//       .map((obj) => ({
//         ...obj,
//         s: {
//           ...obj.s,
//           seleccionable: esSeleccionable({ ...obj.g, ...obj.r, ...obj.e, ...obj.s }),
//           seleccionado: estaSeleccionado({ ...obj.g, ...obj.r, ...obj.e, ...obj.s }),
//         },
//       }));
//   }, [data_calculo, gruposProcesados, tarifaSeleccionada, monedas]);

//   const gruposCompletos = useMemo(() => {
//     let d = [];

//     datos.forEach((i) => {
//       if (i.g.cod === 0) {
//         d.push({ ...i.e, ...i.r, ...i.g, completo: false });
//         return;
//       }
//       const { rubros, cod_rubro } = gruposProcesados.find((gp) => gp.cod_grupo === i.g.cod);

//       if (rubros.length === 1) if (!d.some((data) => data.entidad_id === i.e.cod && d.cod_rubro === i.r.cod && d.cod_grupo === i.g.cod)) d.push({ ...i.e, ...i.r, ...i.g, completo: true });

//       let verificacion = [];

//       rubros.forEach((r) => (datos.some((d) => d.e.cod === i.e.cod && r.cod_rubro === d.r.cod) ? verificacion.push(true) : verificacion.push(false)));

//       if (!d.some((data) => data.entidad_id === i.e.cod && d.cod_rubro === i.r.cod && d.cod_grupo === i.g.cod)) d.push({ ...i.e, ...i.r, ...i.g, completo: !verificacion.some((i) => !i) });
//     });
//     return d;
//   }, [datos, gruposProcesados]);

//   const tarifasInternasProcesadas = useMemo(() => {
//     const estaSeleccionado = (item) => {
//       return tarifaSeleccionada.some((t) => t.entidad_id === item.entidad_id && t.cod_rubro === item.cod_rubro && t.cod_servicio === item.cod_servicio);
//     };
//     const esSeleccionable = (item) => {
//       if (estaSeleccionado(item)) return true;
//       if (tarifaSeleccionada?.some((i) => i.cod_rubro === item.cod_rubro)) return false;
//       return true;
//     };

//     return (tarifasInternas || []).map((i) => ({
//       checked: estaSeleccionado(i),
//       esSeleccionable: esSeleccionable(i),
//       ...i,
//       metodo: i.metodo
//         ? {
//             ...i.metodo,
//             moneda_venta: (monedas.data || []).find((m) => m.cod_moneda === i.metodo?.cod_moneda_venta),
//             moneda_costo: (monedas.data || []).find((m) => m.cod_moneda === i.metodo?.cod_moneda_costo),
//           }
//         : undefined,
//       porcentaje: i.porcentaje
//         ? {
//             ...i.porcentaje,
//             moneda_venta: (monedas.data || []).find((m) => m.cod_moneda === i.porcentaje?.cod_moneda_venta),
//             moneda_costo: (monedas.data || []).find((m) => m.cod_moneda === i.porcentaje?.cod_moneda_costo),
//           }
//         : undefined,
//     }));
//   }, [tarifasInternas, tarifaSeleccionada, monedas]);

//   const tarifasPorcentajeProcesadas = useMemo(() => {
//     const estaSeleccionado = (item) => {
//       return tarifaSeleccionada.some((t) => t.entidad_id === item.entidad_id && t.cod_rubro === item.cod_rubro && t.cod_servicio === item.cod_servicio);
//     };
//     const esSeleccionable = (item) => {
//       if (estaSeleccionado(item)) return true;
//       if (tarifaSeleccionada?.some((i) => i.cod_rubro === item.cod_rubro)) return false;
//       return true;
//     };

//     return (tarifasInternas || []).map((i) => ({
//       checked: estaSeleccionado(i),
//       esSeleccionable: esSeleccionable(i),
//       ...i,
//       metodo: i.metodo
//         ? {
//             ...i.metodo,
//             moneda_venta: (monedas.data || []).find((m) => m.cod_moneda === i.metodo?.cod_moneda_venta),
//             moneda_costo: (monedas.data || []).find((m) => m.cod_moneda === i.metodo?.cod_moneda_costo),
//           }
//         : undefined,
//       porcentaje: i.porcentaje
//         ? {
//             ...i.porcentaje,
//             moneda_venta: (monedas.data || []).find((m) => m.cod_moneda === i.porcentaje?.cod_moneda_venta),
//             moneda_costo: (monedas.data || []).find((m) => m.cod_moneda === i.porcentaje?.cod_moneda_costo),
//           }
//         : undefined,
//     }));
//   }, [tarifasInternas, tarifaSeleccionada, monedas]);

//   const limpiarProveedoresTarifasSeleccionadas = useCallback(
//     (item) => {
//       if (tarifaSeleccionada.some((t) => t.entidad_id === item)) setTarifaSeleccionada((v) => v.filter((t) => t.entidad_id !== item));

//       setKey((v) => v + 1);
//     },
//     [tarifaSeleccionada]
//   );
//   const limpiarRubrosTarifasSeleccionadas = useCallback(
//     (item) => {
//       if (tarifaSeleccionada.some((t) => t.cod_rubro === item)) setTarifaSeleccionada((v) => v.filter((t) => t.cod_rubro !== item));

//       setKey((v) => v + 1);
//     },
//     [tarifaSeleccionada]
//   );
//   const manejarTarifasSeleccionadas = useCallback(
//     (item) => {
//       if (tarifaSeleccionada.some((t) => t.cod_servicio === item.cod_servicio)) setTarifaSeleccionada((v) => v.filter((t) => t.cod_servicio !== item.cod_servicio));
//       else if (!tarifaSeleccionada.some((t) => t.cod_rubro === item.cod_rubro)) setTarifaSeleccionada((v) => [...v, item]);

//       setKey((v) => v + 1);
//     },
//     [tarifaSeleccionada]
//   );

//   // const consultarMmonedas = useCallback(async () => {
//   //   await api.get("/api/appweb/lista-moneda", { params: { es_operativa: true } }).then(({ data }) => setMonedas(data?.data));
//   // }, []);

//   const consultarCatalogos = useCallback(async () => {
//     // await Promise.all([consultarMmonedas()]);
//   }, []);

//   const handleTarifaCreada = useCallback((tarifa) => {
//     setReconsultarPlantilla((v) => v + 1);
//     // setReconsultarCalculo((v) => v + 1);
//     setIsOpenDialogCreacionTarifa(false);
//   }, []);

//   useEffect(() => {
//     consultarCatalogos();
//   }, [consultarCatalogos]);

//   return (
//     <Box sx={{ m: 0, p: 1, pb: 5 }} height="100%">
//       <Grid container width="100%">
//         {/* <Button
//           onClick={(ev) => {
//             ev.preventDefault();
//             setReconsultarPlantilla((v) => v + 1);
//           }}
//         >
//           AQUI
//         </Button> */}
//         <Grid width={"100%"}>
//           <GenerarFiltroInicial
//             reconsultarPlantilla={reconsultarPlantilla}
//             retornarCriterios={(criterios, cliente, valores, filtros, gruposRubros, tipo, error) => {
//               if (error) {
//                 setData_calculo([]);
//                 setShowError(true);
//                 setErrorMessage(error);
//               } else setShowError(false);
//               setRubros(criterios.rubros.map((i) => ({ ...i, tipo: ["calculo"] })) || []);
//               setListaGrupos([{ cod_grupo_rubro: 0, nombre: "", rubros: [] }, ...(gruposRubros || [])]);
//               if (tipo === 0) {
//                 setClienteSeleccionado(cliente);
//                 setData_criterios({ ...criterios, entidad_id: cliente });
//                 setFiltros({ ...valores });
//                 setFiltrosPlantilla(filtros);
//                 setData_calculo([]);
//                 setTarifaSeleccionada([]);
//                 setListaTarifasSeleccionadas([]);
//               } else {
//                 setReconsultarCalculo((v) => v + 1);
//               }
//             }}
//             valoresCotizacion={{ empresa: 1, centro_costo: 2, tipo_transporte: 49, tipo_servicio: 81, cod_tipo_carga: 119, cod_clasificacion_carga: 123 }}
//           />
//           {/* <pre>EMPRESA, CENTRO DE COSTO, TIPO TRANSPORTE, TIPO SERVICIO, CLIENTE</pre> */}
//         </Grid>
//         {data_criterios?.criterios?.length > 0 && (
//           <Grid width={"100%"}>
//             <GenerarFiltrosCriterios
//               reconsultarCalculo={reconsultarCalculo}
//               plantilla={data_criterios}
//               setCalculando={setCalculando}
//               filtros={filtrosPlantilla}
//               retornarCalculos={(d, tarifasInternas = []) => {
//                 if (Array.isArray(d.data)) {
//                   setData_calculo(d.data);
//                   setFiltros((v) => ({ ...v, ...d.valores }));
//                   setTarifaSeleccionada([]);
//                   setListaTarifasSeleccionadas([]);
//                   setNuevoCalculo((v) => v + 1);
//                   setCalculando(false);
//                   setTarifasInternas(tarifasInternas);
//                   setRubros((r) =>
//                     r.reduce((arr, acc) => {
//                       if (!arr.some((a) => a.cod_rubro === acc.cod_rubro)) arr.push(acc);

//                       tarifasInternas.forEach((r) => {
//                         if (!arr.some((a) => a.cod_rubro === r.cod_rubro)) arr.push({ cod_rubro: r.cod_rubro, nombre_rubro: r.nombre_rubro, cod_estado: 1, obligatiorio: true, tipo: ["interno"] });
//                         else
//                           arr.forEach((a) => {
//                             if (a.cod_rubro === r.cod_rubro) if (!a.tipo.includes("interno")) a.tipo.push("interno");
//                           });
//                       });

//                       return arr;
//                     }, [])
//                   );
//                 } else {
//                   setCalculando(false);
//                 }
//               }}
//             />
//           </Grid>
//         )}
//         {/* <pre key={JSON.stringify(grupos, null, 2)}>{JSON.stringify(grupos, null, 2)}</pre> */}
//         {calculando ? (
//           <LoaderComponent sx={{ position: "block" }} texto="Estamos calculando las tarifas " open={true} />
//         ) : (
//           <>
//             {data_calculo?.length > 0 ? (
//               <Grid width="100%">
//                 <Grid
//                   width="100%"
//                   color={`primary.${theme.opositeMode}`}
//                   sx={{
//                     p: 0,
//                     borderWidth: 3,
//                     borderBottomStyle: "solid",
//                     borderColor: `primary.${theme.opositeMode}`,
//                   }}
//                 >
//                   <Stack direction="row">
//                     <Typography variant="h5" sx={{ m: 0, p: 0, mr: 10 }}>
//                       <Icon sx={{ fontSize: "inherit" }} className="c-kanban" /> CÁLCULO
//                     </Typography>
//                     <Typography
//                       variant="span"
//                       color="text"
//                       sx={{
//                         m: 0,
//                         mt: "auto !important",
//                         ml: "10px !important",
//                         p: 0,
//                       }}
//                     >
//                       Seleccione los rubros segun el proveedor en la siguiente tabla
//                     </Typography>
//                   </Stack>
//                 </Grid>
//                 <GenerarTablaCalculo
//                   selecciones={tarifaSeleccionada}
//                   limpiarProveedor={(entidad_id) => limpiarProveedoresTarifasSeleccionadas(entidad_id)}
//                   limpiarRubro={(cod_rubro) => limpiarRubrosTarifasSeleccionadas(cod_rubro)}
//                   rubros={rubros}
//                   grupos={listaGrupos}
//                   proveedores={proveedores}
//                   gruposCompletos={gruposCompletos}
//                   datos={data_calculo}
//                   seleccionarTarifa={manejarTarifasSeleccionadas}
//                   handleCrearTarifa={(rubro) => {
//                     setRubroSeleccionado(rubro);
//                     setIsOpenDialogCreacionTarifa(true);
//                   }}
//                   keyVal={`${key}_${nuevoCalculo}`}
//                 />
//               </Grid>
//             ) : (
//               <Grid textAlign="center" width="100%">
//                 <Typography fontWeight="bold">No se pudo realizar el calculo</Typography>
//               </Grid>
//             )}
//             {/* <Grid
//                 width="100%"
//                 color={`primary.${theme.opositeMode}`}
//                 mt={3}
//                 sx={{
//                   p: 0,
//                   mb: 1,
//                   borderWidth: 0,
//                   borderBottomStyle: "solid",
//                   borderColor: `primary.${theme.opositeMode}`,
//                 }}
//               >
//                 <Stack direction="row">
//                   <Typography variant="h5" sx={{ m: 0, p: 0, mr: 10 }}>
//                     <Icon sx={{ fontSize: "inherit" }} className="c-kanban" /> Rubros Internos
//                   </Typography>
//                   <Typography
//                     variant="span"
//                     color="text"
//                     sx={{
//                       m: 0,
//                       mt: "auto !important",
//                       ml: "10px !important",
//                       p: 0,
//                     }}
//                   >
//                     Seleccione los rubros Internos de la empresa a aplicar en el calculo
//                   </Typography>
//                 </Stack>
//                 <Grid container direction="column" width="100%">
//                 </Grid>
//               </Grid> */}
//             <Grid
//               width="100%"
//               color={`primary.${theme.opositeMode}`}
//               mt={3}
//               sx={{
//                 p: 0,
//                 mb: 1,
//                 borderWidth: 0,
//                 borderBottomStyle: "solid",
//                 borderColor: `primary.${theme.opositeMode}`,
//               }}
//             >
//               {data_calculo?.length > 0 ? <GenerarTablaRubrosInternos seleccionarTarifa={manejarTarifasSeleccionadas} selecciones={tarifaSeleccionada} data={tarifasInternas} /> : <></>}
//             </Grid>
//             {data_calculo?.length > 0 && (
//               <Grid width="100%" mt={3}>
//                 <Grid width="100%">
//                   <GenerarTablaTotal
//                     datos={tarifaSeleccionada}
//                     datosPorcentajes={data_calculo || []}
//                     rubros={rubros || []}
//                     monedas={monedas?.data || []}
//                     permiteAgrupacion
//                     grupos={listaGrupos || []}
//                     agregarCalculoALista={(data, dataPorcentaje) => {
//                       if (data.every((d) => d.valor.length > 0)) {
//                         setAlertaAccion((v) => ({
//                           ...v,
//                           visible: true,
//                           aceptar: true,
//                           cancelar: true,
//                           onAceptar: () => {
//                             const a = [...data, ...dataPorcentaje];
//                             setListaTarifasSeleccionadas((l) => [...l, a]);
//                             setTarifaSeleccionada([]);
//                           },
//                           onCancelar: () => {},
//                           text: (
//                             <>
//                               Esta por agregar el calculo actual a la lista de Calculos, esto borrara la seleccion actual.
//                               <br /> ¿Desea continuar?
//                             </>
//                           ),
//                         }));
//                       } else setMostrarErrorAlAgregarTarifaSeleccionada(true);
//                     }}
//                     gruposCompletos={gruposCompletos}
//                   />
//                 </Grid>
//               </Grid>
//             )}
//             {/* {tarifaSeleccionada.length > 0 && (
//         )} */}
//             {listaTarifasSeleccionadas.length > 0 && (
//               <Grid width="100%" mt={3}>
//                 <Grid
//                   width="100%"
//                   color={`primary.${theme.opositeMode}`}
//                   sx={{
//                     p: 0,
//                     borderWidth: 0,
//                     borderBottomStyle: "solid",
//                     borderColor: `primary.${theme.opositeMode}`,
//                   }}
//                 >
//                   <Grid container direction="row">
//                     <Grid>
//                       <Typography variant="h5" sx={{ m: 0, p: 0, mr: 10 }}>
//                         <Icon sx={{ fontSize: "inherit" }} className="c-calcular" /> Total de cada Calculo
//                       </Typography>
//                     </Grid>
//                     <Grid size="grow"></Grid>
//                     <Grid>
//                       <Stack direction="row" alignItems="start" width="fit-content" gap={1}>
//                         <Button
//                           onClick={() => {
//                             setAlertaAccion((v) => ({
//                               ...v,
//                               visible: true,
//                               text: (
//                                 <>
//                                   Esta por eliminar el calculo, esta accion no es reversible.
//                                   <br /> ¿Desea continuar?
//                                 </>
//                               ),
//                               onAceptar: () => {
//                                 setListaTarifasSeleccionadas((lista) => lista.filter((i, ind) => page - 1 !== ind));
//                                 setPage((p) => (p == 1 ? 1 : p - 1));
//                               },
//                               aceptar: true,
//                               onCancelar: () => {},
//                               cancelar: true,
//                             }));
//                           }}
//                           color="error"
//                           variant="contained"
//                           size="small"
//                         >
//                           <Icon className="c-eliminar" sx={{ fontSize: "inherit", mr: 1 }} /> Quitar calculoo de la lista
//                         </Button>
//                         <Button
//                           onClick={() => {
//                             setAlertaAccion((v) => ({
//                               ...v,
//                               visible: true,
//                               text: (
//                                 <>
//                                   Al editar el calculo seleccionado se borrara la seleccion actual.
//                                   <br /> ¿Desea continuar?
//                                 </>
//                               ),
//                               onAceptar: () => {
//                                 setTarifaSeleccionada(listaTarifasSeleccionadas[page - 1]);
//                                 setPage((p) => (p == 1 ? 1 : p - 1));
//                                 setListaTarifasSeleccionadas((lista) => lista.filter((i, ind) => page - 1 !== ind));
//                               },
//                               aceptar: true,
//                               onCancelar: () => {},
//                               cancelar: true,
//                             }));
//                           }}
//                           sx={{ bgcolor: "accent.main", color: "white.main" }}
//                           color="accent"
//                           variant="contained"
//                           size="small"
//                         >
//                           <Icon className="c-lapiz" sx={{ fontSize: "inherit", mr: 1 }} /> Editar calculo
//                         </Button>
//                         <Button
//                           onClick={() => {
//                             const titulo = `Calculo generado [ formato provicional ]`;
//                             setPdfUrl(
//                               generarPDF({
//                                 descargar: true,
//                                 propiedades: {
//                                   title: `${titulo} - ERPWEB - ${moment().format("YYYY_MM_DD_HH_mm_SS")}.pdf`,
//                                   subject: titulo,
//                                   author: "ERP-web",
//                                   creator: "ERP-web",
//                                 },
//                                 titulo: `${titulo}`,
//                                 horizontal: false,
//                                 bottom: true,
//                                 header: {
//                                   "Generado el: ": moment().format("DD/MM/YYYY HH:mm:ss"),
//                                   "Tipo de Transporte": filtros.tipo_transporte?.label || "",
//                                   "Tipo de Servicio": filtros.tipo_servicio?.label || "",
//                                 },
//                                 agente: { cod_usuario: informacionDeUsuario.cod_usuario, usuario: informacionDeUsuario.usuario, nombre: informacionDeUsuario.nombre },
//                                 datos: listaTarifasSeleccionadas,
//                               })
//                             );
//                           }}
//                           sx={{ bgcolor: "pdf.main", color: "white.main" }}
//                           color="accent"
//                           variant="contained"
//                           size="small"
//                         >
//                           <Icon className="c-pdf" sx={{ fontSize: "inherit", mr: 1 }} /> Generar
//                         </Button>
//                       </Stack>
//                     </Grid>
//                   </Grid>
//                 </Grid>
//                 <Grid width="100%" alignItems="center" mt={1}>
//                   <Pagination sx={{ mx: "auto", width: "fit-content" }} variant="outlined" shape="rounded" count={listaTarifasSeleccionadas.length} page={page} onChange={(ev, val) => setPage(val)} />
//                 </Grid>
//                 <Grid width="100%">
//                   <Stack direction="row" alignItems="start" width="100%" gap={1}>
//                     <Box width="100%">
//                       <GenerarTablaTotalCalculado
//                         monedas={monedas?.data || []}
//                         datosPorcentajes={data_calculo}
//                         rubros={rubros}
//                         grupos={listaGrupos}
//                         permiteAgrupacion
//                         datos={listaTarifasSeleccionadas[0]}
//                       />
//                     </Box>
//                   </Stack>
//                 </Grid>
//                 <Grid width="100%" alignItems="center" mt={1}>
//                   <Pagination sx={{ mx: "auto", width: "fit-content" }} variant="outlined" shape="rounded" count={listaTarifasSeleccionadas.length} page={page} onChange={(ev, val) => setPage(val)} />
//                 </Grid>
//               </Grid>
//             )}
//             <ActionAlertComponent
//               tipo={alertaAccion.tipo}
//               openDialog={alertaAccion.visible}
//               cancelar={() => {
//                 alertaAccion.onCancelar();
//                 setAlertaAccion((v) => ({ ...v, visible: false }));
//               }}
//               aceptar={() => {
//                 alertaAccion.onAceptar();
//                 setAlertaAccion((v) => ({ ...v, visible: false }));
//               }}
//               handleClose={() => setAlertaAccion((v) => ({ ...v, visible: false }))}
//               content={alertaAccion.text}
//               activarAceptar={alertaAccion.aceptar}
//               activarCanecelar={alertaAccion.cancelar}
//             />
//             <ActionAlertComponent
//               tipo="error"
//               openDialog={MostrarErrorAlAgregarTarifaSeleccionada}
//               cancelar={() => setMostrarErrorAlAgregarTarifaSeleccionada(false)}
//               aceptar={() => setMostrarErrorAlAgregarTarifaSeleccionada(false)}
//               handleClose={() => setMostrarErrorAlAgregarTarifaSeleccionada(false)}
//               activarAceptar={true}
//               activarCanecelar={false}
//               content={"Existe uno o mas rubros no seleccionados"}
//             />
//             {/* <pre>{JSON.stringify({ tarifasPorcentaje }, null, 2)}</pre> */}
//             {/* <pre>{JSON.stringify(tarifasInternasProcesadas, null, 2)}</pre> */}
//             {/* <pre>{JSON.stringify(tarifasInternas, null, 2)}</pre> */}
//             {/* <pre>{JSON.stringify(gruposCompletos, null, 2)}</pre> */}
//             {/* <pre>{JSON.stringify(data_calculo, null, 2)}</pre> */}
//             {/* <pre>{JSON.stringify(tarifaSeleccionada, null, 2)}</pre> */}
//             {/* <pre>{JSON.stringify(listaTarifasSeleccionadas, null, 2)}</pre> */}
//             {/* <pre>{JSON.stringify(data_criterios, null, 2)}</pre> */}
//             {/* <pre>{JSON.stringify(rubros, null, 2)}</pre> */}
//             {/* <pre>{JSON.stringify(listaGrupos, null, 2)}</pre> */}
//             {/* <pre>
//           {JSON.stringify(
//             grupos.reduce((acc, { cod_grupo_rubro, nombre, rubros, ...grupo }) => {
//               rubros.map(({ cod_rubro, nombre_rubro }) => {
//                 if (!acc.some((a) => a.cod_rubro === cod_rubro)) acc.push({ cod_grupo_rubro, nombre, cod_rubro, nombre_rubro });
//               });
//               return acc;
//             }, []),
//             null,
//             2
//           )}
//         </pre> */}
//             {/* <pre>{JSON.stringify(grupos,    null, 2)}</pre> */}
//             {/* <pre>{JSON.stringify(datos, null, 2)}</pre> */}
//             {/* <pre>{JSON.stringify(rubrosProcesados, null, 2)}</pre> */}
//             {/* <pre>{JSON.stringify(rubros, null, 2)}</pre> */}
//             {/* <pre>{JSON.stringify(filtros, null, 2)}</pre> */}
//           </>
//         )}
//         {/* <>{pdfUrl !== "" && <iframe key={pdfUrl} src={pdfUrl + "#toolbar=0&navpanes=0&scrollbar=0"} width="100%" height="500px" />}</> */}
//       </Grid>
//       <DialogComponent titulo="Agregar Tarifa" openDialog={isOpenDialogCreacionTarifa} handleClose={() => setIsOpenDialogCreacionTarifa(false)} width={"90%"} height={"90%"}>
//         <CreacionTarifa
//           isCreationOnlyMode={true}
//           defaultValues={{
//             ...data_criterios,
//             entidad_id: undefined,
//             cod_rubro: rubroSeleccionado?.cod_rubro || null,
//           }}
//           onTarifaCreada={handleTarifaCreada}
//         />
//       </DialogComponent>
//     </Box>
//   );
// };

// CalcularTarifa.propTypes = {};

// export default CalcularTarifa;
import React, { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Grid } from "@mui/material";
import GenerarFiltroInicial from "./GenerarFiltroInicial";
import GenerarFiltrosCriterios from "./GenerarFiltrosCriterios";
import GenerarTablaCalculo from "./GenerarTablaCalculo";
import GenerarTablaRubrosInternos from "./GenerarTablaRubrosInternos";
import { useFetchMonedas } from "../../../hooks/Fetch/useFetchCatalog";
import DialogComponent from "../../../components/Dialog/DialogComponent";
import CreacionTarifa from "../CreacionTarifa/CreacionTarifa";
import GenerarTablaTotal from "./GenerarTablaTotal";

const CalcularTarifa = (props) => {
  const [reconsultarPlantilla, setReconsultarPlantilla] = useState(0);
  const [criterios, setCriterios] = useState({});
  const [calculo, setCalculo] = useState({});
  const [tarifaSeleccionada, setTarifaSeleccionada] = useState([]);
  const [rubroSeleccionado, setRubroSeleccionado] = useState(null);
  const [isOpenDialogCreacionTarifa, setIsOpenDialogCreacionTarifa] = useState(false);

  const monedas = useFetchMonedas();

  const limpiarProveedoresTarifasSeleccionadas = useCallback(
    (item) => {
      if (tarifaSeleccionada.some((t) => t.entidad_id === item)) setTarifaSeleccionada((v) => v.filter((t) => t.entidad_id !== item));
    },
    [tarifaSeleccionada]
  );
  const limpiarRubrosTarifasSeleccionadas = useCallback(
    (item) => {
      if (tarifaSeleccionada.some((t) => t.cod_rubro === item)) setTarifaSeleccionada((v) => v.filter((t) => t.cod_rubro !== item));
    },
    [tarifaSeleccionada]
  );
  const manejarTarifasSeleccionadas = useCallback(
    (item) => {
      if (tarifaSeleccionada.some((t) => t.cod_servicio === item.cod_servicio)) setTarifaSeleccionada((v) => v.filter((t) => t.cod_servicio !== item.cod_servicio));
      else if (!tarifaSeleccionada.some((t) => t.cod_rubro === item.cod_rubro)) setTarifaSeleccionada((v) => [...v, item]);
    },
    [tarifaSeleccionada]
  );

  const handleTarifaCreada = useCallback((tarifa) => {
    setReconsultarPlantilla((v) => v + 1);
    // setReconsultarCalculo((v) => v + 1);
    setIsOpenDialogCreacionTarifa(false);
  }, []);

  const gruposProcesados = useMemo(() => {
    if (!criterios.gruposRubros) return [];
    const listaGeneradoa = new Map(),
      lista = [];

    criterios.gruposRubros.forEach((i) => listaGeneradoa.set(i.cod_grupo_rubro, { grupo_nombre: i.nombre || " ", cod_grupo: i.cod_grupo_rubro, rubros: [] }));

    criterios.plantilla?.rubros?.forEach((r) => {
      criterios.gruposRubros.forEach((lg) => {
        if (lg.rubros.some((lgr) => lgr.cod_rubro === r.cod_rubro)) {
          if (!listaGeneradoa.get(lg.cod_grupo_rubro).rubros.some((lgr) => lgr.cod_rubro === r.cod_rubro)) listaGeneradoa.get(lg.cod_grupo_rubro).rubros.push({ ...r, completo: false });
        } else {
          if (!criterios.gruposRubros.some((lg) => lg.rubros.some((lgr) => lgr.cod_rubro === r.cod_rubro)))
            if (!listaGeneradoa.get(0).rubros.some((lgr) => lgr.cod_rubro === r.cod_rubro)) listaGeneradoa.get(0).rubros.push({ ...r, completo: false });
        }
      });
    });

    listaGeneradoa.forEach((val, key) => lista.push(val));

    return lista.filter((lg) => lg.rubros.length > 0);
  }, [criterios.plantilla?.rubros, criterios.gruposRubros]);

  const datos_processados = useMemo(() => {
    let data = [];

    const estaSeleccionado = (item) => {
      return tarifaSeleccionada.some((t) => t.cod_servicio === item.cod_servicio);
    };

    const esSeleccionable = (item) => {
      if (estaSeleccionado(item)) return true;
      if (tarifaSeleccionada.length === 0) return true;

      const rubroSeleccionado = tarifaSeleccionada.some((t) => t.cod_rubro === item.cod_rubro);

      const grupo = gruposProcesados.find((g) => g.cod_grupo === item.cod_grupo);
      const perteneceAGrupoSeleccionado = tarifaSeleccionada.find((g) => g.cod_grupo === item.cod_grupo);
      const tieneEntidadEnGrupoSeleccionado = tarifaSeleccionada.find((g) => g.entidad_id === item.entidad_id && g.cod_grupo === item.cod_grupo);

      const perteneceAGrupoCompleto = item.completo;
      const grupoSeleccioadoCompleto = tarifaSeleccionada.some((g) => g.cod_grupo === item.cod_grupo && g.completo);

      // console.log(item.cod_servicio);
      // console.log({ item, grupo, perteneceAGrupoCompleto, tieneEntidadEnGrupoSeleccionado, perteneceAGrupoSeleccionado });
      if (!grupo) return true;

      if (grupo.cod_grupo !== 0) {
        if (grupoSeleccioadoCompleto) {
          if (perteneceAGrupoSeleccionado) {
            if (tieneEntidadEnGrupoSeleccionado) {
              if (!rubroSeleccionado) return true;
              else return false;
            } else return false;
          }
        } else {
          if (perteneceAGrupoCompleto) {
            if (perteneceAGrupoSeleccionado) {
              if (tieneEntidadEnGrupoSeleccionado) return true;
              else return false;
            }
          }
        }
      }
      if (!rubroSeleccionado) return true;

      // if (!grupoSeleccioadoCompleto && grupo && perteneceAGrupoCompleto) return false;

      // if (grupoSeleccioadoCompleto && grupo && !perteneceAGrupoCompleto) return false;

      // if (!rubroSeleccionado) return true;

      return false;
    };

    gruposProcesados.forEach(({ grupo_nombre, cod_grupo, ...gp }) => {
      gp.rubros.forEach(({ cod_rubro, nombre_rubro, ...gpr }) => {
        calculo.datos?.data
          .filter((d) => d.cod_rubro === cod_rubro)
          .forEach(({ servicios, ...d }) => {
            servicios.forEach(({ entidad_id, entidad_nombre, cod_servicio, ...s }) => {
              let obj = {
                g: { cod: cod_grupo, cod_grupo, grupo_nombre },
                r: { cod: cod_rubro, cod_rubro, nombre_rubro },
                e: { cod: entidad_id, entidad_id, entidad_nombre },
                s: {
                  cod: cod_servicio,
                  cod_servicio,
                  ...s,
                  metodo: s.metodo
                    ? {
                        ...s.metodo,
                        moneda_venta: (monedas.data || []).find((m) => m.cod_moneda === s.metodo?.cod_moneda_venta),
                        moneda_costo: (monedas.data || []).find((m) => m.cod_moneda === s.metodo?.cod_moneda_costo),
                      }
                    : undefined,
                  porcentaje: s.porcentaje
                    ? {
                        ...s.porcentaje,
                        moneda_venta: (monedas.data || []).find((m) => m.cod_moneda === s.porcentaje?.cod_moneda_venta),
                        moneda_costo: (monedas.data || []).find((m) => m.cod_moneda === s.porcentaje?.cod_moneda_costo),
                      }
                    : undefined,
                },
              };

              data.push({ ...obj, s: { ...obj.s, completo: false } });
            });
          });
      });
    });

    data = data.map((obj) => {
      if (obj.g.cod === 0) return { ...obj, s: { ...obj.s, completo: false } };

      const { rubros } = gruposProcesados.find((gp) => gp.cod_grupo === obj.g.cod);

      let verificacion = [];

      rubros.forEach((r) => (data.some((d) => d.e.cod === obj.e.cod && r.cod_rubro === d.r.cod) ? verificacion.push(true) : verificacion.push(false)));

      const completo = !verificacion.some((i) => !i);

      return { ...obj, s: { ...obj.s, completo } };
    });

    return data
      .filter((obj) => !obj.s.servicio_interno)
      .map((obj) => ({
        ...obj,
        s: {
          ...obj.s,
          seleccionable: esSeleccionable({ ...obj.g, ...obj.r, ...obj.e, ...obj.s }),
          seleccionado: estaSeleccionado({ ...obj.g, ...obj.r, ...obj.e, ...obj.s }),
        },
      }));
  }, [calculo.datos?.data, gruposProcesados, tarifaSeleccionada, monedas]);

  return (
    <Box>
      <GenerarFiltroInicial
        reconsultarPlantilla={reconsultarPlantilla}
        retornarCriterios={(plantilla, cliente, valores, filtros, gruposRubros, tipo, error, ...etc) => setCriterios({ plantilla, cliente, valores, filtros, gruposRubros, tipo, error, etc })}
      />
      {criterios.plantilla && (
        <GenerarFiltrosCriterios
          valores_default={{ valor_kilos: 30 }}
          plantilla={criterios.plantilla}
          filtros={criterios.filtros}
          retornarCalculos={(datos, tarifasInternas) => setCalculo({ datos, tarifasInternas })}
        />
      )}
      {calculo.datos && (
        <GenerarTablaCalculo
          rubros={criterios.plantilla?.rubros || []}
          grupos={criterios.gruposRubros || []}
          datos={calculo.datos?.data || []}
          selecciones={tarifaSeleccionada}
          limpiarProveedor={(entidad_id) => limpiarProveedoresTarifasSeleccionadas(entidad_id)}
          limpiarRubro={(cod_rubro) => limpiarRubrosTarifasSeleccionadas(cod_rubro)}
          seleccionarTarifa={manejarTarifasSeleccionadas}
          handleCrearTarifa={(rubro) => {
            setRubroSeleccionado(rubro);
            setIsOpenDialogCreacionTarifa(true);
          }}
        />
      )}
      {calculo.datos && <GenerarTablaRubrosInternos data={calculo.tarifasInternas} selecciones={tarifaSeleccionada} seleccionarTarifa={manejarTarifasSeleccionadas} />}

      {tarifaSeleccionada.length > 0 && (
        <GenerarTablaTotal
          datos={tarifaSeleccionada}
          datosPorcentajes={gruposProcesados}
          rubros={criterios.plantilla?.rubros || []}
          monedas={monedas?.data || []}
          permiteAgrupacion
          grupos={[{ cod_grupo_rubro: 0, nombre: "", rubros: [] }, ...(criterios.gruposRubros || [])]}
        />
      )}

      <DialogComponent titulo="Agregar Tarifa" openDialog={isOpenDialogCreacionTarifa} handleClose={() => setIsOpenDialogCreacionTarifa(false)} width={"90%"} height={"90%"}>
        <CreacionTarifa
          isCreationOnlyMode={true}
          defaultValues={{
            ...criterios?.plantilla,
            entidad_id: undefined,
            cod_rubro: rubroSeleccionado?.cod_rubro || null,
          }}
          onTarifaCreada={handleTarifaCreada}
        />
      </DialogComponent>

      <Grid container>
        {/* <pre>{JSON.stringify(Object.keys(criterios || {}), null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(Object.keys(calculo || {}), null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(criterios, null, 2)}</pre> */}
        {/* <pre>{JSON.stringify(calculo, null, 2)}</pre> */}
      </Grid>
    </Box>
  );
};

CalcularTarifa.propTypes = {};

export default CalcularTarifa;
