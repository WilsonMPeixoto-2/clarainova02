# Video Prompts — Hero Section (CLARA)

Guia completo de prompts para geração/remaster dos vídeos do Hero.
Usar em ferramentas externas: Veo, Sora, Runway, Kling, etc.

---

## 1) Prompt Mestre — Desktop (4K / 16:9)

```
Create a premium cinematic hero background video for a modern AI platform website (CLARA), designed for a homepage hero section.

FORMAT & QUALITY
- 16:9 landscape
- 4K UHD (3840x2160), or minimum 2560x1440
- 8 to 10 seconds
- smooth seamless loop
- ultra high image quality, crisp details, premium lighting, no visible compression artifacts

COMPOSITION (CRITICAL FOR WEB HERO LAYOUT)
- Keep the AI character (Clara) positioned on the RIGHT SIDE of the frame (roughly the right 35–40% of the image)
- Leave the LEFT SIDE visually clean and readable for website text overlay (safe area for headline + CTA)
- The character must NEVER drift into the left text area
- Preserve a stable composition across the entire clip (no reframing that invades the left safe zone)

STYLE & MOOD
- Futuristic, elegant, institutional-premium, cinematic but clean
- Premium "Awwwards-level" website hero aesthetic
- Dark sophisticated background with subtle luminous gradients (deep navy / graphite / charcoal tones)
- Soft blue/cyan energy accents, optional subtle gold accents
- High-end volumetric lighting, refined glow, controlled contrast
- Visually impressive but not noisy; must support readability of overlay text

CHARACTER & MOTION
- AI consultant / digital assistant presence (Clara), polished and confident
- Gentle, subtle motion only (micro head movement, soft breathing, slight ambient motion)
- No aggressive camera motion
- No dramatic zooms, no shake, no handheld look
- Camera should feel stable and premium, suitable for a website background
- The face must remain sharp and visually prominent on the right side

BACKGROUND FX
- Subtle futuristic ambient particles / energy lines / soft light streaks
- Effects should enhance the premium feel but remain secondary to the character
- Effects must not cross heavily over the face
- No clutter, no busy background, no distracting flashing elements

LOOPING
- Seamless loop required
- Start and end frames should match naturally (light motion and ambience loop cleanly)
- No jump cuts or hard transitions

WEB-HERO COMPATIBILITY
- No text, no captions, no UI overlays
- No logos, no watermarks, no brand marks
- No subtitles
- No lower-third graphics
- Keep bottom-right area visually clean (avoid critical details there)

OUTPUT LOOK
- Hyper-clean, high-definition, premium, refined, polished
- Suitable as a hero video background for a professional AI institutional website

The visual quality should match a premium award-level website hero (Awwwards-style): cinematic, ultra
```

---

## 2) Prompt Mestre — Mobile (9:16 vertical)

```
Create a premium cinematic vertical hero background video for a modern AI platform website (CLARA), optimized for mobile homepage hero.

FORMAT & QUALITY
- 9:16 vertical
- 1080x1920 (minimum), high quality
- 8 to 10 seconds
- smooth seamless loop
- sharp details, premium lighting, no compression artifacts

COMPOSITION (CRITICAL FOR MOBILE HERO)
- Keep the AI character (Clara) in the upper-middle to upper-right area of the frame
- Preserve a clean area for mobile text overlay below the focal area
- The face must not be placed too low (avoid conflict with mobile headline/CTA)
- Composition must remain stable throughout the clip

STYLE & MOOD
- Same visual identity as desktop version
- Futuristic, elegant, premium institutional aesthetic
- Dark refined background with subtle blue/cyan glow and controlled contrast
- Cinematic but clean, optimized for readability of mobile UI text

CHARACTER & MOTION
- Subtle, graceful motion only
- No camera shake
- No fast movement
- Face sharp, visually strong, premium look

BACKGROUND FX
- Soft ambient futuristic motion only
- Keep effects light and non-distracting
- No heavy particles crossing the face

LOOPING
- Seamless loop required
- No jump cuts or hard transitions

WEB-HERO COMPATIBILITY
- No text, no logos, no watermark, no captions, no UI elements
- Keep the frame clean for mobile interface overlay

OUTPUT LOOK
- Premium, crisp, cinematic vertical hero video for a top-tier website
```

---

## 3) Prompt de Remaster/Upscale (video-to-video)

```
Remaster and upscale this reference hero video into a premium website hero background while preserving the same character identity and overall composition style.

GOALS
- Increase image quality significantly (target 4K or 1440p desktop output)
- Improve sharpness, facial clarity, texture detail, and lighting quality
- Remove low-resolution softness and visible compression artifacts
- Preserve the elegant cinematic aesthetic and the character's visual identity

COMPOSITION (DO NOT BREAK)
- Keep the character on the RIGHT SIDE of the frame
- Maintain a clean LEFT SIDE safe area for website text overlay
- Do not reframe the character into the center-left
- Keep composition stable for web hero use

MOTION
- Preserve subtle ambient motion only
- Smooth motion interpolation if needed
- No jitter, no flicker, no sudden movement, no camera shake

LOOK & STYLE
- Premium futuristic AI hero aesthetic
- Dark refined background, subtle blue/cyan glow, controlled highlights
- High-end cinematic finish with clean contrast
- Crisp and polished, suitable for a premium institutional website hero section

LOOP
- Preserve or improve seamless looping behavior
- No visible start/end jump

CLEAN OUTPUT
- No text, no watermark, no logos, no subtitles, no UI overlays
```

---

## 4) Negative Prompt

```
low resolution, blurry face, soft focus, compression artifacts, pixelation, banding, noise, flicker, jitter, camera shake, handheld camera, aggressive motion, fast zoom, dramatic cuts, jump cuts, cluttered background, distracting particles, particles crossing face, overexposed highlights, muddy shadows, washed-out image, low contrast, oversaturated colors, text, captions, subtitles, logo, watermark, UI overlay, lower-third, distorted face, deformed features, uncanny expression
```

---

## 5) Parâmetros de Exportação

### A) Arquivo Mestre

| Parâmetro       | Desktop          | Mobile          |
|-----------------|------------------|-----------------|
| Resolução       | 3840×2160 (4K)   | 1080×1920       |
| FPS             | 24 ou 30         | 24 ou 30        |
| Codec           | ProRes 422 / DNxHR / MP4 alto bitrate | idem |

### B) Versão Web (para o site)

| Parâmetro       | Desktop          | Mobile          |
|-----------------|------------------|-----------------|
| Formato         | MP4 (H.264 High Profile) | idem   |
| GOP             | ~2s              | ~2s             |
| Bitrate (4K)    | 20–35 Mbps       | —               |
| Bitrate (1440p) | 12–20 Mbps       | —               |
| Bitrate (mobile)| —                | 8–14 Mbps       |
| Áudio           | pode manter (site usa muted) | idem |

### C) Poster (fallback)

- Desktop: frame 4K em JPEG/WebP
- Mobile: frame 1080×1920 em JPEG/WebP
- Usado para: `prefers-reduced-motion`, carregamento inicial, conexões lentas

---

## 6) Prompt de Export (se a ferramenta aceitar)

```
Export settings for website hero video:
- deliver final desktop version in 4K (3840x2160) and 1440p (2560x1440)
- deliver final mobile version in 1080x1920 (vertical)
- preserve sharpness and facial detail
- avoid over-compression
- clean output with no text, no watermark, no logo
- seamless loop
- color-balanced for web (clean contrast, no crushed blacks, no blown highlights)
```

---

## 7) Ordem de Execução

1. **Gerar desktop premium** → `clara-hero-desktop-4k.mp4`
2. **Gerar mobile vertical** → `clara-hero-mobile-1080x1920.mp4`
3. **Extrair posters** → `clara-hero-poster-4k.jpg` + `clara-hero-poster-mobile.jpg`
4. **Integrar no projeto** → substituir assets e atualizar HeroSection

---

## Assets Atuais no Projeto

| Arquivo | Uso |
|---------|-----|
| `public/videos/clara-hero.mp4` | Vídeo desktop atual (1280×720) |
| `src/assets/clara-hero.jpg` | Poster/fallback atual |
