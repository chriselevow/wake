# Wake

Full-screen fluid pond. Drag to throw rings. Print the surface with dither and ASCII, or lay a gradient plate / photo under the water.

## Run

```bash
npm install
npm run dev
```

Open the local URL Vite prints (port 8080).

## Surface

- Drag or touch to send expanding waves
- **Viscosity** and **strength** shape damping and drop force
- **Waves** freeze / resume the pond (rings stay)
- **Dither** Bayer, grain, screen, hatch, mono, or ASCII
- **ASCII** Ramp, Shade, Edge (`/\-|` contours), Braille, Ordered
- **Plate** Bloom, Dusk, Tide, Forge, Veil — or drop / paste a photo
- **Color map** Abyss, Mercury, Ember, Glacier, Ink
- **Hide** tucks the sheet; **C** clears, **H** toggles the panel

Built with WebGL2 height-field simulation, TanStack Start, and React.
