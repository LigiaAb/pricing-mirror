import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import GraficasPersonales from "../../../../views/EstadisiticasPersonales2/GraficasPersonales";
import { Box, Grid, Typography } from "@mui/material";
import FormularioComponent from "../../../../components/Formulario/FormularioComponent";
import { useSelector } from "react-redux";
import { api } from "../../../../api";
import LoaderComponent from "../../../../components/Loader/LoaderComponent";
import { useObtenerPermisosDeMenuActual } from "../../../../hooks/useObtenerOpcionesAcciones";

const FiltrosGraficasPersonales = () => {
  const { currentEmpresa, currentCentroCosto } = useSelector((state) => state.menu);
  const authData = useSelector((state) => state.auth);
  const { cod_usuario: usuario_default /* = cod_usuario */, json, nombre } = authData;
  const { puesto_default } = json?.configuracion || {};

  const permisosDePantallaActual = useObtenerPermisosDeMenuActual();
  const permisoPaisCC = useMemo(() => "11" in (Object.values(Object.values(permisosDePantallaActual).find((i) => i.nom_cat === "Reportes")?.opciones)[0]?.acciones || {}), [permisosDePantallaActual]);

  const [key, setKey] = useState(0);

  const [usuarios, setUsuarios] = useState([]);
  const [puestos, setPuestos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [usuariosFiltro, setUsuariosFiltro] = useState([]);

  const [filterValues, setFilterValues] = useState({
    cod_usuario: {
      id: `${puesto_default.cod_puesto} ${usuario_default}`,
      cod_usuario: usuario_default,
      nombre: `${puesto_default.puesto_desc} - ${nombre}`,
      cod_emp: puesto_default.cod_emp,
      cod_cc: puesto_default.cod_cc,
      cod_tipo_asignacion: puesto_default.cod_tipo_asignacion,
    },
    tipo_asingacion: null,
    fecha_inicio: null,
    fecha_fin: null,
    cod_emp: { id: currentEmpresa.cod_empresa, nombre: currentEmpresa.nombre_emp },
    cod_cc: { id: currentCentroCosto.cod_cc, nombre: currentCentroCosto.nombre_cc, cod_emp: currentCentroCosto.cod_emp },
    cod_puesto: null,
  });
  const [mostrarLoader, setMostrarLoader] = useState(false);

  const centrosCostoFiltrados = useMemo(() => centrosCosto.filter((i) => i.cod_emp === filterValues.cod_emp.id), [centrosCosto, filterValues.cod_emp]);

  const usuariosFiltrados = useMemo(
    () => usuariosFiltro.filter((i) => (filterValues.cod_emp ? filterValues.cod_emp.id === i.cod_emp : false)).filter((i) => (filterValues.cod_cc ? filterValues.cod_cc.id === i.cod_cc : false)),
    // .filter((i) => (filterValues.cod_puesto ? filterValues.cod_puesto.id === i.cod_puesto : false))
    [usuariosFiltro, filterValues]
  );

  const consultarEmpleadosPorPuesto = useCallback(async () => {
    await api.get("api/appweb/listaemp-usu-puesto").then(({ data }) => setUsuarios(data.data));
  }, []);
  const consultarPuesto = useCallback(async () => {
    await api.get("api/appweb/lista-puesto").then(({ data }) => setPuestos(data.data));
  }, []);
  const extractText = (element) => {
    // Si el elemento es un string o número, simplemente lo retornamos
    if (typeof element === "string" || typeof element === "number") {
      return element;
    }

    // Si el elemento es un componente React, recorremos sus hijos recursivamente
    if (React.isValidElement(element)) {
      // Recorrer los hijos del componente
      return React.Children.toArray(element.props.children)
        .map(extractText) // Llamada recursiva para extraer el texto de los hijos
        .join(""); // Unimos todo el texto extraído
    }

    // Si no es un string, número o componente React, retornamos una cadena vacía
    return "";
  };
  const darFormatoAListas = useCallback(() => {
    setMostrarLoader(true);

    const emps = [];
    const ccs = [];
    const puestos_ = [];

    const arr = usuarios
      .reduce((acc, item) => {
        if (!acc.some((i) => i.cod_usuario === item.cod_usuario)) {
          acc.push(item);
        }
        return acc;
      }, [])
      .map((i) => {
        emps.push({ id: i.cod_emp, nombre: i.nombre_emp });
        ccs.push({ id: i.cod_cc, nombre: i.nombre_cc, cod_emp: i.cod_emp });
        puestos_.push({ id: i.cod_puesto, nombre: i.puesto_desc, cod_emp: i.cod_emp, cod_cc: i.cod_cc });
        return {
          ...i,
          ...(puestos.find((p) => p.cod_puesto === i.cod_puesto) || {}),
        };
      })
      .map((i) => ({
        cod_usuario: i.cod_usuario,
        cod_emp: i.cod_emp,
        cod_cc: i.cod_cc,
        cod_tipo_asignacion: i.cod_tipo_asignacion,
        id: `${i.cod_puesto} ${i.cod_usuario}`,
        nombre: `${i.nom_empleado} ${i.apellido_emp} - ${i.puesto_desc}`,
        render_format: (
          <Grid container width="100%">
            <Grid size={5}>{`${i.nom_empleado} ${i.apellido_emp}`}</Grid>
            <Grid size={"auto"}>
              <Typography variant="caption">{i.puesto_desc}</Typography>
            </Grid>
          </Grid>
        ),
        json_puesto: undefined,
      }));

    setEmpresas(
      emps.reduce((unique, o) => {
        if (!unique.some((obj) => obj.id === o.id)) {
          unique.push(o);
        }
        return unique;
      }, [])
    );
    setCentrosCosto(
      ccs.reduce((unique, o) => {
        if (!unique.some((obj) => obj.id === o.id)) {
          unique.push(o);
        }
        return unique;
      }, [])
    );

    setUsuariosFiltro(arr);
    setMostrarLoader(false);
  }, [usuarios, puestos]);

  const realizarConsultas = useCallback(async () => {
    await Promise.all([consultarEmpleadosPorPuesto(), consultarPuesto()]);
  }, []);

  useEffect(() => {
    setKey((v) => v + 1);
  }, [filterValues]);
  useEffect(() => {
    if (usuarios.length > 0 && puestos.length > 0) {
      darFormatoAListas();
    }
  }, [usuarios, puestos]);

  useEffect(() => {
    realizarConsultas();
  }, []);

  return (
    <Box sx={{ width: "100%", p: 1 }}>
      <Grid container>
        <Grid size={12}>
          <FormularioComponent
            onInput={({ val, id }) => {
              setFilterValues((v) => {
                const obj = v;

                if (id === "cod_emp") {
                  return { ...v, cod_emp: val, cod_cc: null, cod_usuario: null };
                }
                if (id === "cod_cc") {
                  return { ...v, cod_cc: val, cod_usuario: null };
                }
                return { ...v, [id]: val };
              });
            }}
            inputs={[
              { id: "cod_emp", label: "Empresa", tipo: "select", val: filterValues.cod_emp, options: empresas, labelOption: "nombre", valueOption: "id", visible: permisoPaisCC },
              {
                id: "cod_cc",
                label: "Centros de Costo",
                tipo: "select",
                val: filterValues.cod_cc,
                readonly: !filterValues.cod_emp,
                options: centrosCostoFiltrados,
                labelOption: "nombre",
                valueOption: "id",
                visible: permisoPaisCC,
              },
              {
                id: "cod_usuario",
                label: "asesor",
                tipo: "select",
                val: filterValues.cod_usuario,
                readonly: !filterValues.cod_cc,
                options: usuariosFiltrados,
                labelOption: "nombre",
                valueOption: "id",
                renderOption: "render_format",
              },
            ]}
            botones={{ agregar: { visible: false } }}
          />
        </Grid>
        <Grid size={12}>
          {filterValues.cod_emp && filterValues.cod_cc && filterValues.cod_usuario && filterValues.cod_usuario ? (
            <GraficasPersonales
              key={key}
              cod_empresa={filterValues.cod_emp?.id || undefined}
              cod_cc={filterValues.cod_cc?.id || undefined}
              usuario={filterValues.cod_usuario?.cod_usuario || undefined}
              cod_tipo_asignacion={filterValues.cod_usuario?.cod_tipo_asignacion || undefined}
            />
          ) : null}
        </Grid>
        <Grid size={12} container>
          {/* <pre>{JSON.stringify(usuariosFiltro, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(usuarios, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(filterValues, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(filterValues, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify({ ...authData, token: undefined, permisos: undefined, json: undefined, jsonArray: undefined }, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(usuarios, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(empresas, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(centrosCosto, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(puestosFiltro, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(usuariosFiltro, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify({ currentCentroCosto }, null, 2)}</pre> */}
        </Grid>
        <LoaderComponent open={mostrarLoader} texto="ESTAMOS CARGANDO LA INFORMACIÓN DE CLIENTES" />
      </Grid>
    </Box>
  );
};

FiltrosGraficasPersonales.propTypes = {};

export default FiltrosGraficasPersonales;
