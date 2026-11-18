"use client";

import type * as React from "react";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";

interface DecoratedInputProps extends React.ComponentProps<"input"> {
  prefix?: string | undefined;
  suffix?: string | undefined;
  leadingIcon?: React.ComponentType<{ className?: string }> | undefined;
}

export function DecoratedInput({
  prefix,
  suffix,
  leadingIcon: LeadingIcon,
  className,
  ...props
}: Readonly<DecoratedInputProps>) {
  if (!prefix && !suffix && !LeadingIcon) {
    return <Input className={className} {...props} />;
  }
  const hasLeft = prefix || LeadingIcon;
  return (
    <div className="flex rounded-md shadow-sm">
      {hasLeft && (
        <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground select-none">
          {prefix ?? (LeadingIcon && <LeadingIcon className="size-4" />)}
        </span>
      )}
      <Input
        className={cn("flex-1", hasLeft && "rounded-l-none", suffix && "rounded-r-none", className)}
        {...props}
      />
      {suffix && (
        <span className="inline-flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground select-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
