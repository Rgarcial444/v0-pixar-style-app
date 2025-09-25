"use client"

import { useEffect, useRef } from "react"
import BackgroundCharacters from "@/components/background-characters"

export default function MagicBackground() {
  // Refs a contenedores "parallax" (el parallax se aplica al contenedor, no al elemento animado)
  const pAuroraA = useRef<HTMLDivElement | null>(null)
  const pAuroraB = useRef<HTMLDivElement | null>(null)
  const pAuroraC = useRef<HTMLDivElement | null>(null)
  const pBlob1 = useRef<HTMLDivElement | null>(null)
  const pBlob2 = useRef<HTMLDivElement | null>(null)
  const pBlob3 = useRef<HTMLDivElement | null>(null)
  const pBlob4 = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) return

    let ticking = false
    let lastY = 0

    const setTransform = (el: HTMLDivElement | null, x: number, y: number) => {
      if (!el) return
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`
    }

    const update = () => {
      ticking = false
      const y = lastY
      // Factores pequeños para un parallax suave
      setTransform(pAuroraA.current, y * 0.02, y * 0.04)
      setTransform(pAuroraB.current, y * -0.015, y * 0.02)
      setTransform(pAuroraC.current, 0, y * -0.02)

      setTransform(pBlob1.current, y * -0.03, y * 0.05) // arriba izq
      setTransform(pBlob2.current, y * 0.02, y * 0.03) // arriba der
      setTransform(pBlob3.current, y * -0.015, y * -0.03) // abajo centro-izq
      setTransform(pBlob4.current, y * 0.03, y * -0.04) // abajo der
    }

    const onScroll = () => {
      lastY = window.scrollY || window.pageYOffset
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base suave tipo aurora */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#dbeafe] via-[#e0f2fe] to-[#e0e7ff]" />

      {/* Capa aurora con degradados dinámicos (envueltas en contenedores con parallax) */}
      <div className="absolute inset-0 mix-blend-soft-light opacity-90">
        <div ref={pAuroraA} className="will-change-transform">
          <div className="aurora-layer aurora-a" />
        </div>
        <div ref={pAuroraB} className="will-change-transform">
          <div className="aurora-layer aurora-b" />
        </div>
        <div ref={pAuroraC} className="will-change-transform">
          <div className="aurora-layer aurora-c" />
        </div>
      </div>

      {/* Blobs flotantes de color (contenedores con parallax) */}
      <div ref={pBlob1} className="will-change-transform absolute -top-24 -left-24">
        <div className="w-[42rem] h-[42rem] rounded-full bg-sky-300/50 blur-3xl animate-float-1" />
      </div>
      <div ref={pBlob2} className="will-change-transform absolute -top-16 -right-24">
        <div className="w-[36rem] h-[36rem] rounded-full bg-emerald-300/45 blur-3xl animate-float-2" />
      </div>
      <div ref={pBlob3} className="will-change-transform absolute bottom-[-10rem] left-1/3">
        <div className="w-[40rem] h-[40rem] rounded-full bg-indigo-300/40 blur-3xl animate-float-3" />
      </div>
      <div ref={pBlob4} className="will-change-transform absolute bottom-[-6rem] right-[-8rem]">
        <div className="w-[28rem] h-[28rem] rounded-full bg-teal-300/40 blur-3xl animate-float-2" />
      </div>

      {/* Velo de luz diagonal */}
      <div className="absolute inset-0 opacity-[.35] [mask-image:linear-gradient(120deg,transparent,black_35%,black_65%,transparent)] bg-[conic-gradient(from_120deg_at_50%_50%,rgba(255,255,255,0.0),rgba(255,255,255,0.25),rgba(255,255,255,0.0))] animate-glow" />

      {/* Stickers/personajes en baja opacidad, integrados al fondo */}
      <BackgroundCharacters />

      <style jsx>{`
        .aurora-layer {
          position: absolute;
          inset: -20%;
          background:
            radial-gradient(60% 80% at 30% 20%, rgba(59,130,246,0.28), transparent 70%),
            radial-gradient(70% 70% at 70% 30%, rgba(16,185,129,0.22), transparent 72%),
            radial-gradient(60% 60% at 50% 70%, rgba(99,102,241,0.22), transparent 65%);
          filter: blur(30px);
        }
        .aurora-a { animation: driftA 22s ease-in-out infinite alternate; }
        .aurora-b { animation: driftB 28s ease-in-out infinite alternate; }
        .aurora-c { animation: driftC 32s ease-in-out infinite alternate; }

        @keyframes driftA {
          0% { transform: translate3d(-4%, -3%, 0) rotate(0deg) scale(1); }
          100% { transform: translate3d(4%, 3%, 0) rotate(6deg) scale(1.06); }
        }
        @keyframes driftB {
          0% { transform: translate3d(3%, -2%, 0) rotate(-4deg) scale(1.02); }
          100% { transform: translate3d(-3%, 2%, 0) rotate(2deg) scale(1.07); }
        }
        @keyframes driftC {
          0% { transform: translate3d(0%, 3%, 0) rotate(2deg) scale(1.03); }
          100% { transform: translate3d(0%, -3%, 0) rotate(-3deg) scale(1.08); }
        }

        .animate-float-1 { animation: float1 26s ease-in-out infinite alternate; will-change: transform, opacity; }
        .animate-float-2 { animation: float2 30s ease-in-out infinite alternate; will-change: transform, opacity; }
        .animate-float-3 { animation: float3 34s ease-in-out infinite alternate; will-change: transform, opacity; }

        @keyframes float1 {
          0% { transform: translate3d(0,0,0) scale(1); opacity: .55; }
          100% { transform: translate3d(4%,3%,0) scale(1.06); opacity: .7; }
        }
        @keyframes float2 {
          0% { transform: translate3d(0,0,0) scale(1); opacity: .5; }
          100% { transform: translate3d(-3%,2%,0) scale(1.05); opacity: .65; }
        }
        @keyframes float3 {
          0% { transform: translate3d(0,0,0) scale(1); opacity: .45; }
          100% { transform: translate3d(2%,-3%,0) scale(1.07); opacity: .62; }
        }

        .animate-glow { animation: glow 18s ease-in-out infinite alternate; }
        @keyframes glow {
          0% { transform: translate3d(-2%, 0, 0) rotate(0.3deg); }
          100% { transform: translate3d(2%, 0, 0) rotate(-0.3deg); }
        }
      `}</style>
    </div>
  )
}
