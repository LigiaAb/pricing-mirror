"use client";

import Image from "next/image";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

function LoadingDots() {
  const [dots, setDots] = React.useState("");

  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : `${prev}.`));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return <span className="font-semibold">{dots}</span>;
}

interface LoaderProps {
  texto?: string;
  texto2?: string;
  className?: string;
}

export function Loader({
  texto = "ESTAMOS CARGANDO LA INFORMACIÓN",
  texto2,
  className,
}: LoaderProps) {
  return (
    <div className={cn("flex min-h-[60vh] w-full items-center justify-center p-4", className)}>
      <div className="flex w-full max-w-2xl flex-col items-center gap-2 rounded-2xl border border-white/30 bg-white/20 p-6 shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-md dark:border-white/10 dark:bg-black/20">
        <Image
          src="/images/loader.gif"
          alt="Cargando"
          width={220}
          height={44}
          unoptimized
          className="mx-auto h-auto max-w-[90%]"
        />
        <p className="text-center text-xl font-thin text-foreground">
          {texto}
          <LoadingDots />
        </p>
        {texto2 && <p className="text-center text-xl font-thin text-foreground">{texto2}</p>}
      </div>
    </div>
  );
}
