export const DITHER_STYLE_IDS = ["bayer", "grain", "screen", "hatch", "mono", "ascii"] as const;

export type DitherStyleId = (typeof DITHER_STYLE_IDS)[number];

export const DITHER_STYLES: { id: DitherStyleId; label: string }[] = [
  { id: "bayer", label: "Bayer" },
  { id: "grain", label: "Grain" },
  { id: "screen", label: "Screen" },
  { id: "hatch", label: "Hatch" },
  { id: "mono", label: "Mono" },
  { id: "ascii", label: "Ascii" },
];

export function isDitherStyleId(value: string): value is DitherStyleId {
  return (DITHER_STYLE_IDS as readonly string[]).includes(value);
}

export function ditherStyleIndex(id: DitherStyleId): number {
  return DITHER_STYLE_IDS.indexOf(id);
}
