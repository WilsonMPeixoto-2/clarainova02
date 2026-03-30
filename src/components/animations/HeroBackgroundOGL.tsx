import { useEffect, useRef } from 'react';
import { Renderer, Camera, Transform, Program, Mesh, Triangle } from 'ogl';

export default function HeroBackgroundOGL() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const renderer = new Renderer({ alpha: true, dpr: 2 });
    const gl = renderer.gl;
    container.appendChild(gl.canvas);

    gl.clearColor(0, 0, 0, 0);

    const camera = new Camera(gl, { fov: 35 });
    camera.position.z = 1;

    const scene = new Transform();
    const geometry = new Triangle(gl);

    const vertex = `
      attribute vec2 uv;
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 0, 1);
      }
    `;

    const fragment = `
      precision highp float;
      uniform float uTime;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      varying vec2 vUv;

      float noise(vec2 p) {
        return sin(p.x * 5.0 + uTime * 0.5) * cos(p.y * 5.0 + uTime * 0.6) * 0.15;
      }

      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float n = noise(p);
        
        float dist = length(p);
        float mixVal = smoothstep(0.0, 1.2, vUv.y + sin(vUv.x * 2.0 + uTime * 0.3) * 0.5);
        vec3 color = mix(uColor1, uColor2, mixVal + n);
        
        float alpha = (1.0 - smoothstep(0.2, 1.0, dist)) * 0.8;
        
        gl_FragColor = vec4(color, alpha);
      }
    `;

    const program = new Program(gl, {
      vertex,
      fragment,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        // Clara-cyan and deep gold mapped to normalized RGB
        uColor1: { value: [0.0, 0.94, 1.0] }, 
        uColor2: { value: [0.93, 0.76, 0.45] },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(scene);

    let requestID: number;
    let isVisible = true;
    
    // Ler tokens formatados se der, senão fallback hardcoded
    program.uniforms.uColor1.value = [0.0, 0.94, 1.0]; // Teal/Cyan normalized RGB
    program.uniforms.uColor2.value = [0.93, 0.76, 0.45]; // Gold 2 normalized RGB

    const update = (t: number) => {
      if (!isVisible) {
        requestID = requestAnimationFrame(update);
        return;
      }
      program.uniforms.uTime.value = t * 0.001;
      renderer.render({ scene, camera });
      requestID = requestAnimationFrame(update);
    };
    requestID = requestAnimationFrame(update);

    const resize = () => {
      renderer.setSize(containerRef.current!.offsetWidth, containerRef.current!.offsetHeight);
      camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    };
    
    const observer = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
    }, { threshold: 0 });
    observer.observe(container);
    
    window.addEventListener('resize', resize);
    resize();

    return () => {
      window.removeEventListener('resize', resize);
      observer.disconnect();
      cancelAnimationFrame(requestID);
      const glCanvas = gl.canvas;
      if (container.contains(glCanvas)) {
        container.removeChild(glCanvas);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none transition-opacity duration-1000"
      aria-hidden="true"
    />
  );
}
