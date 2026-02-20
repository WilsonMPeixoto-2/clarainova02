import { useEffect, useRef, useCallback } from "react";

/**
 * EnergyFlow — WebGL flow-field shader.
 *
 * Cria correntes de energia viva que envolvem o corpo da Clara como veias
 * de luz/eletricidade. Técnica: curl noise → streamlines → ribbons.
 *
 * Camadas do shader:
 *   1. Flow field via curl de snoise → ribbons finos que fluem organicamente
 *   2. Segunda camada de ribbons em escala/velocidade diferente → profundidade
 *   3. Noise de alta frequência → faíscas/micro-detalhe
 *   4. Máscara de posição → concentra o efeito onde Clara está
 *   5. Vignette de borda → dissolução natural
 */

const VERT = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAG = `
  precision highp float;
  uniform float u_time;
  uniform vec2  u_resolution;

  /* ── Simplex noise ── */
  vec3 mod289(vec3 x) { return x - floor(x*(1./289.))*289.; }
  vec2 mod289(vec2 x) { return x - floor(x*(1./289.))*289.; }
  vec3 permute(vec3 x) { return mod289(((x*34.)+1.)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1  = (x0.x > x0.y) ? vec2(1.,0.) : vec2(0.,1.);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
    vec3 m = max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
    m = m*m; m = m*m;
    vec3 x2 = 2.*fract(p*C.www)-1.;
    vec3 h  = abs(x2)-.5;
    vec3 ox = floor(x2+.5);
    vec3 a0 = x2-ox;
    m *= 1.79284291400159 - 0.85373472095314*(a0*a0+h*h);
    vec3 g;
    g.x  = a0.x*x0.x + h.x*x0.y;
    g.yz = a0.yz*x12.xz + h.yz*x12.yw;
    return 130.*dot(m,g);
  }

  /* ── Curl noise → campo de fluxo ── */
  vec2 curl(vec2 p, float t) {
    float e = 0.008;
    float n0 = snoise(p + vec2(0.,  e) + vec2(t*0.18, 0.));
    float n1 = snoise(p + vec2(0., -e) + vec2(t*0.18, 0.));
    float n2 = snoise(p + vec2( e,  0.) + vec2(0., t*0.12));
    float n3 = snoise(p + vec2(-e,  0.) + vec2(0., t*0.12));
    return vec2((n0-n1)/(2.*e), -(n2-n3)/(2.*e));
  }

  /* ── Ribbon: fração cíclica de ângulo → feixe fino ── */
  float ribbon(vec2 flow, float phase, float thickness) {
    float angle = atan(flow.y, flow.x);
    float r = fract(angle * 2.2 + phase);
    return pow(smoothstep(0.,thickness,r)*smoothstep(1.,1.-thickness,r), 1.8);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float t  = u_time * 0.55;

    /* ── Máscara de posição: onde Clara está ── */
    /* Clara ocupa aproximadamente 50-90% em X, 0-90% em Y              */
    /* A máscara é mais densa no centro do corpo (~65-78% X, 20-70% Y)  */
    float mX = smoothstep(0.38, 0.60, uv.x) * smoothstep(1.00, 0.72, uv.x);
    float mY = smoothstep(0.00, 0.12, uv.y) * smoothstep(1.00, 0.08, uv.y);
    float bodyMask = mX * mY;
    bodyMask = pow(bodyMask, 0.55); /* abre mais a máscara */

    if (bodyMask < 0.01) {
      gl_FragColor = vec4(0.);
      return;
    }

    /* ── Camada 1: flow ribbons largos (cabelo / contorno) ── */
    vec2 p1   = uv * 2.8 + vec2(0., t * 0.30);
    vec2 f1   = curl(p1, t);
    float r1  = ribbon(f1, t * 0.25, 0.14);

    /* ── Camada 2: flow ribbons finos rápidos (energia elétrica) ── */
    vec2 p2   = uv * 5.5 + vec2(t * 0.15, t * 0.55);
    vec2 f2   = curl(p2, t * 1.4);
    float r2  = ribbon(f2, -t * 0.40, 0.09);

    /* ── Camada 3: micro-faíscas (noise de alta freq) ── */
    float spark = snoise(uv * 14. + vec2(t*0.9, -t*0.6));
    spark = smoothstep(0.72, 1.0, spark);

    /* ── Combinação de camadas ── */
    float energy = r1 * 0.75 + r2 * 0.55 + spark * 0.30;
    energy = clamp(energy, 0., 1.);

    /* ── Pulsação temporal ── */
    float pulse = 0.82 + 0.18 * sin(t * 1.8 + uv.y * 3.0);
    energy *= pulse;

    /* ── Paleta de cores: dourado → branco elétrico ── */
    vec3 goldDeep  = vec3(0.72, 0.48, 0.08);   /* âmbar profundo     */
    vec3 gold      = vec3(0.92, 0.72, 0.22);   /* dourado principal  */
    vec3 goldBright= vec3(1.00, 0.92, 0.60);   /* dourado brilhante  */
    vec3 white     = vec3(1.00, 0.98, 0.95);   /* branco elétrico    */

    vec3 col = goldDeep;
    col = mix(col, gold,      smoothstep(0.15, 0.45, energy));
    col = mix(col, goldBright,smoothstep(0.45, 0.72, energy));
    col = mix(col, white,     smoothstep(0.72, 1.00, energy));

    /* ── Alpha: energy × bodyMask + glow halo ── */
    float halo = pow(energy, 0.6) * 0.18;  /* glow difuso          */
    float core = pow(energy, 1.4) * 0.80;  /* núcleo nítido        */
    float alpha = (core + halo) * bodyMask;
    alpha = clamp(alpha, 0., 1.);

    gl_FragColor = vec4(col, alpha);
  }
`;

const EnergyFlow = () => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const glRef      = useRef<WebGLRenderingContext | null>(null);
  const progRef    = useRef<WebGLProgram | null>(null);
  const rafRef     = useRef<number>(0);
  const startRef   = useRef(0);

  const initGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return false;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) return false;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn("EnergyFlow shader error:", gl.getShaderInfoLog(s));
      }
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn("EnergyFlow link error:", gl.getProgramInfoLog(prog));
      return false;
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    glRef.current  = gl;
    progRef.current = prog;
    return true;
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    if (!initGL()) return;

    const gl     = glRef.current!;
    const prog   = progRef.current!;
    const canvas = canvasRef.current!;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas.width  = canvas.clientWidth  * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);
    startRef.current = performance.now();

    const render = () => {
      const t = (performance.now() - startRef.current) / 1000;
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(prog);
      gl.uniform1f(gl.getUniformLocation(prog, "u_time"), t);
      gl.uniform2f(gl.getUniformLocation(prog, "u_resolution"), canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [initGL]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[4]"
      aria-hidden="true"
      style={{ mixBlendMode: "screen" }}
    />
  );
};

export default EnergyFlow;
