"use client";

import { Eye, EyeOff } from "lucide-react";
import * as React from "react";
import { Input } from "@/shared/components/ui/input";
import { asText } from "@/shared/lib/text";
import { cn } from "@/shared/lib/utils";
import type { FieldRendererProps } from "../types";

export function PasswordInput({ className, ref, ...props }: React.ComponentProps<"input">) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <Input
        ref={ref}
        type={show ? "text" : "password"}
        className={cn("pr-9", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function renderPassword({
  value,
  onChange,
  disabled,
  readOnly,
  placeholder,
  autoComplete,
  maxLength,
  errorCls,
  readOnlyCls,
  id,
  onBlur,
  ref,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-label": ariaLabel,
}: FieldRendererProps) {
  return (
    <PasswordInput
      id={id}
      ref={ref as React.Ref<HTMLInputElement>}
      onBlur={onBlur}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaDescribedBy}
      aria-label={ariaLabel}
      value={asText(value)}
      onChange={(e) => onChange(e.target.value)}
      disabled={!!disabled}
      readOnly={!!readOnly}
      placeholder={placeholder}
      autoComplete={autoComplete ?? "current-password"}
      maxLength={maxLength}
      className={cn(errorCls, readOnlyCls)}
    />
  );
}
