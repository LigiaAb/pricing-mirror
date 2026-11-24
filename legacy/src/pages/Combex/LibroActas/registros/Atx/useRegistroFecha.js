import {
  useCreateCoordinacionFechaMov,
  useUpdateCoordinacionFechaMov,
  useDeleteCoordinacionFechaMov,
  useFetchCoordinacionFechaMov,
} from "../../../../../hooks/Bpm";
import { useQueryClient } from "@tanstack/react-query";

export default function useRegistroFecha(coordinacion) {
  const embarque_id = coordinacion?.embarqueId;

  const { data: fechas = [] } = useFetchCoordinacionFechaMov(
    { embarque_id },
    { enabled: !!embarque_id }
  );

  const crearFecha = useCreateCoordinacionFechaMov();
  const modificarFecha = useUpdateCoordinacionFechaMov();
  const eliminarFechaHook = useDeleteCoordinacionFechaMov();
  const queryClient = useQueryClient();

  const invalidateFechas = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ["coordinacion-fecha-mov", { embarque_id }] });
    } catch (err) {
      console.warn("Failed to invalidate coordinacion-fecha-mov:", err);
    }
  };

  const insertarFecha = async (payload) => {
    const res = await crearFecha.mutateAsync(payload);
    await invalidateFechas();
    return res;
  };

  const actualizarFecha = async (payload) => {
    const res = await modificarFecha.mutateAsync(payload);
    await invalidateFechas();
    return res;
  };

  const eliminarFecha = async (payload) => {
    const res = await eliminarFechaHook.mutateAsync(payload);
    await invalidateFechas();
    return res;
  };

  const getFechaRegistrada = (nomenclatura) =>
    (fechas || []).find((f) => {
      const target = String(nomenclatura || "").toUpperCase();
      const nomen = String(f.nomenclatura || f.NOMENCLATURA || "").toUpperCase();
      const tipoDesc = String(f.tipo_descripcion || f.TIPO_DESCRIPCION || f.tipoDescripcion || "").toUpperCase();
      const idTipo = f.id_tipo_fecha || f.ID_FECHA_TIPO || f.idTipoFecha || null;

      // Buscar por nomenclatura si existe, o por descripción del tipo que contenga la nomenclatura,
      // o por coincidencia de id cuando se pasa un número.
      if (nomen?.includes(target)) return true;
      if (tipoDesc?.includes(target)) return true;
      if (!Number.isNaN(Number(target)) && idTipo && Number(idTipo) === Number(target)) return true;
      return false;
    }) || null;

  return {
    fechas,
    getFechaRegistrada,
    insertarFecha,
    actualizarFecha,
    eliminarFecha,
    invalidateFechas,
    crearFecha,
    modificarFecha,
    eliminarFechaHook,
    queryClient,
  };
}
