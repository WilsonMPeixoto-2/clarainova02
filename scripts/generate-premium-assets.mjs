import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const rootDir = process.cwd();
const sourcePath = path.join(rootDir, "src", "assets", "clara-hero-4k.jpg");
const outputDir = path.join(rootDir, "src", "assets", "generated");

await fs.mkdir(outputDir, { recursive: true });

const variants = [
  {
    name: "clara-hero-premium",
    pipeline: sharp(sourcePath)
      .resize({ width: 3200, withoutEnlargement: true })
      .sharpen({ sigma: 1.1, m1: 1.1, m2: 0.8 }),
  },
  {
    name: "clara-hero-portrait",
    pipeline: sharp(sourcePath)
      .extract({ left: 1820, top: 0, width: 1780, height: 2160 })
      .resize({ width: 1600, withoutEnlargement: true })
      .sharpen({ sigma: 1.05, m1: 1.1, m2: 0.75 }),
  },
];

for (const variant of variants) {
  const avifPath = path.join(outputDir, `${variant.name}.avif`);
  const webpPath = path.join(outputDir, `${variant.name}.webp`);

  await variant.pipeline.clone().avif({ quality: 68, effort: 7 }).toFile(avifPath);
  await variant.pipeline.clone().webp({ quality: 86 }).toFile(webpPath);
}

console.log("Premium assets generated in src/assets/generated");
