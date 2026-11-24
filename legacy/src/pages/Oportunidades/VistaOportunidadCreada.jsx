import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, Grid, Button, Icon, CircularProgress, ImageList, ImageListItem } from "@mui/material";
import { CardCliente } from "../../views/Actividades/CardCliente";
import { CardOportunidad } from "../../views/Oportunidades/CardOportunidad";
import TabComponent from "../../components/Tabs/TabComponent";
import StepperComponent from "../../components/Stepper/StepperComponent";
import { proceso_oportunidad } from "./proceso_oportunidad";
import { api } from "../../api";
import { ListaActividades } from "../Actividades/ListaActividades";
import DialogComponent from "../../components/Dialog/DialogComponent";
import { FormularioActividades } from "../../views/Actividades/FormularioActividades";
import TablaContactosActividad from "../../views/Actividades/TablaContatosActividad";
import { useSelector } from "react-redux";
import FormularioComponent from "../../components/Formulario/FormularioComponent";

export const VistaOportunidadCreada = (props) => {
  const { json, cod_usuario } = useSelector((state) => state.auth);
  const { dataGet, catalogos, setUpdateData, updateData } = props;
  const { entidades = [], contactos = [], empresas = [], estados, paises, ciudades, industrias, tratamientos = [], temperamentos = [], tipos = [], cencos = [], empleados = [] } = catalogos;
  const [data, setData] = useState(null);
  const [cliente, setCliente] = useState({
    entidad_nombre: "",
    pais: "",
    ciudad: "",
    industria: "",
    tipo: "",
    estado: "",
  });
  const [indexEstadoActual, setIndexEstadoActual] = useState(0);
  const [openCrear, setOpenCrear] = useState(false);
  const [estado, setEstado] = useState({
    cod_estado: 29,
    estado_desc: "EN PROCESO",
    cod_tipo: 41,
    nom_tipo: "OPORTUNIDAD",
  });
  // const [contactos, setContactos] = useState([])
  const [key, setKey] = useState(1);
  const [open, setOpen] = useState(false);

  const convertKeysToLowerCase = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map((v) => convertKeysToLowerCase(v));
    } else if (obj !== null && obj.constructor === Object) {
      return Object.keys(obj).reduce((acc, key) => {
        acc[key.toLowerCase()] = convertKeysToLowerCase(obj[key]);
        return acc;
      }, {});
    }
    return obj;
  };

  useEffect(() => {
    const fetchCliente = async () => {
      let nombre = null;
      await api
        .get("api/appweb/recuperar-datos-entidad-resumen", {
          params: { cod_entidad: dataGet.cod_cliente },
        })
        .then(({ data }) => {
          if (data.data[0]) {
            let clienteData = convertKeysToLowerCase(data.data[0]);
            (nombre = clienteData.entidad_nombre),
              setCliente({
                estado: clienteData.estado_desc,
                entidad_id: clienteData.entidad_id,
                entidad_nombre: clienteData.entidad_nombre,
                ciudad: clienteData.nombre_ciudad,
                pais: clienteData.nombre_pais,
                industria: clienteData.nom_industria_es,
                tipo: clienteData.entidad_clasificacion,
              });
          }
        })
        .catch((e) => console.error(e));
      return nombre;
    };

    if (dataGet) {
      const empleado = empleados.find((empleado) => empleado.cod_usuario === dataGet.cod_usuario);
      const empresa = empresas.find((empresa) => dataGet.cod_empresa == empresa.cod_empresa);
      const cenco = cencos.find((cenco) => dataGet.cod_cc == cenco.cod_cc);
      if (!data?.cliente) {
        console.log("-------", data?.cliente);
        fetchCliente()
          .catch(console.error)
          .then((cliente) => {
            setData({
              ...dataGet,
              cliente: cliente ? cliente : "",
              usuario: empleado ? `${empleado.nom_empleado} ${empleado.apellido_emp}` : "",
              empresa: empresa ? empresa.nombre_emp : "",
              cenco: cenco ? cenco.nombre_cc : "",
            });
          });
      }

      setEstado(proceso_oportunidad.find((estado) => estado.cod_estado === dataGet.cod_estado));
      setIndexEstadoActual(proceso_oportunidad.findIndex((estado) => estado.cod_estado === dataGet.cod_estado));
    }
  }, [dataGet, entidades, empleados, empresas, cencos, tipos]);

  const cambiarEstadoOportunidad = async (estado) => {
    if (estado.cod_estado == 31) {
      console.log("cerrar");
      setOpen(true);
      return;
    }

    await api
      .post("api/appweb/actualizar-oportunidad", {
        ...data,
        cod_estado: estado.cod_estado,
      })
      .then(({ data }) => {
        if (data.data.mensaje == "Oportunidad actualizada correctamente") {
          setEstado(estado);
          setUpdateData(updateData + 1);
        } else {
          console.error(data.data.mensaje);
        }
      })
      .catch((e) => console.error(e));
  };

  const cerrarOportunidad = async () => {
    setOpen(false);

    await api
      .post("api/appweb/actualizar-oportunidad", {
        ...data,
        cod_estado: 31,
        resultado: data?.resultado,
        fecha_fin: new Date(),
      })
      .then(({ data }) => {
        if (data.data.mensaje == "Oportunidad actualizada correctamente") {
          setEstado(31);
          setUpdateData(updateData + 1);
        } else {
          console.error(data.data.mensaje);
        }
      })
      .catch((e) => console.error(e));
  };

  const actividadCreada = (actividad) => {
    setOpenCrear(false);
    api
      .post("api/appweb/insertar-actividad-oportunidad", {
        cod_oportunidad: data.cod_oportunidad,
        cod_actividad: actividad.cod_actividad,
      })
      .then(({ data }) => {
        if (data.data.mensaje == "Actividad asignada a oportunidad correctamente") {
          setKey(key + 1);
          setUpdateData(updateData + 1);
        } else {
          console.error(data.data.mensaje);
        }
      })
      .catch((e) => console.error(e));
  };

  const inputs = useMemo(
    () => [
      {
        tipo: "textarea",
        id: "resultado",
        val: data?.resultado || null,
        label: "Resultado",
        readonly: false,
        size: 12,
      },
    ],
    [data]
  );

  return data ? (
    <Box sx={{ px: 2, m: 0 }}>
      <Box sx={{ px: 2, py: 1 }}>
        <StepperComponent
          sx={{ my: 1 }}
          estados={proceso_oportunidad}
          siguienteProps={{
            onClick: (estado) => {
              cambiarEstadoOportunidad(estado);
              setIndexEstadoActual(indexEstadoActual + 1);
            },
            disabled: !(cod_usuario == data?.cod_usuario),
            label: "Avanzar",
          }}
          anteriorProps={{
            onClick: (estado) => {
              if (indexEstadoActual > 0) {
                cambiarEstadoOportunidad(proceso_oportunidad[indexEstadoActual - 1]);
                setIndexEstadoActual(indexEstadoActual - 1);
              }
            },
            // disabled: false,
            disabled: !(cod_usuario == data?.cod_usuario),
            label: "Retroceder",
          }}
          autorizarProps={{
            onClick: () => {
              console.log("autorizarProps");
            },
            disabled: false,
            label: undefined,
          }}
          estado={estado.cod_estado}
          propiedades={{ id: "cod_estado", label: "estado_desc" }}
        />
      </Box>

      <Box sx={{ pb: 1 }}>
        <CardOportunidad oportunidad={data} />
      </Box>

      <Box sx={{ pb: 1 }}>
        <TabComponent
          tabInicial={1}
          opciones={[
            {
              id: 1,
              label: "Cliente",
              content: <Box sx={{ p: 1 }}>{cliente && <CardCliente cliente={cliente} onClick={() => console.log(cliente)} />}</Box>,
            },
            {
              id: 2,
              label: "Actividades",
              content: (
                <Box>
                  {estado.cod_estado != 31 && (
                    <Box sx={{ mb: 1, pr: 3 }} align="right">
                      <Button size="small" variant="contained" onClick={() => setOpenCrear(true)} sx={{ ml: 1 }} disabled={!(cod_usuario == data?.cod_usuario)}>
                        <Icon className="c-suma" sx={{ mr: 0.5, fontSize: 15 }} />
                        Crear Actividad
                      </Button>
                    </Box>
                  )}

                  <ListaActividades
                    key={key}
                    filtros={{
                      estado: true,
                      empresa: false,
                      cenco: false,
                      empleado: false,
                      fecha: true,
                    }}
                    cod_oportunidad={data.cod_oportunidad}
                  />
                  <DialogComponent
                    openDialog={openCrear}
                    handleClose={() => {
                      setOpenCrear(false);
                    }}
                    titulo="Crear actividad"
                    width="80vw"
                  >
                    <FormularioActividades catalogos={catalogos} onCreate={actividadCreada} />
                  </DialogComponent>
                </Box>
              ),
            },
            {
              id: 3,
              label: "Contactos",
              content: (
                <Box>
                  <TablaContactosActividad catalogos={catalogos} lista={contactos} newBtn={false} />
                </Box>
              ),
            },
          ]}
        />
      </Box>

      <DialogComponent
        openDialog={open}
        handleClose={() => setOpen(false)}
        titulo="Finalizar Oportunidad"
        children={
          <Grid sx={{ display: "flex", flexDirection: "column", px: 3, minWidth: "50vw", maxHeight: "50vh" }}>
            <Typography fontSize="1.1rem">Ingrese el resultado de la oportunidad:</Typography>
            <FormularioComponent
              inputs={inputs}
              onInput={({ id, val }) => {
                setData((inp) => ({ ...inp, [id]: val }));
              }}
              botones={{
                agregar: { visible: false, onClick: null },
                cancelar: { visible: false, onClick: null },
                guardar: { visible: true, onClick: cerrarOportunidad },
                filtrar: { visible: false, onClick: null },
              }}
            />
          </Grid>
        }
      />
    </Box>
  ) : (
    <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
      <CircularProgress />
    </Box>
  );
};
