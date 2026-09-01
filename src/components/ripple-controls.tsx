import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Eraser, ImagePlus, ImageOff, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ASCII_TECHNIQUES } from "@/lib/ripple/ascii";
import { COLORMAPS } from "@/lib/ripple/colormaps";
import { DITHER_STYLES } from "@/lib/ripple/dither";
import { plateBlob, PLATES, plateByName } from "@/lib/ripple/plates";
import { takeImageFile } from "@/lib/ripple/image";
import { useRipple } from "@/lib/ripple/store";
import { cn } from "@/lib/utils";

function pct(value: number) {
  return `${Math.round(value * 100)}`;
}

export function RippleDock() {
  const panelOpen = useRipple((s) => s.panelOpen);
  const waves = useRipple((s) => s.waves);
  const setPanelOpen = useRipple((s) => s.setPanelOpen);
  const setWaves = useRipple((s) => s.setWaves);

  if (panelOpen) return <RippleControls />;

  return (
    <div className="pointer-events-auto flex items-center gap-2">
      {!waves ? (
        <Button type="button" variant="secondary" onClick={() => setWaves(true)}>
          Resume
        </Button>
      ) : null}
      <Button type="button" variant="secondary" onClick={() => setPanelOpen(true)}>
        <SlidersHorizontal />
        Controls
      </Button>
    </div>
  );
}

export function RippleControls() {
  const viscosity = useRipple((s) => s.viscosity);
  const strength = useRipple((s) => s.strength);
  const dither = useRipple((s) => s.dither);
  const ditherStyle = useRipple((s) => s.ditherStyle);
  const asciiTechnique = useRipple((s) => s.asciiTechnique);
  const colormap = useRipple((s) => s.colormap);
  const waves = useRipple((s) => s.waves);
  const imageName = useRipple((s) => s.imageName);
  const hasImage = useRipple((s) => s.image !== null);
  const setViscosity = useRipple((s) => s.setViscosity);
  const setStrength = useRipple((s) => s.setStrength);
  const setDither = useRipple((s) => s.setDither);
  const setDitherStyle = useRipple((s) => s.setDitherStyle);
  const setAsciiTechnique = useRipple((s) => s.setAsciiTechnique);
  const setColormap = useRipple((s) => s.setColormap);
  const setWaves = useRipple((s) => s.setWaves);
  const setPanelOpen = useRipple((s) => s.setPanelOpen);
  const setImage = useRipple((s) => s.setImage);
  const clearSurface = useRipple((s) => s.clearSurface);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileReady, setFileReady] = useState(false);
  const activePlate = plateByName(imageName);

  useEffect(() => {
    setFileReady(true);
  }, []);

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = takeImageFile(e.target.files);
    e.target.value = "";
    if (!file) return;
    setImage(file, file.name);
  };

  const onPlate = (label: string, id: (typeof PLATES)[number]["id"]) => {
    void plateBlob(id).then((blob) => setImage(blob, label));
  };

  return (
    <aside
      className="control-panel panel-enter pointer-events-auto w-full max-w-md rounded-3xl bg-card/85 p-4 shadow-[var(--shadow-panel)] backdrop-blur-md"
      aria-label="Surface controls"
    >
      <div className="sticky top-0 z-10 -mx-4 -mt-4 mb-2 flex h-12 items-center gap-2 rounded-t-3xl bg-card/90 px-4 pt-1 backdrop-blur-md">
        <h2 className="font-display text-xl tracking-[-0.03em] text-foreground italic">Wake</h2>
        <div className="min-w-0 flex-1" />
        <Button type="button" variant="secondary" size="sm" onClick={() => setPanelOpen(false)}>
          Hide
          <ChevronDown />
        </Button>
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Viscosity" value={pct(viscosity)}>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[Math.round(viscosity * 100)]}
              onValueChange={([v]) => setViscosity((v ?? 0) / 100)}
              aria-label="Viscosity"
              disabled={!waves}
            />
          </Field>
          <Field label="Strength" value={pct(strength)}>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[Math.round(strength * 100)]}
              onValueChange={([v]) => setStrength((v ?? 0) / 100)}
              aria-label="Wave strength"
              disabled={!waves}
            />
          </Field>
        </div>
        <div className="flex min-h-11 flex-wrap items-center gap-2">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Waves
          </span>
          <Switch
            checked={waves}
            onCheckedChange={(checked) => setWaves(checked)}
            aria-label="Waves"
            className="relative after:absolute after:-inset-2"
          />
          <div className="min-w-0 flex-1" />
          {fileReady ? (
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onPick}
            />
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="min-w-0 max-w-[9rem]"
            onClick={() => fileRef.current?.click()}
          >
            <ImagePlus />
            <span className="truncate">{hasImage ? imageName || "Photo" : "Photo"}</span>
          </Button>
          {hasImage ? (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Remove photo"
              onClick={() => setImage(null)}
            >
              <ImageOff />
            </Button>
          ) : null}
        </div>
        <Field label="Dither" value={pct(dither)}>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[Math.round(dither * 100)]}
            onValueChange={([v]) => setDither((v ?? 0) / 100)}
            aria-label="Dither"
          />
        </Field>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Dither style
            </span>
            <span className="text-xs tabular-nums text-foreground">
              {DITHER_STYLES.find((s) => s.id === ditherStyle)?.label}
            </span>
          </div>
          <div className="grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="Dither style">
            {DITHER_STYLES.map((style) => {
              const selected = style.id === ditherStyle;
              return (
                <button
                  key={style.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={style.label}
                  onClick={() => setDitherStyle(style.id)}
                  className={cn(
                    "dither-swatch relative h-10 overflow-visible rounded-md transition-[box-shadow,transform,opacity] duration-[var(--motion-quick)] ease-[var(--ease-out)] active:scale-[0.96]",
                    selected
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background opacity-100"
                      : "opacity-70 shadow-[var(--shadow-border)] hover:opacity-100",
                  )}
                  data-dither={style.id}
                />
              );
            })}
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              ASCII
            </span>
            <span className="text-xs tabular-nums text-foreground">
              {ASCII_TECHNIQUES.find((s) => s.id === asciiTechnique)?.label}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="ASCII technique">
            {ASCII_TECHNIQUES.map((tech) => {
              const selected = ditherStyle === "ascii" && tech.id === asciiTechnique;
              return (
                <button
                  key={tech.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={tech.label}
                  onClick={() => setAsciiTechnique(tech.id)}
                  className={cn(
                    "ascii-swatch relative h-10 overflow-visible rounded-md transition-[box-shadow,transform,opacity] duration-[var(--motion-quick)] ease-[var(--ease-out)] active:scale-[0.96]",
                    selected
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background opacity-100"
                      : "opacity-70 shadow-[var(--shadow-border)] hover:opacity-100",
                  )}
                  data-ascii={tech.id}
                />
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Plate
            </span>
            <span className="text-xs tabular-nums text-foreground">
              {activePlate?.label ?? (hasImage ? imageName || "Photo" : "None")}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Gradient plate">
            {PLATES.map((plate) => {
              const selected = activePlate?.id === plate.id;
              return (
                <button
                  key={plate.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={plate.label}
                  onClick={() => onPlate(plate.label, plate.id)}
                  className={cn(
                    "plate-swatch relative h-10 overflow-hidden rounded-md transition-[box-shadow,transform,opacity] duration-[var(--motion-quick)] ease-[var(--ease-out)] active:scale-[0.96]",
                    selected
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background opacity-100"
                      : "opacity-70 shadow-[var(--shadow-border)] hover:opacity-100",
                  )}
                  data-plate={plate.id}
                />
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Color map
            </span>
            <span className="text-xs tabular-nums text-foreground">
              {COLORMAPS.find((m) => m.id === colormap)?.label}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Color map">
            {COLORMAPS.map((map) => {
              const selected = map.id === colormap;
              return (
                <button
                  key={map.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={map.label}
                  onClick={() => setColormap(map.id)}
                  className={cn(
                    "cmap-swatch relative h-10 overflow-hidden rounded-md transition-[box-shadow,transform,opacity] duration-[var(--motion-quick)] ease-[var(--ease-out)] active:scale-[0.96]",
                    selected
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background opacity-100"
                      : "opacity-70 shadow-[var(--shadow-border)] hover:opacity-100",
                  )}
                  data-cmap={map.id}
                />
              );
            })}
          </div>
        </div>
        <Button type="button" variant="secondary" className="w-full" onClick={clearSurface}>
          <Eraser />
          Clear surface
        </Button>
      </div>
    </aside>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        <span className="text-xs tabular-nums text-foreground">{value}</span>
      </div>
      {children}
    </div>
  );
}
