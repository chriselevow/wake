import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { RippleCanvas } from "@/components/ripple-canvas";
import { RippleDock } from "@/components/ripple-controls";
import { ASCII_TECHNIQUE_IDS } from "@/lib/ripple/ascii";
import { COLORMAPS } from "@/lib/ripple/colormaps";
import { DITHER_STYLES } from "@/lib/ripple/dither";
import { PLATES, plateBlob } from "@/lib/ripple/plates";
import { useRipple } from "@/lib/ripple/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const hasInteracted = useRipple((s) => s.hasInteracted);
  const clearSurface = useRipple((s) => s.clearSurface);
  const setColormap = useRipple((s) => s.setColormap);
  const setDitherStyle = useRipple((s) => s.setDitherStyle);
  const setAsciiTechnique = useRipple((s) => s.setAsciiTechnique);
  const setWaves = useRipple((s) => s.setWaves);
  const togglePanel = useRipple((s) => s.togglePanel);
  const setPanelOpen = useRipple((s) => s.setPanelOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "KeyC") {
        clearSurface();
        return;
      }
      if (e.code === "Escape") {
        setPanelOpen(false);
        return;
      }
      if (e.code === "KeyH") {
        togglePanel();
        return;
      }
      if (e.code === "KeyG") {
        const cur = useRipple.getState().imageName;
        const i = PLATES.findIndex((p) => p.label === cur);
        const next = PLATES[i < 0 ? 0 : (i + 1) % PLATES.length];
        if (!next) return;
        void plateBlob(next.id).then((blob) => useRipple.getState().setImage(blob, next.label));
        return;
      }
      if (e.code === "KeyW") {
        setWaves(!useRipple.getState().waves);
        return;
      }
      if (e.code === "BracketLeft" || e.code === "BracketRight") {
        const cur = useRipple.getState().asciiTechnique;
        const i = Math.max(0, ASCII_TECHNIQUE_IDS.indexOf(cur));
        const next =
          e.code === "BracketRight"
            ? (i + 1) % ASCII_TECHNIQUE_IDS.length
            : (i - 1 + ASCII_TECHNIQUE_IDS.length) % ASCII_TECHNIQUE_IDS.length;
        const id = ASCII_TECHNIQUE_IDS[next];
        if (id) setAsciiTechnique(id);
        return;
      }
      const digit = e.code.startsWith("Digit") ? Number(e.code.slice(5)) : NaN;
      if (digit >= 1 && digit <= 6) {
        if (e.shiftKey) {
          const style = DITHER_STYLES[digit - 1];
          if (style) setDitherStyle(style.id);
        } else if (digit <= 5) {
          const map = COLORMAPS[digit - 1];
          if (map) setColormap(map.id);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearSurface, setColormap, setDitherStyle, setAsciiTechnique, setWaves, togglePanel, setPanelOpen]);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-background text-foreground">
      <RippleCanvas key="wake-silk" />
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="hint-enter text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
              Surface
            </p>
            <h1 className="hint-enter font-display text-4xl leading-tight tracking-[-0.03em] text-foreground italic sm:text-5xl">
              Wake
            </h1>
          </div>
          <p
            className={cn(
              "hint-enter max-w-[11rem] text-right text-sm leading-snug text-muted-foreground transition-opacity duration-[var(--motion-slow)] ease-[var(--ease-out)] sm:max-w-xs",
              hasInteracted ? "opacity-0" : "opacity-100",
            )}
          >
            Lay a gradient, or drop a photo
          </p>
        </header>
        <div className="flex justify-start">
          <RippleDock />
        </div>
      </div>
    </main>
  );
}
