import { DialogTitle } from "@/shared/components/ui/dialog";
import { cn } from "@/shared/lib/utils";

interface DialogTitleWithCloseProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly onClose: () => void;
}

export function DialogTitleWithClose({
  title,
  subtitle,
  onClose: _onClose,
}: DialogTitleWithCloseProps) {
  return (
    <div className="flex items-start justify-between gap-2 border-b px-6 py-4">
      <div>
        <DialogTitle className="text-lg font-semibold leading-none tracking-tight">
          {title}
        </DialogTitle>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

interface DisplayValueProps {
  readonly value?: string | number | null;
  readonly className?: string;
}

export function DisplayValue({ value, className }: DisplayValueProps) {
  return (
    <div
      className={cn(
        "flex min-h-10 w-full items-center justify-center rounded-md border bg-card px-2 py-1 text-center text-sm",
        "overflow-hidden whitespace-nowrap text-ellipsis",
        className,
      )}
    >
      <span className="w-full">{value ?? ""}</span>
    </div>
  );
}
