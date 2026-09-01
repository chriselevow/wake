import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isAsciiTechniqueId, type AsciiTechniqueId } from "./ascii";
import { isColormapId, type ColormapId } from "./colormaps";
import { isDitherStyleId, type DitherStyleId } from "./dither";

export type RippleState = {
  viscosity: number;
  strength: number;
  dither: number;
  ditherStyle: DitherStyleId;
  asciiTechnique: AsciiTechniqueId;
  colormap: ColormapId;
  waves: boolean;
  panelOpen: boolean;
  image: Blob | null;
  imageName: string;
  clearToken: number;
  hasInteracted: boolean;
  setViscosity: (value: number) => void;
  setStrength: (value: number) => void;
  setDither: (value: number) => void;
  setDitherStyle: (value: DitherStyleId) => void;
  setAsciiTechnique: (value: AsciiTechniqueId) => void;
  setColormap: (value: ColormapId) => void;
  setWaves: (value: boolean) => void;
  setPanelOpen: (value: boolean) => void;
  togglePanel: () => void;
  setImage: (file: Blob | null, name?: string) => void;
  clearSurface: () => void;
  markInteracted: () => void;
};

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export const useRipple = create<RippleState>()(
  persist(
    (set) => ({
      viscosity: 0.28,
      strength: 0.58,
      dither: 0.74,
      ditherStyle: "ascii",
      asciiTechnique: "edge",
      colormap: "abyss",
      waves: true,
      panelOpen: true,
      image: null,
      imageName: "",
      clearToken: 0,
      hasInteracted: false,
      setViscosity: (value) => set({ viscosity: clamp01(value) }),
      setStrength: (value) => set({ strength: clamp01(value) }),
      setDither: (value) => set({ dither: clamp01(value) }),
      setDitherStyle: (value) => set({ ditherStyle: value }),
      setAsciiTechnique: (value) => set({ asciiTechnique: value, ditherStyle: "ascii" }),
      setColormap: (value) => set({ colormap: value }),
      setWaves: (value) => set({ waves: value }),
      setPanelOpen: (value) => set({ panelOpen: value }),
      togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),
      setImage: (file, name) =>
        set({
          image: file,
          imageName: file ? (name ?? "Photo") : "",
        }),
      clearSurface: () => set((s) => ({ clearToken: s.clearToken + 1 })),
      markInteracted: () => set({ hasInteracted: true }),
    }),
    {
      name: "wake-ripple-settings",
      version: 8,
      migrate: (persisted) => {
        const raw = (persisted ?? {}) as Record<string, unknown>;
        const { waves: _waves, panelOpen: _panel, ...rest } = raw;
        return rest;
      },
      partialize: (state) => ({
        viscosity: state.viscosity,
        strength: state.strength,
        dither: state.dither,
        ditherStyle: state.ditherStyle,
        asciiTechnique: state.asciiTechnique,
        colormap: state.colormap,
      }),
      merge: (persisted, current) => {
        const raw = (persisted ?? {}) as Partial<RippleState>;
        return {
          ...current,
          viscosity:
            typeof raw.viscosity === "number" ? clamp01(raw.viscosity) : current.viscosity,
          strength: typeof raw.strength === "number" ? clamp01(raw.strength) : current.strength,
          dither: typeof raw.dither === "number" ? clamp01(raw.dither) : current.dither,
          ditherStyle:
            raw.ditherStyle && isDitherStyleId(raw.ditherStyle)
              ? raw.ditherStyle
              : current.ditherStyle,
          asciiTechnique:
            raw.asciiTechnique && isAsciiTechniqueId(raw.asciiTechnique)
              ? raw.asciiTechnique
              : current.asciiTechnique,
          colormap: raw.colormap && isColormapId(raw.colormap) ? raw.colormap : current.colormap,
          panelOpen: true,
          waves: true,
        };
      },
    },
  ),
);
