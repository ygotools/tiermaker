import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const masterdataPath = path.join(projectRoot, "src", "masterdata.ts");
const outputDir = path.join(projectRoot, "public", "static", "deckimages");
const assetBaseUrl = "https://storage.googleapis.com/tiermaker-static/deckimages";

function getThemeNames(masterdataSource) {
  const matches = masterdataSource.matchAll(/\/static\/deckimages\/((?:bundled\/)?[a-zA-Z0-9_-]+)\.png/g);

  return [...new Set([...matches].map((match) => match[1]))];
}

async function downloadThemeImage(themeName) {
  const outputPath = path.join(outputDir, `${themeName}.png`);

  if (themeName.startsWith('bundled/')) {
    // New artwork ships with the repository instead of depending on the legacy bucket.
    const buffer = await readFile(outputPath);

    if (!buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      throw new Error(`Invalid bundled PNG: ${themeName}.png`);
    }

    console.log(`Using bundled ${themeName}.png`);
    return;
  }

  const response = await fetch(`${assetBaseUrl}/${themeName}.png`);

  if (!response.ok) {
    throw new Error(`Failed to download ${themeName}.png: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  await writeFile(outputPath, buffer);
  console.log(`Downloaded ${themeName}.png`);
}

async function main() {
  const masterdataSource = await readFile(masterdataPath, "utf8");
  const themeNames = getThemeNames(masterdataSource);

  if (themeNames.length === 0) {
    throw new Error("No deck image theme names were found in src/masterdata.ts");
  }

  await mkdir(outputDir, { recursive: true });

  for (const themeName of themeNames) {
    await downloadThemeImage(themeName);
  }

  console.log(`Prepared ${themeNames.length} deck images in ${outputDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
