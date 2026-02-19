import { useEffect, useRef, useCallback } from "react";

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_resolution;

  // Simplex-style noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float t = u_time * 0.08;

    // Multiple noise layers for organic movement
    float n1 = snoise(uv * 1.5 + vec2(t * 0.7, t * 0.3));
    float n2 = snoise(uv * 2.5 + vec2(-t * 0.5, t * 0.6));
    float n3 = snoise(uv * 0.8 + vec2(t * 0.2, -t * 0.4));

    // Gold color palette (HSL 42° mapped to RGB)
    vec3 gold1 = vec3(0.85, 0.68, 0.22);   // warm gold
    vec3 gold2 = vec3(0.90, 0.78, 0.35);   // bright gold
    vec3 gold3 = vec3(0.65, 0.50, 0.15);   // deep gold

    // Mix colors based on noise
    vec3 color = mix(gold1, gold2, smoothstep(-0.3, 0.5, n1));
    color = mix(color, gold3, smoothstep(-0.2, 0.6, n2) * 0.5);

    // Shape the aurora beams — more dramatic
    float beam1 = smoothstep(0.15, 0.75, 1.0 - abs(uv.y - 0.3 + n1 * 0.2)) * 0.55;
    float beam2 = smoothstep(0.2, 0.85, 1.0 - abs(uv.y - 0.7 + n2 * 0.25)) * 0.45;
    float beam3 = smoothstep(0.1, 0.65, 1.0 - abs(uv.x - 0.3 + n3 * 0.15)) * 0.35;

    float intensity = (beam1 + beam2 + beam3) * (0.7 + n3 * 0.25);

    // Edge fade for seamless blending
    float edgeFade = smoothstep(0.0, 0.3, uv.x) * smoothstep(1.0, 0.7, uv.x)
                   * smoothstep(0.0, 0.2, uv.y) * smoothstep(1.0, 0.8, uv.y);

    // Final opacity — visible and alive
    float alpha = intensity * edgeFade * 0.45;

    gl_FragColor = vec4(color, alpha);
  }
`;

const AuroraBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(0);

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

    // Compile shaders
    const vs = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vs, VERTEX_SHADER);
    gl.compileShader(vs);

    const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fs, FRAGMENT_SHADER);
    gl.compileShader(fs);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("Aurora shader failed to link");
      return false;
    }

    // Full-screen quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    glRef.current = gl;
    programRef.current = program;
    return true;
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    if (!initGL()) return;

    const gl = glRef.current!;
    const program = programRef.current!;
    const canvas = canvasRef.current!;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener("resize", resize);
    startTimeRef.current = performance.now();

    const render = () => {
      const elapsed = (performance.now() - startTimeRef.current) / 1000;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.useProgram(program);
      gl.uniform1f(gl.getUniformLocation(program, "u_time"), elapsed);
      gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), canvas.width, canvas.height);

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
      className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
      aria-hidden="true"
      style={{ mixBlendMode: "screen" }}
    />
  );
};

export default AuroraBackground;
