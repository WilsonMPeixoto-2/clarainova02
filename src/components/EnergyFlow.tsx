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
    for(int i=0;i<6;i++){
      v+=amp*snoise(p*freq+vec2(t*0.22,-t*0.15));
      amp*=0.48;
      freq*=2.1;
      p=p*1.15+vec2(0.3,0.7);
    }
    return v;
  }

  float warpedNoise(vec2 p, float t){
    vec2 q=vec2(
      fbm(p + vec2(0.00, 0.00), t),
      fbm(p + vec2(5.20, 1.30), t+0.5)
    );
    vec2 r=vec2(
      fbm(p + 4.2*q + vec2(1.70, 9.20), t*0.85),
      fbm(p + 4.2*q + vec2(8.30, 2.80), t*0.85+0.3)
    );
    vec2 s=vec2(
      fbm(p + 3.5*r + vec2(3.10, 7.40), t*0.7),
      fbm(p + 3.5*r + vec2(6.50, 4.10), t*0.7+0.2)
    );
    return fbm(p + 5.0*s, t*0.5);
  }

  /* Segunda variação de warp para camada de detalhe */
  float warpedNoise2(vec2 p, float t){
    vec2 q=vec2(
      fbm(p + vec2(2.10, 3.80), t*1.1),
      fbm(p + vec2(7.40, 0.60), t*1.1+0.4)
    );
    vec2 r=vec2(
      fbm(p + 3.6*q + vec2(4.20, 1.80), t*0.9),
      fbm(p + 3.6*q + vec2(0.90, 6.30), t*0.9+0.5)
    );
    return fbm(p + 4.0*r, t*0.65);
  }

  vec3 firePalette(float t){
    t=clamp(t,0.,1.);
    vec3 c0=vec3(0.04,0.01,0.00);
    vec3 c1=vec3(0.45,0.12,0.00);
    vec3 c2=vec3(0.80,0.38,0.02);
    vec3 c3=vec3(0.95,0.65,0.12);
    vec3 c4=vec3(1.00,0.88,0.45);
    vec3 c5=vec3(1.00,0.98,0.85);

    if(t<0.15) return mix(c0,c1,t/0.15);
    if(t<0.30) return mix(c1,c2,(t-0.15)/0.15);
    if(t<0.50) return mix(c2,c3,(t-0.30)/0.20);
    if(t<0.75) return mix(c3,c4,(t-0.50)/0.25);
    return mix(c4,c5,(t-0.75)/0.25);
  }

  void main(){
    vec2 uv=gl_FragCoord.xy/u_resolution;
    float t=u_time*0.35;

    /* ── Camada principal: plasma denso ── */
    vec2 p1=uv*2.5;
    float n1=warpedNoise(p1, t);
    float e1=(n1+1.0)*0.5;
    e1=pow(e1,0.95);

    /* ── Camada 2: filamentos rápidos ── */
    vec2 p2=uv*3.8+vec2(t*0.1,0.0);
    float n2=warpedNoise2(p2, t*1.3);
    float e2=(n2+1.0)*0.5;
    e2=pow(e2,1.3)*0.6;

    /* ── Camada 3: micro-detalhes ultra-rápidos ── */
    float micro1=snoise(uv*12.0+vec2(t*1.5,-t*1.1));
    float micro2=snoise(uv*18.0+vec2(-t*0.9,t*1.4));
    float micro=(micro1+micro2+2.0)*0.25;
    micro=pow(micro,3.5)*0.25;

    /* ── Camada 4: ondulações lentas de fundo ── */
    float slow=snoise(uv*1.2+vec2(t*0.08,t*0.05));
    slow=(slow+1.0)*0.5;
    slow=pow(slow,0.6)*0.3;

    /* ── Combinação ── */
    float energy=clamp(e1 + e2 + micro + slow, 0.0, 1.0);

    /* ── Pulsação orgânica multi-frequência ── */
    float pulse=0.85
      + 0.08*sin(t*1.8+uv.y*5.0+uv.x*3.0)
      + 0.05*sin(t*3.2+uv.y*8.0-uv.x*2.0)
      + 0.04*sin(t*5.5+uv.x*12.0);
    energy*=pulse;

    /* ── Filamentos brilhantes (ridge noise) ── */
    float ridge1=abs(snoise(uv*5.0+vec2(t*0.4,-t*0.3)));
    float ridge2=abs(snoise(uv*8.0+vec2(-t*0.5,t*0.35)));
    float ridges=1.0 - (ridge1*ridge2);
    ridges=pow(ridges, 4.0)*0.35;
    energy=clamp(energy+ridges, 0.0, 1.0);

    /* ══════════════════════════════════════════════
       MÁSCARA CORPORAL
    ══════════════════════════════════════════════ */
    float mX=smoothstep(0.30,0.55,uv.x) * smoothstep(1.0,0.60,uv.x);
    float mY=smoothstep(0.0,0.05,uv.y) * smoothstep(1.0,0.03,uv.y);
    float bodyCore=smoothstep(0.45,0.65,uv.x)*smoothstep(0.90,0.65,uv.x);
    float bodyMask=(mX*mY)*1.0 + bodyCore*0.6;
    bodyMask=clamp(bodyMask,0.,1.);
    bodyMask=pow(bodyMask,0.4);

    float vigX=smoothstep(0.,0.06,uv.x)*smoothstep(1.,0.94,uv.x);
    float vigY=smoothstep(0.,0.03,uv.y)*smoothstep(1.,0.97,uv.y);
    float vignette=vigX*vigY;

    /* ── Cor via paleta ── */
    vec3 col=firePalette(energy);

    /* ── Boost de brilho nos picos ── */
    col+=vec3(1.0,0.95,0.7)*pow(energy,3.0)*0.5;

    /* ── Alpha com mais presença ── */
    float halo=pow(energy,0.4)*0.28;
    float core=pow(energy,1.4)*0.90;
    float alpha=(core+halo)*bodyMask*vignette;
    alpha=clamp(alpha,0.,0.95);

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
