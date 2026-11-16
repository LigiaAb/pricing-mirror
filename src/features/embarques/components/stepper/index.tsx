"use client";

import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle,
  ChevronsRight,
  Clock,
  DollarSign,
  FileCheck,
  FileText,
  Info,
  Package,
  Receipt,
  Route,
  User,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";

const DEFAULT_ICONS: Record<string, keyof typeof ICON_MAP> = {
  Shipper: "User",
  Consignatario: "User",
  Notificacion: "Bell",
  Producto: "Package",
  Facturacion: "FileText",
  Detalles: "Info",
  Gastos: "DollarSign",
  Documentos: "FileCheck",
  Rutas: "Route",
  Fechas: "Calendar",
  Seguimiento: "ChevronsRight",
};

const ICON_MAP = {
  User,
  Bell,
  Package,
  FileText,
  Receipt,
  Info,
  DollarSign,
  FileCheck,
  Route,
  Calendar,
  ChevronsRight,
};

type StepValidityValue =
  | true
  | "valid"
  | "warning"
  | "pending"
  | "incomplete"
  | "pre-cliente"
  | null;

export interface StepItem {
  label: string;
  icon?: string;
  info?: string;
  optional?: boolean;
}

export interface StepperNavProps {
  readonly steps?: (string | StepItem)[];
  readonly activeStep?: number;
  readonly stepValidity?: Record<number, StepValidityValue>;
  readonly onStepClick?: (index: number) => void;
  readonly pendingCounts?: Record<number, number>;
}

function resolveColors({
  isActive,
  isComplete,
  isWarning,
  isPending,
  isIncomplete,
  isOptional,
  isPreCliente,
}: {
  isActive: boolean;
  isComplete: boolean;
  isWarning: boolean;
  isPending: boolean;
  isIncomplete: boolean;
  isOptional: boolean;
  isPreCliente: boolean;
}) {
  const needsWarning = isWarning || isPending || isIncomplete;

  if (isOptional) {
    if (isActive)
      return { bg: "bg-muted/60", fg: "text-muted-foreground", borderColor: "border-transparent" };
    return { bg: "bg-transparent", fg: "text-muted-foreground", borderColor: "border-transparent" };
  }

  if (isActive) {
    if (isComplete)
      return { bg: "bg-emerald-500/10", fg: "text-emerald-500", borderColor: "border-emerald-500" };
    if (isPreCliente)
      return {
        bg: "bg-destructive/10",
        fg: "text-destructive",
        borderColor: "border-destructive/40",
      };
    if (needsWarning)
      return { bg: "bg-amber-500/10", fg: "text-amber-500", borderColor: "border-amber-500" };
    return { bg: "bg-primary/10", fg: "text-primary", borderColor: "border-primary" };
  }

  if (isComplete)
    return { bg: "bg-emerald-500/10", fg: "text-emerald-500", borderColor: "border-transparent" };
  if (isPreCliente)
    return { bg: "bg-destructive/10", fg: "text-destructive", borderColor: "border-transparent" };
  if (needsWarning)
    return { bg: "bg-amber-500/10", fg: "text-amber-500", borderColor: "border-transparent" };
  return { bg: "bg-transparent", fg: "text-muted-foreground", borderColor: "border-transparent" };
}

function buildTooltipText(
  step: StepItem,
  pending: number,
  isIncomplete: boolean,
  isPending: boolean,
) {
  if (step.info) return step.info;
  if (pending > 0) {
    const plural = pending > 1 ? "s" : "";
    return `Faltan ${pending} campo${plural}`;
  }
  if (isPending) return "Datos completos pero no guardados";
  if (isIncomplete) return "Faltan campos obligatorios";
  return "";
}

function resolveFontWeight(
  isActive: boolean,
  isComplete: boolean,
  isIncomplete: boolean,
  isPending: boolean,
) {
  if (isActive) return 700;
  if (isComplete) return 600;
  if (isIncomplete) return 600;
  if (isPending) return 600;
  return 500;
}

function StatusIndicator({
  isComplete,
  isWarning,
  isPending,
  isIncomplete,
  isPreCliente,
}: {
  readonly isComplete: boolean;
  readonly isWarning: boolean;
  readonly isPending: boolean;
  readonly isIncomplete: boolean;
  readonly isPreCliente: boolean;
}) {
  if (isComplete) {
    return <CheckCircle className="size-3 text-emerald-500 ml-1 shrink-0" />;
  }
  if (isPending) {
    return <Clock className="size-3 text-amber-500 ml-1 shrink-0" />;
  }
  if (isPreCliente) {
    return <AlertTriangle className="size-3 text-destructive ml-1 shrink-0" />;
  }
  if (isWarning || isIncomplete) {
    return <AlertTriangle className="size-3 text-amber-500 ml-1 shrink-0" />;
  }
  return null;
}

function StepItemComponent({
  step,
  index,
  isActive,
  stepValidity,
  pendingCount,
  onStepClick,
}: {
  readonly step: StepItem;
  readonly index: number;
  readonly isActive: boolean;
  readonly stepValidity: Record<number, StepValidityValue>;
  readonly pendingCount: number;
  readonly onStepClick: ((index: number) => void) | undefined;
}) {
  const validity = stepValidity[index];
  const isComplete = validity === true || validity === "valid";
  const isWarning = validity === "warning";
  const isPending = validity === "pending";
  const isPreCliente = validity === "pre-cliente";
  const isIncomplete = !isComplete && !isWarning && !isPending && !isPreCliente;
  // G20: "Rutas" es el paso opcional (no bloquea "Crear Coordinación", ver
  // STEPS_NO_BLOQUEANTES), no "Fechas" — paridad StepperNav.jsx.
  const isOptional = Boolean(
    step.optional ||
      step.label.toLowerCase() === "seguimiento" ||
      step.label.toLowerCase() === "cca" ||
      step.label.toLowerCase() === "rutas",
  );
  const pending = pendingCount;
  const { bg, fg, borderColor } = resolveColors({
    isActive,
    isComplete,
    isWarning,
    isPending,
    isIncomplete,
    isOptional,
    isPreCliente,
  });
  const tooltipText = buildTooltipText(step, pending, isIncomplete, isPending);

  const IconComponent = ICON_MAP[(step.icon as keyof typeof ICON_MAP) || "Info"] || Info;

  const content = (
    <div
      role="tab"
      aria-selected={isActive}
      tabIndex={0}
      onClick={() => onStepClick?.(index)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onStepClick?.(index);
        }
      }}
      className={cn(
        "flex items-center gap-2 px-1.5 py-2 rounded-lg cursor-pointer select-none border-2 transition-all duration-200",
        bg,
        borderColor,
        !isActive && "hover:bg-primary/5 hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      )}
    >
      <Badge variant="destructive" className={cn("relative", pending > 0 ? "" : "invisible")}>
        <div
          className={cn(
            "size-6 rounded-full flex items-center justify-center transition-all duration-200 shrink-0",
            isActive ? fg : cn("bg-muted", fg),
          )}
        >
          <IconComponent className="size-3" />
        </div>
        {Math.max(pending, 0)}
      </Badge>

      <div className="flex flex-col min-w-0">
        <span
          className={cn(
            "text-xs leading-[1.2] whitespace-nowrap transition-all duration-200",
            isActive && "tracking-wide",
          )}
          style={{ fontWeight: resolveFontWeight(isActive, isComplete, isIncomplete, isPending) }}
        >
          {step.label}
        </span>
        {pending > 0 && !isComplete && (
          <span className="text-xs text-destructive leading-[1.1] whitespace-nowrap">
            {pending} pendiente{pending > 1 ? "s" : ""}
          </span>
        )}
        {isPending && (
          <span className="text-xs text-foreground leading-[1.1] whitespace-nowrap font-semibold">
            Sin guardar
          </span>
        )}
        {isIncomplete && pending === 0 && !isOptional && (
          <span className="text-xs text-foreground leading-[1.1] whitespace-nowrap font-semibold">
            Faltan campos
          </span>
        )}
        {isPreCliente && (
          <span className="text-xs text-destructive leading-[1.1] whitespace-nowrap font-semibold">
            aún es Pre-Cliente
          </span>
        )}
      </div>

      {!isOptional && (
        <StatusIndicator
          isComplete={isComplete}
          isWarning={isWarning}
          isPending={isPending}
          isIncomplete={isIncomplete}
          isPreCliente={isPreCliente}
        />
      )}
    </div>
  );

  if (tooltipText) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs px-2.5 py-1.5">
            {tooltipText}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}

export function StepperNav({
  steps = [],
  activeStep = 0,
  stepValidity = {},
  onStepClick,
  pendingCounts = {},
}: StepperNavProps) {
  const normalised = steps.map((s) =>
    typeof s === "string" ? { label: s, icon: DEFAULT_ICONS[s] || "Info" } : s,
  );

  return (
    <div
      role="tablist"
      aria-label="Pasos del embarque"
      className="flex gap-0.5 overflow-x-auto pb-1 px-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-thumb]:rounded-full"
    >
      {normalised.map((step, index) => (
        <StepItemComponent
          key={step.label}
          step={step}
          index={index}
          isActive={index === activeStep}
          stepValidity={stepValidity}
          pendingCount={pendingCounts[index] ?? 0}
          onStepClick={onStepClick}
        />
      ))}
    </div>
  );
}
