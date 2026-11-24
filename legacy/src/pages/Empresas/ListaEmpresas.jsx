import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Grid, Icon, CircularProgress, Typography } from "@mui/material";
import FormularioComponent from "../../components/Formulario/FormularioComponent";
import { api } from "../../api";
import { TablaEmpresa } from "../../views/Empresa/TablaEmpresa";

export const ListaEmpresas = () => {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const [dataCountries, setDataCountries] = useState(null);
  const [filterDataBase, setFilterDataBase] = useState(null);
  const [valores, setValores] = useState({ Paises: "" });
  const blackPage = () => navigate("../../menu/1");

  const getDataApi = async () => {
    try {
      const dataApi = await api.get("/api/appweb/listaempresas");
      const dataApiContries = await api.get("/api/appweb/listapaises");

      const dataSetProperties = dataAddProperty(dataApi.data.data);
      const dataEmp = editProperties(dataSetProperties, 4, { add: false, go: false, excel: false, pdf: false, download: false }, "cod_empresa");

      const arrDataCountries = dataApiContries.data.data;
      setDataCountries(arrDataCountries);

      const dataForTable = setDataWithCountries(dataEmp, arrDataCountries);
      setData(dataForTable);
      setFilterDataBase(dataForTable);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getDataApi();
  }, []);

  useEffect(() => {
    filterFunct();
  }, [valores]);

  const countriesValues = useMemo(() => {
    if (dataCountries)
      return dataCountries.map((item) => {
        return {
          label: item.nombre_pais,
          value: item.cod_pais,
        };
      });
  }, [dataCountries]);

  const addressValues = useMemo(() => {
    // if(data) return Array.from(new Set(data.map((item)=>item.DIRECCION_EMP)))
    if (data) {
      let i = 1;
      const noRepeatData = Array.from(new Set(data.map((item) => item.direccion_emp)));
      const addressData = noRepeatData.map((item) => {
        return {
          label: item,
          value: i++,
        };
      });
      return addressData;
    }
  }, [data]);

  const filterFunct = () => {
    if (valores.Paises !== "" && valores.Paises !== null) {
      const filterData = filterDataBase.filter((item) => {
        return item.pais_name === valores.Paises.label;
      });
      setData(filterData);
    } else if (valores.Paises !== "" && valores.Paises !== null) {
      const filterData = filterDataBase.filter((item) => {
        return item.pais_name === valores.Paises.label;
      });
      setData(filterData);
    } else {
      setData(filterDataBase);
    }
  };

  const inputs = useMemo(
    () => [
      {
        tipo: "select",
        id: "Paises",
        val: { label: "", value: "" },
        label: "Paises",
        options: countriesValues,
        multiple: false,
      },
      {
        tipo: "select",
        id: "Direcciones",
        val: { label: "", value: "" },
        label: "Direcciones",
        options: addressValues,
        multiple: false,
      },
    ],
    [valores, data]
  );

  const editProperties = (arr, id, newProperties, code) => {
    return arr.map((item) => {
      if (item[code] == id) {
        return {
          ...item,
          accionesDeTabla: {
            ...item.accionesDeTabla,
            ...newProperties,
          },
        };
      }
      return item;
    });
  };

  const setDataWithCountries = (arrEmp, arrCountry) => {
    return arrEmp.map((emp) => {
      const ps = arrCountry.find((cnt) => {
        return cnt.cod_pais == emp.pais_emp;
      });

      return {
        ...emp,
        pais_name: ps.nombre_pais,
      };
    });
  };

  const dataAddProperty = (arrData) => {
    const dataApi = arrData.map((item) => {
      return {
        ...item,
        accionesDeTabla: {
          add: false,
          view: true,
          go: false,
          copy: false,
          paste: false,
          auth: false,
          edit: true,
          excel: false,
          pdf: false,
          download: false,
          delete: false,
        },
        deleted: false,
      };
    });
    return dataApi;
  };

  return data ? (
    <Box sx={{ p: 1, m: 0 }}>
      <Button color="primary" onClick={blackPage}>
        <Icon className="c-derecha-arriba-izquierda" />
        Regresar al menu
      </Button>
      <Box sx={{ paddingLeft: 2, paddingTop: 2 }}>
        <Typography variant="h6">EMPRESAS</Typography>
      </Box>
      <Grid sx={{ p: 1, m: 0, my: 1 }}>
        <Grid container columns={{ xs: 4, md: 8 }}>
          <Grid size="grow">
            <FormularioComponent
              inputs={inputs}
              onInput={({ id, val }) => {
                setValores((inp) => ({ ...inp, [id]: val }));
              }}
              botones={{
                agregar: { visible: false, onClick: null },
                cancelar: { visible: false, onClick: null },
                guardar: { visible: false, onClick: null },
                filtrar: { visible: false, onClick: null },
              }}
            />
          </Grid>
        </Grid>
      </Grid>
      <TablaEmpresa reDirect={true} dataApi={data} viewBtn={true} />
    </Box>
  ) : (
    <Box sx={{ display: "flex", width: "90vw", height: "85vh", justifyContent: "center", alignItems: "center", color: "primary" }}>
      <CircularProgress />
    </Box>
  );
};
