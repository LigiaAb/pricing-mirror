"use client";

import { FileDown, Pencil } from "lucide-react";
import { useState } from "react";
import { useCoordinacion, useCoordinacionCargas } from "@/features/coordinaciones";
import { useFetchGuiasCoordinacion } from "@/features/correlativos";
import {
  CargasCorrectionDialog,
  CargasDetailDialog,
  cloneRows,
  DisplayValue,
  GastosCorrectionDialog,
  getRowByPayment,
  normalizeCargaRow,
  normalizeGastoRow,
  numbersEqual,
  PAYMENT_CONFIG,
  sumByPayment,
  sumField,
  TarifaCorrectionDialog,
  toDisplayValue,
} from "@/features/embarques/components/cca";
import { useEmbarqueContext } from "@/features/embarques/components/context/embarque-context";
import pdfCca from "@/features/embarques/lib/pdf-cca";
import {
  useListarCoordinacionGastos,
  useObtenerUltimaVersionCoordinacionGastos,
} from "@/features/gastos";
import { BannerInformativo } from "@/shared/components/banner-informativo";
import { Button } from "@/shared/components/ui/button";
import { formatearFecha } from "@/shared/lib/date";
import { logger } from "@/shared/lib/logger";
import { asText } from "@/shared/lib/text";
import { computeFleteAndIva, computePaymentCorrections } from "./cca-corrections";
import { buildCcaPdfData } from "./cca-pdf-data";
import { useCcaDrafts } from "./use-cca-drafts";

const FLETE_RUBRO = 11;
const IVA_RUBRO = 133;
const DUE_AGENT_ENTITY_ID = 13624;

const baseFields = [
  { id: "tarifa", label: "Tarifa" },
  { id: "flete", label: "Flete" },
  { id: "iva", label: "IVA" },
  { id: "dueAgent", label: "Due Agent" },
  { id: "dueCarrier", label: "Due Carrier" },
];

export function CcaSection() {
  const { embarque_id } = useEmbarqueContext();

  const { data: embarqueData = null } = useCoordinacion(embarque_id ?? undefined);
  const { data: cargas = [] } = useCoordinacionCargas(
    embarque_id ? String(embarque_id) : undefined,
  );

  const { data: versionData } = useObtenerUltimaVersionCoordinacionGastos(embarque_id ?? undefined);
  const embarqueVersion = versionData?.embarque_version ?? null;

  const gastosParams = {
    embarque_id: Number(embarque_id) || 0,
    embarque_version: Number(embarqueVersion) || 0,
    enabled: Boolean(embarque_id && versionData),
  };

  const { data: gastos = [] } = useListarCoordinacionGastos(gastosParams);

  const { data: guiasData = [] } = useFetchGuiasCoordinacion(
    { embarque_id: Number(embarque_id) },
    { enabled: Boolean(embarque_id) },
  );
  const correlativoGuia = guiasData[0]?.correlativoGuia ?? "";
  const [cargasDetailOpen, setCargasDetailOpen] = useState(false);
  const [cargasCorrectionOpen, setCargasCorrectionOpen] = useState(false);
  const [tarifaCorrectionOpen, setTarifaCorrectionOpen] = useState(false);
  const [dueAgentCorrectionOpen, setDueAgentCorrectionOpen] = useState(false);
  const [dueCarrierCorrectionOpen, setDueCarrierCorrectionOpen] = useState(false);

  const normalizedCargas = cargas.map((carga, index) => normalizeCargaRow(carga, index));

  const normalizedGastos = gastos.map((gasto, index) => normalizeGastoRow(gasto, index));

  const originalTarifaRows = normalizedGastos.filter((row) => Number(row.codRubro) === FLETE_RUBRO);

  const originalIvaRows = normalizedGastos.filter((row) => Number(row.codRubro) === IVA_RUBRO);

  const originalDueAgentRows = normalizedGastos.filter(
    (row) => Number(row.entidadId) === DUE_AGENT_ENTITY_ID,
  );

  const originalDueCarrierRows = normalizedGastos.filter(
    (row) =>
      Number(row.entidadId) !== DUE_AGENT_ENTITY_ID &&
      Number(row.codRubro) !== FLETE_RUBRO &&
      Number(row.codRubro) !== IVA_RUBRO,
  );

  const {
    draftCargas,
    setDraftCargas,
    draftTarifas,
    setDraftTarifas,
    draftDueAgentRows,
    setDraftDueAgentRows,
    draftDueCarrierRows,
    setDraftDueCarrierRows,
  } = useCcaDrafts({
    normalizedCargas,
    originalTarifaRows,
    originalDueAgentRows,
    originalDueCarrierRows,
  });

  const originalCargoTotals = {
    bultos: sumField(normalizedCargas, "bultos"),
    peso: sumField(normalizedCargas, "cw"),
  };

  const draftCargoTotals = {
    bultos: sumField(draftCargas, "bultos"),
    peso: sumField(draftCargas, "cw"),
  };

  const originalValues = (() => {
    const values: Record<string, unknown> = {
      bultos: toDisplayValue(originalCargoTotals.bultos, { blankIfZero: true }),
      peso: toDisplayValue(originalCargoTotals.peso, { blankIfZero: true }),
      prepaid: {},
      collect: {},
    };

    for (const { key, codTipo } of PAYMENT_CONFIG) {
      const tarifaRow = getRowByPayment(originalTarifaRows, codTipo);
      const ivaRow = getRowByPayment(originalIvaRows, codTipo);

      (values[key] as Record<string, string>) = {
        tarifa: toDisplayValue(tarifaRow?.rateCosto),
        flete: toDisplayValue(tarifaRow?.costoRubro),
        iva: toDisplayValue(ivaRow?.costoRubro),
        dueAgent: toDisplayValue(sumByPayment(originalDueAgentRows, codTipo, "ventaRubro"), {
          blankIfZero: true,
        }),
        dueCarrier: toDisplayValue(sumByPayment(originalDueCarrierRows, codTipo, "ventaRubro"), {
          blankIfZero: true,
        }),
      };
    }

    return values;
  })();

  const correctionValues = (() => {
    const values: Record<string, unknown> = {
      shared: { bultos: "", peso: "" },
      prepaid: {},
      collect: {},
    };

    const bultosUnchanged = numbersEqual(originalCargoTotals.bultos, draftCargoTotals.bultos);
    const pesoUnchanged = numbersEqual(originalCargoTotals.peso, draftCargoTotals.peso);
    const bultosChanged = !bultosUnchanged;
    const pesoChanged = !pesoUnchanged;

    if (bultosChanged) {
      (values.shared as Record<string, string>).bultos = toDisplayValue(draftCargoTotals.bultos);
    }
    if (pesoChanged) {
      (values.shared as Record<string, string>).peso = toDisplayValue(draftCargoTotals.peso);
    }

    computePaymentCorrections(values, {
      originalTarifaRows,
      draftTarifas,
      originalDueAgentRows,
      draftDueAgentRows,
      originalDueCarrierRows,
      draftDueCarrierRows,
    });

    const effectivePeso = pesoChanged ? draftCargoTotals.peso : originalCargoTotals.peso;

    computeFleteAndIva(values, effectivePeso, bultosChanged, pesoChanged, {
      originalValues,
      originalIvaRows,
    });

    return values;
  })();

  const handleDescargarPdf = async () => {
    const today = formatearFecha(new Date());
    const raw = embarqueData as Record<string, unknown> | null | undefined;

    const pdfData = buildCcaPdfData({
      today,
      correlativoGuia,
      embarqueData: raw,
      originalValues,
      correctionValues,
    });

    const pdfBlob = await pdfCca(pdfData as never);
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const previewTab = window.open("about:blank", "_blank");

    if (previewTab) {
      previewTab.location.replace(pdfUrl);
    } else {
      window.open(pdfUrl, "_blank");
    }

    setTimeout(() => {
      try {
        URL.revokeObjectURL(pdfUrl);
      } catch (error) {
        logger.error("Error liberando URL del PDF:", error);
      }
    }, 10000);
  };

  return (
    <>
      <div className="mx-auto flex w-[70%] flex-col gap-2">
        <BannerInformativo
          severidad="info"
          titulo="Correcciones temporales"
          mensaje="Ingrese los valores a corregir en icono editar."
        />

        <div className="grid grid-cols-[220px_2fr_2fr_56px] items-center gap-2">
          <span className="text-sm font-semibold">Descripcion</span>
          <span className="text-center text-sm font-semibold">Original</span>
          <span className="text-center text-sm font-semibold">Correccion</span>
          <span className="text-center text-sm font-semibold">Accion</span>

          <span>No. Bultos</span>
          <button
            type="button"
            className="cursor-pointer"
            onClick={() => setCargasDetailOpen(true)}
          >
            <DisplayValue value={asText(originalValues.bultos)} />
          </button>
          <DisplayValue value={(correctionValues.shared as Record<string, string>)?.bultos ?? ""} />
          <div className="flex items-center justify-center">
            <Button
              size="icon"
              variant="ghost"
              aria-label="Editar bultos"
              title="Editar bultos"
              className="h-8 w-8"
              onClick={() => setCargasCorrectionOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>

          <span>CW en Kilos</span>
          <button
            type="button"
            className="cursor-pointer"
            onClick={() => setCargasDetailOpen(true)}
          >
            <DisplayValue value={asText(originalValues.peso)} />
          </button>
          <DisplayValue value={(correctionValues.shared as Record<string, string>)?.peso ?? ""} />
          <div className="flex items-center justify-center">
            <Button
              size="icon"
              variant="ghost"
              aria-label="Editar CW en kilos"
              title="Editar CW en kilos"
              className="h-8 w-8"
              onClick={() => setCargasCorrectionOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-[220px_repeat(4,1fr)_56px] items-center gap-2">
          <div />
          <span className="col-span-2 text-center text-lg font-semibold">Original</span>
          <span className="col-span-2 text-center text-lg font-semibold">Correccion</span>
          <div />

          <span className="font-semibold">Descripcion</span>
          <span className="text-center font-semibold">PREPAID</span>
          <span className="text-center font-semibold">COLLECT</span>
          <span className="text-center font-semibold">PREPAID</span>
          <span className="text-center font-semibold">COLLECT</span>
          <span className="text-center font-semibold">Accion</span>

          {baseFields.map((field) => {
            const origPrepaid =
              (originalValues.prepaid as Record<string, string>)?.[field.id] ?? "";
            const origCollect =
              (originalValues.collect as Record<string, string>)?.[field.id] ?? "";
            const corrPrepaid =
              (correctionValues.prepaid as Record<string, string>)?.[field.id] ?? "";
            const corrCollect =
              (correctionValues.collect as Record<string, string>)?.[field.id] ?? "";

            return (
              <div key={field.id} className="contents">
                <span>{field.label}</span>
                <DisplayValue value={origPrepaid} />
                <DisplayValue value={origCollect} />
                <DisplayValue value={corrPrepaid} />
                <DisplayValue value={corrCollect} />
                <div className="flex items-center justify-center">
                  {field.id === "tarifa" && draftTarifas.length > 0 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Editar tarifa"
                      title="Editar tarifa"
                      className="h-8 w-8"
                      onClick={() => setTarifaCorrectionOpen(true)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {field.id === "dueAgent" && draftDueAgentRows.length > 0 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Editar Due Agent"
                      title="Editar Due Agent"
                      className="h-8 w-8"
                      onClick={() => setDueAgentCorrectionOpen(true)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {field.id === "dueCarrier" && draftDueCarrierRows.length > 0 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Editar Due Carrier"
                      title="Editar Due Carrier"
                      className="h-8 w-8"
                      onClick={() => setDueCarrierCorrectionOpen(true)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button variant="default" onClick={handleDescargarPdf}>
            <FileDown className="mr-1 h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

      <CargasDetailDialog
        open={cargasDetailOpen}
        onClose={() => setCargasDetailOpen(false)}
        embarqueId={embarque_id}
      />

      <CargasCorrectionDialog
        open={cargasCorrectionOpen}
        rows={draftCargas as never}
        onClose={() => setCargasCorrectionOpen(false)}
        onAccept={(rows) => {
          setDraftCargas(cloneRows(rows as never));
          setCargasCorrectionOpen(false);
        }}
      />

      <TarifaCorrectionDialog
        open={tarifaCorrectionOpen}
        rows={draftTarifas as never}
        onClose={() => setTarifaCorrectionOpen(false)}
        onAccept={(rows) => {
          setDraftTarifas(cloneRows(rows as never));
          setTarifaCorrectionOpen(false);
        }}
      />

      <GastosCorrectionDialog
        open={dueAgentCorrectionOpen}
        title="Due Agent"
        dialogClassName="max-w-4xl"
        rows={draftDueAgentRows as never}
        onClose={() => setDueAgentCorrectionOpen(false)}
        onAccept={(rows) => {
          setDraftDueAgentRows(cloneRows(rows as never));
          setDueAgentCorrectionOpen(false);
        }}
      />

      <GastosCorrectionDialog
        open={dueCarrierCorrectionOpen}
        title="Due Carrier"
        rows={draftDueCarrierRows as never}
        onClose={() => setDueCarrierCorrectionOpen(false)}
        onAccept={(rows) => {
          setDraftDueCarrierRows(cloneRows(rows as never));
          setDueCarrierCorrectionOpen(false);
        }}
      />
    </>
  );
}
