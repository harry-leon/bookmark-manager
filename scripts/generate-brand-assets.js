const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SOURCE_IMAGE = "C:/Users/htquo/.gemini/antigravity/brain/c6fd0b87-af4b-42a5-864e-4cc5341e449c/.user_uploaded/media_1792755516129_08d438b5.png";
const PUBLIC_DIR = path.resolve(__dirname, "../public");
const APP_DIR = path.resolve(__dirname, "../app");

function createIcoFromPngs(images) {
  // images: array of { width, height, buffer }
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // image count

  let currentOffset = 6 + count * 16;
  const entries = [];
  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(img.buffer.length, 8); // size
    entry.writeUInt32LE(currentOffset, 12); // offset
    entries.push(entry);
    currentOffset += img.buffer.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((img) => img.buffer)]);
}

async function main() {
  console.log("Reading source image from:", SOURCE_IMAGE);
  const src = sharp(SOURCE_IMAGE);

  // 1. Icon symbol alone: { minX: 281, minY: 183, width: 466, height: 489 }
  // We extract the icon symbol with a small margin and make it a clean square
  const iconRaw = await sharp(SOURCE_IMAGE)
    .extract({ left: 270, top: 175, width: 486, height: 504 })
    .toBuffer();

  // Create a 512x512 canvas with the icon symbol centered and slightly padded (e.g., 470x470)
  const iconSymbol512 = await sharp(iconRaw)
    .resize(470, 470, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: 21,
      bottom: 21,
      left: 21,
      right: 21,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // 2. Full logo: Symbol + LinkStack + Tagline
  // Bounding box was { minX: 83, minY: 183, width: 869, height: 752 }
  const fullLogoTrimmed = await sharp(SOURCE_IMAGE)
    .extract({ left: 75, top: 170, width: 885, height: 775 })
    .png()
    .toBuffer();

  // Write public/logo-icon.png and public/icon.png
  fs.writeFileSync(path.join(PUBLIC_DIR, "logo-icon.png"), iconSymbol512);
  fs.writeFileSync(path.join(PUBLIC_DIR, "icon.png"), iconSymbol512);
  fs.writeFileSync(path.join(APP_DIR, "icon.png"), iconSymbol512);

  // Write Apple Touch Icon (180x180)
  const appleIcon = await sharp(iconSymbol512)
    .resize(180, 180, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(PUBLIC_DIR, "apple-icon.png"), appleIcon);
  fs.writeFileSync(path.join(APP_DIR, "apple-icon.png"), appleIcon);

  // Write Full Logo (public/logo.png)
  fs.writeFileSync(path.join(PUBLIC_DIR, "logo.png"), fullLogoTrimmed);

  // Generate multi-size favicon.ico (16x16, 32x32, 48x48)
  const [png16, png32, png48] = await Promise.all([
    sharp(iconSymbol512).resize(16, 16).png().toBuffer(),
    sharp(iconSymbol512).resize(32, 32).png().toBuffer(),
    sharp(iconSymbol512).resize(48, 48).png().toBuffer(),
  ]);

  const icoBuffer = createIcoFromPngs([
    { width: 16, height: 16, buffer: png16 },
    { width: 32, height: 32, buffer: png32 },
    { width: 48, height: 48, buffer: png48 },
  ]);

  fs.writeFileSync(path.join(PUBLIC_DIR, "favicon.ico"), icoBuffer);
  fs.writeFileSync(path.join(APP_DIR, "favicon.ico"), icoBuffer);

  console.log("Successfully generated all brand assets:");
  console.log("  - public/logo-icon.png (512x512)");
  console.log("  - public/icon.png (512x512)");
  console.log("  - app/icon.png (512x512)");
  console.log("  - public/apple-icon.png (180x180)");
  console.log("  - app/apple-icon.png (180x180)");
  console.log("  - public/logo.png");
  console.log("  - public/favicon.ico");
  console.log("  - app/favicon.ico");
}

main().catch((err) => {
  console.error("Error generating brand assets:", err);
  process.exit(1);
});
