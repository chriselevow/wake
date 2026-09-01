import { DISPLAY_FRAG, SIM_FRAG, VERT } from "./shaders";

export type EngineParams = {
  viscosity: number;
  strength: number;
  dither: number;
  ditherStyle: number;
  asciiTechnique: number;
  colormap: number;
  waves: boolean;
};

const MAX_EDGE = 960;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("WebGL shader");
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "compile failed";
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

function program(gl: WebGL2RenderingContext, frag: string) {
  const p = gl.createProgram();
  if (!p) throw new Error("WebGL program");
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, frag);
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p) ?? "link failed");
  }
  return p;
}

function makeTarget(gl: WebGL2RenderingContext, w: number, h: number) {
  const tex = gl.createTexture();
  if (!tex) throw new Error("texture");
  const fbo = gl.createFramebuffer();
  if (!fbo) throw new Error("fbo");
  const attempts: [number, number, number][] = [
    [gl.RG16F, gl.RG, gl.HALF_FLOAT],
    [gl.RG32F, gl.RG, gl.FLOAT],
    [gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT],
    [gl.RGBA32F, gl.RGBA, gl.FLOAT],
  ];
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  let ok = false;
  for (const [internal, format, type] of attempts) {
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
      ok = true;
      break;
    }
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (!ok) throw new Error("float buffers unavailable");
  return { tex, fbo };
}

function stamp(data: Uint8Array, id: number, rows: string[]) {
  for (let y = 0; y < 8; y++) {
    const row = rows[y] ?? "        ";
    for (let x = 0; x < 8; x++) {
      const on = row[x] === "#" ? 255 : 0;
      data[y * 256 + id * 8 + x] = on;
    }
  }
}

function makeGlyphTexture(gl: WebGL2RenderingContext) {
  const data = new Uint8Array(256 * 8);
  const g: [number, string[]][] = [
    [0, ["        ", "        ", "        ", "        ", "        ", "        ", "        ", "        "]],
    [1, ["        ", "        ", "        ", "        ", "   ##   ", "   ##   ", "        ", "        "]],
    [2, ["        ", "   ##   ", "   ##   ", "        ", "   ##   ", "   ##   ", "        ", "        "]],
    [3, ["        ", "        ", "        ", " ###### ", " ###### ", "        ", "        ", "        "]],
    [4, ["        ", " ###### ", "        ", " ###### ", "        ", " ###### ", "        ", "        "]],
    [5, ["        ", "   ##   ", "   ##   ", "####### ", "   ##   ", "   ##   ", "        ", "        "]],
    [6, [" ##  ## ", "  ####  ", "   ##   ", " ###### ", "   ##   ", "  ####  ", " ##  ## ", "        "]],
    [7, ["  ####  ", " ##  ## ", " ## ### ", " ### ## ", " ##  ## ", "  ####  ", "        ", "        "]],
    [8, [" ##  ## ", " ## ##  ", "  ###   ", "  ###   ", "  ## ## ", " ##  ## ", "        ", "        "]],
    [9, ["  ####  ", " ##  ## ", " ##  ## ", "  ####  ", " ##  ## ", " ##  ## ", "  ####  ", "        "]],
    [10, ["        ", "        ", "        ", "        ", "        ", " # # #  ", "        ", "        "]],
    [11, ["        ", "        ", " # # # #", "        ", " # # # #", "        ", "        ", "        "]],
    [12, ["# # # # ", " # # # #", "# # # # ", " # # # #", "# # # # ", " # # # #", "# # # # ", "        "]],
    [13, ["## ## ##", "########", "## ## ##", "########", "## ## ##", "########", "## ## ##", "########"]],
    [14, ["########", "########", "########", "########", "########", "########", "########", "########"]],
    [15, ["      ##", "     ## ", "    ##  ", "   ##   ", "  ##    ", " ##     ", "##      ", "        "]],
    [16, ["        ", "        ", "########", "        ", "        ", "        ", "        ", "        "]],
    [17, ["   ##   ", "   ##   ", "   ##   ", "   ##   ", "   ##   ", "   ##   ", "   ##   ", "        "]],
    [18, ["##      ", " ##     ", "  ##    ", "   ##   ", "    ##  ", "     ## ", "      ##", "        "]],
    [19, ["        ", "  #     ", "        ", "        ", "        ", "        ", "        ", "        "]],
    [20, ["        ", "  #  #  ", "        ", "        ", "        ", "        ", "        ", "        "]],
    [21, ["        ", "  #  #  ", "        ", "  #     ", "        ", "        ", "        ", "        "]],
    [22, ["        ", "  #  #  ", "        ", "  #  #  ", "        ", "        ", "        ", "        "]],
    [23, [" # #    ", "  #  #  ", "        ", "  #  #  ", "        ", "        ", "        ", "        "]],
    [24, [" # # #  ", "  #  #  ", "        ", "  #  #  ", "        ", "        ", "        ", "        "]],
    [25, [" # # #  ", "  #  #  ", " #      ", "  #  #  ", "        ", "        ", "        ", "        "]],
    [26, [" # # #  ", "  #  #  ", " #   #  ", "  #  #  ", "        ", "        ", "        ", "        "]],
  ];
  for (const [id, rows] of g) stamp(data, id, rows);

  const tex = gl.createTexture();
  if (!tex) throw new Error("glyphs");
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 256, 8, 0, gl.RED, gl.UNSIGNED_BYTE, data);
  return tex;
}

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer };

export class RippleEngine {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private sim: WebGLProgram;
  private display: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private read: Target;
  private write: Target;
  private glyphs: WebGLTexture;
  private image: WebGLTexture | null = null;
  private imageSize = [1, 1];
  private hasImage = 0;
  private w = 1;
  private h = 1;
  private params: EngineParams = {
    viscosity: 0.28,
    strength: 0.58,
    dither: 0.74,
    ditherStyle: 5,
    asciiTechnique: 2,
    colormap: 0,
    waves: true,
  };
  private drops: { x: number; y: number; amp: number }[] = [];
  private dirty = true;
  private raf = 0;
  private last = 0;
  private acc = 0;
  private loc: Record<string, WebGLUniformLocation | null> = {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      desynchronized: true,
      powerPreference: "high-performance",
    });
    if (!gl) throw new Error("WebGL2 is required");
    this.gl = gl;
    gl.getExtension("EXT_color_buffer_float");
    gl.getExtension("OES_texture_float_linear");
    gl.getExtension("EXT_float_blend");

    this.sim = program(gl, SIM_FRAG);
    this.display = program(gl, DISPLAY_FRAG);
    this.glyphs = makeGlyphTexture(gl);

    const buf = gl.createBuffer();
    const vao = gl.createVertexArray();
    if (!buf || !vao) throw new Error("geometry");
    this.vao = vao;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    this.read = makeTarget(gl, 1, 1);
    this.write = makeTarget(gl, 1, 1);
    this.cacheLoc();
    this.resize();
    this.seed();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  setParams(p: Partial<EngineParams>) {
    this.params = { ...this.params, ...p };
    this.dirty = true;
  }

  queueDrop(nx: number, ny: number) {
    const amp = 0.12 + this.params.strength * 0.42;
    this.drops.push({ x: nx, y: 1 - ny, amp });
    if (this.drops.length > 8) this.drops.shift();
    this.dirty = true;
  }

  clear() {
    const { gl } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.read.fbo);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.write.fbo);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.drops.length = 0;
    this.dirty = true;
  }

  setPlate(source: TexImageSource | null) {
    const { gl } = this;
    if (!source) {
      this.hasImage = 0;
      this.dirty = true;
      return;
    }
    if (!this.image) {
      this.image = gl.createTexture();
      if (!this.image) return;
      gl.bindTexture(gl.TEXTURE_2D, this.image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.bindTexture(gl.TEXTURE_2D, this.image);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    const w = "width" in source ? Number(source.width) : 1;
    const h = "height" in source ? Number(source.height) : 1;
    this.imageSize = [w, h];
    this.hasImage = 1;
    this.dirty = true;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    const { gl } = this;
    gl.deleteProgram(this.sim);
    gl.deleteProgram(this.display);
    gl.deleteTexture(this.glyphs);
    if (this.image) gl.deleteTexture(this.image);
    gl.deleteFramebuffer(this.read.fbo);
    gl.deleteFramebuffer(this.write.fbo);
    gl.deleteTexture(this.read.tex);
    gl.deleteTexture(this.write.tex);
  }

  private cacheLoc() {
    const { gl } = this;
    const grab = (p: WebGLProgram, name: string) => gl.getUniformLocation(p, name);
    this.loc = {
      sState: grab(this.sim, "uState"),
      sTexel: grab(this.sim, "uTexel"),
      sDamp: grab(this.sim, "uDamping"),
      sSpread: grab(this.sim, "uSpread"),
      sDrop: grab(this.sim, "uDrop"),
      sAmp: grab(this.sim, "uAmp"),
      sRadius: grab(this.sim, "uRadius"),
      dState: grab(this.display, "uState"),
      dImage: grab(this.display, "uImage"),
      dGlyphs: grab(this.display, "uGlyphs"),
      dRes: grab(this.display, "uResolution"),
      dTexel: grab(this.display, "uTexel"),
      dHas: grab(this.display, "uHasImage"),
      dImgSize: grab(this.display, "uImageSize"),
      dDither: grab(this.display, "uDither"),
      dStyle: grab(this.display, "uStyle"),
      dAscii: grab(this.display, "uAscii"),
      dMap: grab(this.display, "uMap"),
      dWaves: grab(this.display, "uWaves"),
    };
  }

  private seed() {
    this.clear();
    this.drops.push({ x: 0.5, y: 0.48, amp: 0.72 });
    this.drops.push({ x: 0.36, y: 0.6, amp: 0.28 });
    this.drops.push({ x: 0.64, y: 0.4, amp: 0.2 });
  }

  resize() {
    const { canvas, gl } = this;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    let w = Math.max(1, Math.round(rect.width * dpr));
    let h = Math.max(1, Math.round(rect.height * dpr));
    const long = Math.max(w, h);
    if (long > MAX_EDGE) {
      const s = MAX_EDGE / long;
      w = Math.max(1, Math.round(w * s));
      h = Math.max(1, Math.round(h * s));
    }
    if (w === this.w && h === this.h && canvas.width === w) return;
    canvas.width = w;
    canvas.height = h;
    this.w = w;
    this.h = h;
    gl.deleteFramebuffer(this.read.fbo);
    gl.deleteFramebuffer(this.write.fbo);
    gl.deleteTexture(this.read.tex);
    gl.deleteTexture(this.write.tex);
    this.read = makeTarget(gl, w, h);
    this.write = makeTarget(gl, w, h);
    this.dirty = true;
  }

  private swap() {
    const t = this.read;
    this.read = this.write;
    this.write = t;
  }

  private simStep(drop: { x: number; y: number; amp: number } | null) {
    const { gl } = this;
    gl.useProgram(this.sim);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.write.fbo);
    gl.viewport(0, 0, this.w, this.h);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.read.tex);
    gl.uniform1i(this.loc.sState, 0);
    gl.uniform2f(this.loc.sTexel, 1 / this.w, 1 / this.h);
    const damp = 0.985 - this.params.viscosity * 0.04;
    gl.uniform1f(this.loc.sDamp, damp);
    gl.uniform1f(this.loc.sSpread, 0.22);
    if (drop) {
      gl.uniform2f(this.loc.sDrop, drop.x, drop.y);
      gl.uniform1f(this.loc.sAmp, drop.amp);
      gl.uniform1f(this.loc.sRadius, 0.028 + this.params.strength * 0.02);
    } else {
      gl.uniform2f(this.loc.sDrop, 0, 0);
      gl.uniform1f(this.loc.sAmp, 0);
      gl.uniform1f(this.loc.sRadius, 0.03);
    }
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.swap();
  }

  private draw() {
    const { gl } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.w, this.h);
    gl.useProgram(this.display);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.read.tex);
    gl.uniform1i(this.loc.dState, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.image ?? this.read.tex);
    gl.uniform1i(this.loc.dImage, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.glyphs);
    gl.uniform1i(this.loc.dGlyphs, 2);
    gl.uniform2f(this.loc.dRes, this.w, this.h);
    gl.uniform2f(this.loc.dTexel, 1 / this.w, 1 / this.h);
    gl.uniform1f(this.loc.dHas, this.hasImage);
    gl.uniform2f(this.loc.dImgSize, this.imageSize[0] ?? 1, this.imageSize[1] ?? 1);
    gl.uniform1f(this.loc.dDither, this.params.dither);
    gl.uniform1i(this.loc.dStyle, this.params.ditherStyle);
    gl.uniform1i(this.loc.dAscii, this.params.asciiTechnique);
    gl.uniform1i(this.loc.dMap, this.params.colormap);
    gl.uniform1f(this.loc.dWaves, this.params.waves ? 1 : 0);
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  private loop(now: number) {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.last) / 1000 || 0.016);
    this.last = now;
    this.resize();

    const frozen = !this.params.waves;
    if (frozen && this.drops.length === 0 && !this.dirty) return;

    this.acc += dt;
    const step = 1 / 60;
    let n = 0;
    while (this.acc >= step && n < 2) {
      const drop = this.drops.shift() ?? null;
      if (!frozen || drop) this.simStep(drop);
      this.acc -= step;
      n += 1;
    }
    if (frozen && this.drops.length) {
      while (this.drops.length) this.simStep(this.drops.shift() ?? null);
    }
    this.draw();
    this.dirty = frozen ? false : true;
    if (!frozen) this.dirty = true;
  }
}
