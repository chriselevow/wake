export const COLORMAP_IDS = ["abyss", "mercury", "ember", "glacier", "ink"] as const;

export type ColormapId = (typeof COLORMAP_IDS)[number];

export const COLORMAPS: { id: ColormapId; label: string }[] = [
  { id: "abyss", label: "Abyss" },
  { id: "mercury", label: "Mercury" },
  { id: "ember", label: "Ember" },
  { id: "glacier", label: "Glacier" },
  { id: "ink", label: "Ink" },
];

export function isColormapId(value: string): value is ColormapId {
  return (COLORMAP_IDS as readonly string[]).includes(value);
}

export function colormapIndex(id: ColormapId): number {
  return COLORMAP_IDS.indexOf(id);
}
