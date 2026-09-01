export const PLATE_IDS = ["bloom", "dusk", "tide", "forge", "veil"] as const;

export type PlateId = (typeof PLATE_IDS)[number];

type Stop = readonly [number, string];

type PlateSpec = {
  id: PlateId;
  label: string;
  linear: readonly Stop[];
  from: readonly [number, number];
  to: readonly [number, number];
  glow: readonly [number, number, number];
  glowColor: string;
};

export const PLATES: PlateSpec[] = [
  {
    id: "bloom",
    label: "Bloom",
    from: [0, 0],
    to: [1, 1],
    linear: [
      [0, "#1a1230"],
      [0.32, "#c45c78"],
      [0.62, "#f0a060"],
      [1, "#f7e6c8"],
    ],
    glow: [0.72, 0.28, 0.42],
    glowColor: "rgba(255, 210, 150, 0.55)",
  },
  {
    id: "dusk",
    label: "Dusk",
    from: [0.15, 0],
    to: [0.85, 1],
    linear: [
      [0, "#070b18"],
      [0.34, "#2a1858"],
      [0.62, "#c43d6e"],
      [1, "#f0c070"],
    ],
    glow: [0.62, 0.22, 0.38],
    glowColor: "rgba(255, 140, 90, 0.42)",
  },
  {
    id: "tide",
    label: "Tide",
    from: [0, 0.1],
    to: [1, 0.9],
    linear: [
      [0, "#031820"],
      [0.3, "#0d5c68"],
      [0.64, "#7ec8c0"],
      [1, "#e8f4f0"],
    ],
    glow: [0.35, 0.7, 0.5],
    glowColor: "rgba(180, 240, 230, 0.4)",
  },
  {
    id: "forge",
    label: "Forge",
    from: [0.2, 1],
    to: [0.8, 0],
    linear: [
      [0, "#0a0604"],
      [0.36, "#6a1c08"],
      [0.68, "#e06020"],
      [1, "#f8d8a0"],
    ],
    glow: [0.55, 0.4, 0.45],
    glowColor: "rgba(255, 180, 80, 0.5)",
  },
  {
    id: "veil",
    label: "Veil",
    from: [0, 0],
    to: [1, 0.85],
    linear: [
      [0, "#12161c"],
      [0.38, "#3d4a52"],
      [0.72, "#9aabb4"],
      [1, "#e6ece8"],
    ],
    glow: [0.7, 0.35, 0.48],
    glowColor: "rgba(230, 240, 245, 0.35)",
  },
];

export function isPlateId(value: string): value is PlateId {
  return (PLATE_IDS as readonly string[]).includes(value);
}

export function plateByName(name: string) {
  return PLATES.find((p) => p.label === name || p.id === name);
}

export function makePlate(id: PlateId): HTMLCanvasElement {
  const spec = PLATES.find((p) => p.id === id) ?? PLATES[0]!;
  const w = 960;
  const h = 540;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d");
  if (!g) throw new Error("Could not paint a gradient");

  const lg = g.createLinearGradient(spec.from[0] * w, spec.from[1] * h, spec.to[0] * w, spec.to[1] * h);
  for (const [t, color] of spec.linear) lg.addColorStop(t, color);
  g.fillStyle = lg;
  g.fillRect(0, 0, w, h);

  const [cx, cy, radius] = spec.glow;
  const rg = g.createRadialGradient(cx * w, cy * h, 8, cx * w, cy * h, radius * Math.max(w, h));
  rg.addColorStop(0, spec.glowColor);
  rg.addColorStop(1, "rgba(0, 0, 0, 0)");
  g.fillStyle = rg;
  g.fillRect(0, 0, w, h);

  const vg = g.createRadialGradient(
    w * 0.5,
    h * 0.5,
    Math.min(w, h) * 0.2,
    w * 0.5,
    h * 0.5,
    Math.max(w, h) * 0.72,
  );
  vg.addColorStop(0, "rgba(0, 0, 0, 0)");
  vg.addColorStop(1, "rgba(0, 0, 0, 0.28)");
  g.fillStyle = vg;
  g.fillRect(0, 0, w, h);

  return canvas;
}

export function plateBlob(id: PlateId): Promise<Blob> {
  return new Promise((resolve, reject) => {
    makePlate(id).toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not paint a gradient"));
    }, "image/png");
  });
}
