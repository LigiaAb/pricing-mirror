"use client";

import { useEffect, useRef, useState } from "react";
import { type CargaRow, cloneRows, type GastoRow } from "@/features/embarques/components/cca";

export function useCcaDrafts(params: {
  normalizedCargas: CargaRow[];
  originalTarifaRows: GastoRow[];
  originalDueAgentRows: GastoRow[];
  originalDueCarrierRows: GastoRow[];
}) {
  const { normalizedCargas, originalTarifaRows, originalDueAgentRows, originalDueCarrierRows } =
    params;

  const normalizedCargasSignature = JSON.stringify(normalizedCargas);
  const originalTarifaSignature = JSON.stringify(originalTarifaRows);
  const originalDueAgentSignature = JSON.stringify(originalDueAgentRows);
  const originalDueCarrierSignature = JSON.stringify(originalDueCarrierRows);

  const [draftCargas, setDraftCargas] = useState(() => cloneRows(normalizedCargas));
  const [draftTarifas, setDraftTarifas] = useState(() => cloneRows(originalTarifaRows));
  const [draftDueAgentRows, setDraftDueAgentRows] = useState(() => cloneRows(originalDueAgentRows));
  const [draftDueCarrierRows, setDraftDueCarrierRows] = useState(() =>
    cloneRows(originalDueCarrierRows),
  );

  const previousCargasSignatureRef = useRef(normalizedCargasSignature);
  const previousTarifaSignatureRef = useRef(originalTarifaSignature);
  const previousDueAgentSignatureRef = useRef(originalDueAgentSignature);
  const previousDueCarrierSignatureRef = useRef(originalDueCarrierSignature);

  useEffect(() => {
    if (previousCargasSignatureRef.current === normalizedCargasSignature) return;
    previousCargasSignatureRef.current = normalizedCargasSignature;
    setDraftCargas(cloneRows(normalizedCargas));
  }, [normalizedCargas, normalizedCargasSignature]);

  useEffect(() => {
    if (previousTarifaSignatureRef.current === originalTarifaSignature) return;
    previousTarifaSignatureRef.current = originalTarifaSignature;
    setDraftTarifas(cloneRows(originalTarifaRows));
  }, [originalTarifaRows, originalTarifaSignature]);

  useEffect(() => {
    if (previousDueAgentSignatureRef.current === originalDueAgentSignature) return;
    previousDueAgentSignatureRef.current = originalDueAgentSignature;
    setDraftDueAgentRows(cloneRows(originalDueAgentRows));
  }, [originalDueAgentRows, originalDueAgentSignature]);

  useEffect(() => {
    if (previousDueCarrierSignatureRef.current === originalDueCarrierSignature) return;
    previousDueCarrierSignatureRef.current = originalDueCarrierSignature;
    setDraftDueCarrierRows(cloneRows(originalDueCarrierRows));
  }, [originalDueCarrierRows, originalDueCarrierSignature]);

  return {
    draftCargas,
    setDraftCargas,
    draftTarifas,
    setDraftTarifas,
    draftDueAgentRows,
    setDraftDueAgentRows,
    draftDueCarrierRows,
    setDraftDueCarrierRows,
  };
}
