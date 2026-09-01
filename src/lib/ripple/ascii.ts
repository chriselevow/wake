export const ASCII_TECHNIQUE_IDS = ["ramp", "shade", "edge", "braille", "ordered"] as const;

export type AsciiTechniqueId = (typeof ASCII_TECHNIQUE_IDS)[number];

export const ASCII_TECHNIQUES: { id: AsciiTechniqueId; label: string }[] = [
  { id: "ramp", label: "Ramp" },
  { id: "shade", label: "Shade" },
  { id: "edge", label: "Edge" },
  { id: "braille", label: "Braille" },
  { id: "ordered", label: "Ordered" },
];

export function isAsciiTechniqueId(value: string): value is AsciiTechniqueId {
  return (ASCII_TECHNIQUE_IDS as readonly string[]).includes(value);
}

export function asciiTechniqueIndex(id: AsciiTechniqueId): number {
  return ASCII_TECHNIQUE_IDS.indexOf(id);
}
