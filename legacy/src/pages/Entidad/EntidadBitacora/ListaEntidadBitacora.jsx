import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { api } from "../../../api";
import { Box, Grid } from "@mui/material";
import FormularioComponent from "../../../components/Formulario/FormularioComponent";
import TablaDetallesComponent from "../../../components/Tabla/TablaDetallesComponent";
import moment from "moment";

const ListaEntidadBitacora = (props) => {
  let { tipo, entidad_id, entidad, obtenerFilaSeleccionada } = props;
  const [datos, setDatos] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [pais, setPais] = useState([]);
  const [ciudad, setCiudad] = useState([]);
  const [industria, setIndustria] = useState([]);
  const [tipos, setTipo] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [centrosCosto, setCentrosCosto] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [tipoTabla, setTipoTabla] = useState({ label: "ENTIDAD", value: "ENTIDAD" });
  const [tipoTablaFiltro, setTipoTablaFiltro] = useState({ label: "ENTIDAD", value: "ENTIDAD" });

  const inputs = useMemo(
    () => [
      {
        id: "tipo",
        tipo: "select",
        options: [
          { value: "ENTIDAD", label: "ENTIDAD" },
          { value: "ENTIDAD_NOMBRE", label: "NOMBRE" },
          { value: "ENTIDAD_CONTACTO", label: "CONTACTO" },
          { value: "ENTIDAD_DIRECCION", label: "DIRECCION" },
          { value: "ENTIDAD_IDENTIFICACION", label: "IDENTIFICACION" },
          { value: "ENTIDAD_PAIS", label: "PAIS" },
        ],
        valueOption: "value",
        labelOption: "label",
        val: tipoTabla,
      },
    ],
    [tipoTabla],
  );

  const convertToUpper = useCallback((obj) => {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => convertToUpper(item));
    }
    const newobj = {};
    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      if (typeof value === "object" && !(value instanceof Date) && value !== null) {
        newobj[key.toUpperCase()] = convertToUpper(value);
      } else {
        newobj[key.toUpperCase()] = value;
      }
    });
    return newobj;
  }, []);

  const formatoCambios = useCallback(
    (d) => {
      const data = convertToUpper(d);

      switch (tipoTablaFiltro.value) {
        case "ENTIDAD": {
          const pais_encontrado = convertToUpper(pais.find((p) => p.cod_pais === (data.PAIS_ID || data.COD_PAIS)));
          const ciudad_encontrado = convertToUpper(ciudad.find((c) => c.cod_ciudad == (data.CIUDAD_ID || data.COD_CIUDAD)));
          const industria_encontrado = convertToUpper(industria.find((i) => i.cod_industria === (data.INDUSTRIA_ID || data.COD_INDUSTRIA)));
          const tipo_encontrado = convertToUpper(tipos.find((i) => i.cod_tipo === (data.TIPO_ID || data.COD_TIPO)));

          const dd = convertToUpper({ ...data, ...pais_encontrado, ...ciudad_encontrado, ...industria_encontrado, ...tipo_encontrado });

          return `ID:\t${dd.ENTIDAD_ID || ""}
TIPO:\t${dd.NOM_TIPO || ""}
NOMBRE:\t${dd.ENTIDAD_NOMBRE || ""}
PAIS:\t${dd?.NOMBRE_PAIS || ""}
CIUDAD:\t${dd.NOMBRE_CIUDAD || ""}
INDUS.:\t${dd.NOM_INDUSTRIA_ES || ""}`;
        }

        case "ENTIDAD_NOMBRE": {
          const pais_encontrado = convertToUpper(pais.find((p) => p.cod_pais === (data.PAIS_ID || data.COD_PAIS)));
          const tipo_encontrado = convertToUpper(tipos.find((i) => i.cod_tipo === (data.TIPO_ID || data.COD_TIPO)));

          const dd = { ...data, ...pais_encontrado, ...tipo_encontrado };

          return `ID:\t${dd.ENTIDAD_ID || ""}
TIPO:\t${dd.NOM_TIPO || ""}
NOMBRE:\t${dd.ENTIDADNOMBRE_NOMBRE || ""}
PAIS:\t${dd?.NOMBRE_PAIS || ""}`;
        }

        case "ENTIDAD_CONTACTO": {
          const pais_encontrado = convertToUpper(pais.find((p) => p.cod_pais === (data.PAIS_ID || data.COD_PAIS)));
          const tipo_encontrado = data.LISTA_COD_TIPO?.map((item) => convertToUpper(tipos.find((i) => i.cod_tipo === Number(item))))
            .map((i) => i?.NOM_TIPO || "")
            .join(", ");
          const cc_encontrado = convertToUpper(centrosCosto.find((i) => i.cod_cc === data.COD_CC));
          const emp_encontrado = convertToUpper(empresas.find((i) => i.cod_empresa === data.COD_EMP));

          const dd = convertToUpper({ ...data, ...pais_encontrado, tipo_encontrado, ...emp_encontrado, ...cc_encontrado });

          console.log(dd);

          return `${
            dd.ENTIDADCONTACTO_ID
              ? `ID:\t${dd.ENTIDADCONTACTO_ID || ""}
`
              : ""
          }TIPO:\t${dd.tipo_encontrado || ""}
NOMBRE:\t${dd.ENTIDADCONTACTO_NOMBRE || ""}
EMAIL:\t${dd?.ENTIDADCONTACTO_EMAIL || ""}
TEL.:\t${dd.ENTIDADCONTACTO_TELEFONO || ""}
EMPRESA:\t${dd.NOMBRE_EMP || ""}
CENTRO COSTO:\t${dd.NOMBRE_CC || ""}`;
        }

        case "ENTIDAD_DIRECCION": {
          const pais_encontrado = convertToUpper(pais.find((p) => p.cod_pais === (data.PAIS_ID || data.COD_PAIS)));
          const tipo_encontrado = convertToUpper(tipos.find((i) => i.cod_tipo === (data.TIPO_ID || data.COD_TIPO)));
          const depto_encontrado = convertToUpper(departamentos.find((i) => i.cod_depto === data.COD_DEPTO));
          const muni_encontrado = convertToUpper(municipios.find((i) => i.cod_muni === data.COD_MUNI));

          const dd = { ...data, ...pais_encontrado, ...tipo_encontrado, ...depto_encontrado, ...muni_encontrado };

          return `ID:\t${dd.ENTIDADDIRECCION_ID || ""}
TIPO:\t${dd.NOM_TIPO || ""}
DIR.:\t${dd.ENTIDADDIRECCION_DIRECCION}
ZONA:\t${dd.ENTIDADDIRECCION_ZONA || ""}
KM.: \t${dd.ENTIDADDIRECCION_KM || ""}
PAIS:\t${dd.NOMBRE_PAIS || ""}
DEPTO:\t${dd.NOMBRE_DEPTO || ""}
MUNI:\t${dd.COD_MUNI || ""}
`;
        }

        case "ENTIDAD_IDENTIFICACION": {
          const pais_encontrado = convertToUpper(pais.find((p) => p.cod_pais === (data.PAIS_ID || data.COD_PAIS)));
          const tipo_encontrado = convertToUpper(tipos.find((i) => i.cod_tipo === (data.TIPO_ID || data.COD_TIPO)));
          const depto_encontrado = convertToUpper(departamentos.find((i) => i.cod_depto === data.COD_DEPTO));
          const muni_encontrado = convertToUpper(municipios.find((i) => i.cod_muni === data.COD_MUNI));

          const dd = { ...data, ...pais_encontrado, ...tipo_encontrado, ...depto_encontrado, ...muni_encontrado };

          return `
ID:\t${dd.ENTIDAD_ID || ""}
TIPO:\t${dd.NOM_TIPO || ""}
NUMERO:\t${dd.ENTIDADIDENTIFICACIO_NUMERO || ""}
ARCHIVO:${dd.ENTIDADIDENTIFICACION_RUTA || ""}
`;
        }

        case "ENTIDAD_PAIS": {
          const pais_encontrado = convertToUpper(pais.find((p) => p.cod_pais === (data.PAIS_ID || data.COD_PAIS)));

          const dd = { ...data, ...pais_encontrado };

          return `
ID:\t${dd.ENTIDAD_ID || ""}
TIPO:\t${dd.NOM_TIPO || ""}
PAIS:\t${dd.NOMBRE_PAIS || ""}
`;
        }

        default:
          return JSON.stringify(d, null, 2);
      }
    },
    [centrosCosto, ciudad, convertToUpper, departamentos, empresas, industria, municipios, pais, tipoTablaFiltro?.value, tipos],
  );

  const listaDatosProcesada = useMemo(
    () =>
      datos.map((i) => {
        const usuario = empleados.find((e) => i.usuario_id === e.cod_usuario);
        return {
          ...i,
          fecha: moment(i.entidadbitacora_fecha).format("DD-MM-YYYY HH:mm:ss"),
          accion: i.entidadbitacora_accion === "C" ? "Creación" : "Actualización",
          ultimo_estado: JSON.parse(i.data_ultimo_estado),
          estado_json: formatoCambios(JSON.parse(i.data_ultimo_estado)), // JSON.stringify(JSON.parse(i.data_ultimo_estado), null, 2),
          nombre: `${usuario?.nom_empleado} ${usuario?.apellido_emp}`,
          ...usuario,
        };
      }),
    [datos, empleados, formatoCambios],
  );

  // Obtener los datos del crud
  const obtenerDatos = useCallback(async () => {
    setDatos([]);
    await api.get("api/appweb/lista-entidad-bitacora", { params: { entidad_id, entidadbitacora_tabla: tipoTablaFiltro.value } }).then(async ({ data }) => {
      setDatos(data.data.data);
    });
  }, [entidad_id, tipoTablaFiltro]);
  const obtenerUsuarios = useCallback(async () => {
    await api.get("api/appweb/listaemp-usu-puesto").then(async ({ data }) => {
      setEmpleados(data.data);
    });
  }, []);
  const obtenerPais = useCallback(async () => {
    await api.get("api/appweb/listapaises").then(async ({ data }) => {
      setPais(data.data);
    });
  }, []);
  const obtenerCiudad = useCallback(async () => {
    await api.get("api/appweb/lista-ciudad").then(async ({ data }) => {
      setCiudad(data.data);
    });
  }, []);
  const obtenerIndustria = useCallback(async () => {
    await api.get("api/appweb/lista-industria").then(async ({ data }) => {
      setIndustria(data.data);
    });
  }, []);
  const obtenerTipo = useCallback(async () => {
    await api.get("api/appweb/lista-tipo").then(async ({ data }) => {
      setTipo(data.data);
    });
  }, []);
  const obtenerEmpresa = useCallback(async () => {
    await api.get("api/appweb/listaempresas").then(async ({ data }) => {
      setEmpresas(data.data);
    });
  }, []);
  const obtenerCentroCosto = useCallback(async () => {
    await api.get("api/appweb/listacentrocosto").then(async ({ data }) => {
      setCentrosCosto(data.data);
    });
  }, []);
  const obtenerDepartamentos = useCallback(async () => {
    await api.get("api/appweb/lista-depto-x-pais").then(async ({ data }) => {
      setDepartamentos(data.data);
    });
  }, []);
  const obtenerMunicipio = useCallback(async () => {
    await api.get("api/appweb/lista-municipios").then(async ({ data }) => {
      setMunicipios(data.data);
    });
  }, []);

  const hacerConsultas = useCallback(async () => {
    await Promise.all([
      obtenerDatos(),
      obtenerUsuarios(),
      obtenerPais(),
      obtenerCiudad(),
      obtenerIndustria(),
      obtenerTipo(),
      obtenerEmpresa(),
      obtenerCentroCosto(),
      obtenerDepartamentos(),
      obtenerMunicipio(),
    ]);
  }, [obtenerDatos, obtenerUsuarios, obtenerPais, obtenerCiudad, obtenerIndustria, obtenerTipo, obtenerEmpresa, obtenerCentroCosto, obtenerDepartamentos, obtenerMunicipio]);

  useEffect(() => {
    hacerConsultas();
  }, [hacerConsultas]);

  return (
    <Box>
      <Grid container>
        <Grid width={"100%"}>
          <FormularioComponent
            inputs={inputs}
            onInput={(val) => setTipoTabla(val ? val.val : undefined)}
            botones={{ agregar: { visible: false }, filtrar: { visible: true, onClick: () => setTipoTablaFiltro(tipoTabla) } }}
          />
        </Grid>
        <Grid width={"100%"}>
          <TablaDetallesComponent
            id="entidadbitacora_id"
            data={listaDatosProcesada}
            height={300}
            columnas={[
              { label: "Nombre", column: "entidad_nombre" },
              { label: "Usuario", color: "accent.main", column: "nombre" },
              { label: "Cambio", column: "estado_json", pre: true },
              { align: "center", color: "success.main", label: "Acción", column: "accion" },
              { align: "center", color: "accent.main", label: "Fecha", column: "fecha" },
            ]}
          />
        </Grid>
        <Grid container direction="row">
          {/* <pre>{JSON.stringify(listaDatosProcesada, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(datos, null, 2)}</pre> */}
          {/* <pre>{JSON.stringify(empleados, null, 2)}</pre> */}
        </Grid>
      </Grid>
    </Box>
  );
};

ListaEntidadBitacora.propTypes = {
  // ELEMENTO
  tipo: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  entidad_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  entidad: PropTypes.object,
  obtenerFilaSeleccionada: PropTypes.func,
};

export default ListaEntidadBitacora;
