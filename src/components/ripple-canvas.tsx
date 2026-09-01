import { useEffect, useRef } from "react";
import { asciiTechniqueIndex } from "@/lib/ripple/ascii";
import { colormapIndex } from "@/lib/ripple/colormaps";
import { ditherStyleIndex } from "@/lib/ripple/dither";
import { RippleEngine } from "@/lib/ripple/engine";
import { rasterizeImage, takeImageFile } from "@/lib/ripple/image";
import { useRipple } from "@/lib/ripple/store";

export function RippleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RippleEngine | null>(null);
  const viscosity = useRipple((s) => s.viscosity);
  const strength = useRipple((s) => s.strength);
  const dither = useRipple((s) => s.dither);
  const ditherStyle = useRipple((s) => s.ditherStyle);
  const asciiTechnique = useRipple((s) => s.asciiTechnique);
  const colormap = useRipple((s) => s.colormap);
  const waves = useRipple((s) => s.waves);
  const image = useRipple((s) => s.image);
  const clearToken = useRipple((s) => s.clearToken);
  const markInteracted = useRipple((s) => s.markInteracted);
  const setImage = useRipple((s) => s.setImage);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new RippleEngine(canvas);
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setParams({
      viscosity,
      strength,
      dither,
      ditherStyle: ditherStyleIndex(ditherStyle),
      asciiTechnique: asciiTechniqueIndex(asciiTechnique),
      colormap: colormapIndex(colormap),
      waves,
    });
  }, [viscosity, strength, dither, ditherStyle, asciiTechnique, colormap, waves]);

  useEffect(() => {
    engineRef.current?.clear();
  }, [clearToken]);

  useEffect(() => {
    let cancelled = false;
    const engine = engineRef.current;
    if (!engine) return;
    if (!image) {
      engine.setPlate(null);
      return;
    }
    void rasterizeImage(image).then((canvas) => {
      if (cancelled) return;
      engine.setPlate(canvas);
    });
    return () => {
      cancelled = true;
    };
  }, [image]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const uv = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height] as const;
    };
    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      const [x, y] = uv(e);
      engineRef.current?.queueDrop(x, y);
      markInteracted();
    };
    const onMove = (e: PointerEvent) => {
      if (!canvas.hasPointerCapture(e.pointerId)) return;
      const [x, y] = uv(e);
      engineRef.current?.queueDrop(x, y);
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
    };
  }, [markInteracted]);

  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      const file = takeImageFile(e.dataTransfer?.files);
      if (file) setImage(file, file.name);
    };
    const onPaste = (e: ClipboardEvent) => {
      const file = takeImageFile(e.clipboardData?.files);
      if (file) setImage(file, file.name);
    };
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("paste", onPaste);
    };
  }, [setImage]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 h-full w-full touch-none"
      data-surface="wake-silk"
    />
  );
}
