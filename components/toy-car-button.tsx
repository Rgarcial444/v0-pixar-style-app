"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"

type Variant = "primary" | "secondary" | "danger"

export interface ToyCarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  showWheels?: boolean // permite forzar mostrar/ocultar ruedas
}

const variantClasses: Record<Variant, string> = {
  primary:
    "from-sky-500 to-emerald-500 text-white shadow-sky-300/50 hover:from-sky-600 hover:to-emerald-600 focus:ring-sky-300",
  secondary:
    "from-slate-200 to-slate-300 text-slate-800 shadow-slate-300/60 hover:from-slate-300 hover:to-slate-400 focus:ring-slate-300",
  danger:
    "from-rose-500 to-orange-500 text-white shadow-rose-300/50 hover:from-rose-600 hover:to-orange-600 focus:ring-rose-300",
}

/**
 * Botón "carro de juguete" inspirado en Cars.
 * Ahora las ruedas se ocultan por defecto en variant="secondary" para evitar "puntos" decorativos.
 */
export default function ToyCarButton({
  className,
  variant = "primary",
  children,
  disabled,
  showWheels,
  ...props
}: ToyCarButtonProps) {
  // Por defecto: ruedas solo en primary y danger. En secondary se ocultan.
  const wheelsVisible = showWheels ?? (variant === "primary" || variant === "danger")

  return (
    <button
      {...props}
      disabled={disabled}
      className={cn(
        "group relative inline-flex items-center justify-center select-none",
        "px-5 pr-6 py-2 rounded-full",
        "bg-gradient-to-br transition-all duration-300",
        "shadow-md hover:shadow-lg active:scale-[0.98]",
        "outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        variantClasses[variant],
        className,
      )}
    >
      {/* Ruedas (ocultas por defecto en variant='secondary') */}
      {wheelsVisible && (
        <>
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute -bottom-2 left-3 h-3 w-3",
              "rounded-full bg-slate-700 shadow-inner",
              "transition-transform duration-300",
              disabled ? "" : "group-hover:rotate-6",
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute -bottom-2 right-3 h-3 w-3",
              "rounded-full bg-slate-700 shadow-inner",
              "transition-transform duration-300",
              disabled ? "" : "group-hover:-rotate-6",
            )}
          />
        </>
      )}
      {/* Brillo */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full bg-white/0 [mask-image:linear-gradient(to_bottom,white,transparent_40%)]"
      />
      <span className="relative flex items-center gap-2">{children}</span>
    </button>
  )
}
