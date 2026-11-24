import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../../api";

export const dataRequest = createAsyncThunk("centroCosto/dataRequest", async (_, { rejectWithValue }) => {
  try {
    const dataApi = await api.get("/api/appweb/listacentrocosto");
    const dataSetProperties = dataAddProperty(dataApi.data.data);
    const dataWithActions = editProperties(dataSetProperties, 2, { add: false, go: false, excel: false, pdf: false, download: false }, "COD_CC");

    const dataApiEmp = await api.get("/api/appweb/listaempresas");
    const arrDataEmp = dataApiEmp.data.data;
    const arrWithEmpName = setDataNewProp(dataWithActions, arrDataEmp);

    const dataApiContries = await api.get("/api/appweb/listapaises");
    const arrDataCountries = dataApiContries.data.data;
    const arrWithCountName = setDataNewCountries(arrWithEmpName, arrDataCountries);

    return arrWithCountName;
  } catch (error) {
    return rejectWithValue(error);
  }
});

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
        delete: true,
      },
      deleted: false,
    };
  });
  return dataApi;
};

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

const setDataNewProp = (arrFirst, arrSecond) => {
  return arrFirst.map((prop) => {
    const item = arrSecond.find((prop2) => {
      return prop.COD_EMPRESA_CC == prop2.cod_empresa;
    });
    return {
      ...prop,
      EMP_NAME: item.NOMBRE_EMP,
      PAIS_NAME: item.PAIS_EMP,
    };
  });
};

const setDataNewCountries = (arrFirst, arrSecond) => {
  return arrFirst.map((prop) => {
    const item = arrSecond.find((prop2) => {
      return prop2.COD_PAIS == prop.PAIS_NAME;
    });
    return {
      ...prop,
      PAIS_NAME: item.NOMBRE_PAIS,
    };
  });
};

export const centroCostoSlice = createSlice({
  name: "centro_de_costos",
  initialState: {
    datos: null,
    loading: false,
    error: null,
  },
  reducers: {
    deleteItem: (state, action) => {
      const itemId = action.payload;
      // console.log(state.datos)
      const record = state.datos.find((item) => {
        // console.log(item)

        item.COD_CC === itemId;
      });

      if (record) record.deleted = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(dataRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(dataRequest.fulfilled, (state, actions) => {
        state.loading = false;
        state.datos = actions.payload;
      })
      .addCase(dataRequest.rejected, (state, actions) => {
        state.loading = false;
        state.error = actions.payload || "ERROR DESCONOCIDO";
      });
  },
});

export default centroCostoSlice.reducer;
export const { deleteItem } = centroCostoSlice.actions;
