import { useEffect, useRef, useCallback } from "react";

/**
 * EnergyFlow — Plasma/Fluid WebGL shader.
 *
 * Recria o efeito do vídeo Veo: fluido dourado luminoso que envolve o corpo
 * da Clara como plasma vivo. Técnica: domain warping recursivo sobre simplex
 * noise → cria filamentos orgânicos que fluem e se dobram como fogo líquido.
 *
 * Inspirado em "Warped Noise" (Inigo Quilez) + fire shader clássico.
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

  /* ══════════════════════════════════════════════
     SIMPLEX NOISE 2D
  ══════════════════════════════════════════════ */
  vec3 mod289v3(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec2 mod289v2(vec2 x){return x-floor(x*(1./289.))*289.;}
  vec3 permute3(vec3 x){return mod289v3(((x*34.)+1.)*x);}

  float snoise(vec2 v){
    const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
    vec2 i=floor(v+dot(v,C.yy));
    vec2 x0=v-i+dot(i,C.xx);
    vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);
    vec4 x12=x0.xyxy+C.xxzz;
    x12.xy-=i1;
    i=mod289v2(i);
    vec3 p=permute3(permute3(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
    vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.);
    m=m*m;m=m*m;
    vec3 x2=2.*fract(p*C.www)-1.;
    vec3 h=abs(x2)-.5;
    vec3 ox=floor(x2+.5);
    vec3 a0=x2-ox;
    m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
    vec3 g;
    g.x=a0.x*x0.x+h.x*x0.y;
    g.yz=a0.yz*x12.xz+h.yz*x12.yw;
    return 130.*dot(m,g);
  }

  /* ══════════════════════════════════════════════
     DOMAIN WARPING — o coração do efeito plasma
     Warp recursivo: o noise é amostrado em coordenadas
     que já foram distorcidas por outra camada de noise.
     Resultado: filamentos orgânicos como fogo líquido.
  ══════════════════════════════════════════════ */
  float fbm(vec2 p, float t){
    float v=0.;
    float amp=0.55;
    float freq=1.;
    for(int i=0;i<5;i++){
      v+=amp*snoise(p*freq+vec2(t*0.18,-t*0.12));
      amp*=0.50;
      freq*=2.05;
      p=p*1.2+vec2(0.3,0.7); /* deslocamento entre oitavas */
    }
    return v;
  }

  float warpedNoise(vec2 p, float t){
    /* 1ª distorção */
    vec2 q=vec2(
      fbm(p + vec2(0.00, 0.00), t),
      fbm(p + vec2(5.20, 1.30), t+0.5)
    );
    /* 2ª distorção — alimenta q de volta */
    vec2 r=vec2(
      fbm(p + 3.8*q + vec2(1.70, 9.20), t*0.8),
      fbm(p + 3.8*q + vec2(8.30, 2.80), t*0.8+0.3)
    );
    /* Valor final */
    return fbm(p + 4.5*r, t*0.6);
  }

  /* ══════════════════════════════════════════════
     PALETA FOGO DOURADO
     0.0 = escuro/fundo, 1.0 = branco elétrico
  ══════════════════════════════════════════════ */
  vec3 firePalette(float t){
    t=clamp(t,0.,1.);
    vec3 c0=vec3(0.05,0.02,0.00);  /* preto/marrom */
    vec3 c1=vec3(0.55,0.18,0.00);  /* laranja escuro */
    vec3 c2=vec3(0.88,0.52,0.05);  /* âmbar */
    vec3 c3=vec3(0.98,0.80,0.25);  /* dourado */
    vec3 c4=vec3(1.00,0.97,0.75);  /* branco dourado */
    vec3 c5=vec3(1.00,1.00,1.00);  /* branco puro — núcleo */

    if(t<0.2) return mix(c0,c1,t/0.2);
    if(t<0.40) return mix(c1,c2,(t-0.2)/0.20);
    if(t<0.60) return mix(c2,c3,(t-0.4)/0.20);
    if(t<0.80) return mix(c3,c4,(t-0.6)/0.20);
    return mix(c4,c5,(t-0.8)/0.20);
  }

  void main(){
    vec2 uv=gl_FragCoord.xy/u_resolution;
    float t=u_time*0.40;

    /* ── Escala de amostragem: amplifica detalhes ── */
    vec2 p=uv*2.2;

    /* ── Warped noise principal ── */
    float n=warpedNoise(p, t);

    /* ── Normaliza para [0,1] ── */
    float energy=(n+1.0)*0.5;

    /* ── Brilho não-linear: enfatiza filamentos brilhantes ── */
    energy=pow(energy,1.1);

    /* ── Segunda camada fina: micro-filamentos rápidos ── */
    float micro=snoise(uv*9.0+vec2(t*1.2,-t*0.8));
    micro=(micro+1.0)*0.5;
    micro=pow(micro,3.0)*0.35;
    energy=clamp(energy+micro,0.,1.);

    /* ── Pulsação de vida ── */
    float pulse=0.88+0.12*sin(t*2.1+uv.y*4.0+uv.x*2.0);
    energy*=pulse;

    /* ══════════════════════════════════════════════
       MÁSCARA CORPORAL — concentra onde Clara está
       Desktop: Clara ~50–90% X, ~0–95% Y
       O gradiente é mais denso onde o corpo está
    ══════════════════════════════════════════════ */

    /* Máscara horizontal: foca no lado direito onde está Clara */
    float mX=smoothstep(0.32,0.58,uv.x) * smoothstep(1.0,0.62,uv.x);

    /* Máscara vertical: cobre do topo ao rodapé com fade nas bordas */
    float mY=smoothstep(0.0,0.06,uv.y) * smoothstep(1.0,0.04,uv.y);

    /* Concentração extra no "núcleo" do corpo (~65-78% X) */
    float bodyCore=smoothstep(0.48,0.68,uv.x)*smoothstep(0.88,0.68,uv.x);
    float bodyMask=(mX*mY)*1.0 + bodyCore*0.5;
    bodyMask=clamp(bodyMask,0.,1.);

    /* Expande a máscara de forma não-linear para cobrir mais silhueta */
    bodyMask=pow(bodyMask,0.45);

    /* Vinheta suave nas bordas do canvas todo */
    float vigX=smoothstep(0.,0.08,uv.x)*smoothstep(1.,0.92,uv.x);
    float vigY=smoothstep(0.,0.04,uv.y)*smoothstep(1.,0.96,uv.y);
    float vignette=vigX*vigY;

    /* ── Cor final via paleta ── */
    vec3 col=firePalette(energy);

    /* ── Alpha: núcleo nítido + halo difuso ── */
    float halo=pow(energy,0.5)*0.22;
    float core=pow(energy,1.6)*0.85;
    float alpha=(core+halo)*bodyMask*vignette;

    /* Clamp final */
    alpha=clamp(alpha,0.,0.92);

    gl_FragColor=vec4(col,alpha);
  }
`;

const EnergyFlow = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef     = useRef<WebGLRenderingContext | null>(null);
  const progRef   = useRef<WebGLProgram | null>(null);
  const rafRef    = useRef<number>(0);
  const t0Ref     = useRef(0);

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
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
        console.warn("EnergyFlow shader:", gl.getShaderInfoLog(s));
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn("EnergyFlow link:", gl.getProgramInfoLog(prog));
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

    /* Renderiza em resolução reduzida para performance — o blur do blend mode cobre */
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.2);
      canvas.width  = canvas.clientWidth  * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);
    t0Ref.current = performance.now();

    const render = () => {
      const t = (performance.now() - t0Ref.current) / 1000;
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
