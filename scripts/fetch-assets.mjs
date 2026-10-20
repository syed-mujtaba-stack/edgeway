// Downloads the binary assets (photos, fonts, icons) that are not part of the
// text-only Vercel upload, so `npm run build` produces a complete `dist/`.
//
// Locally the files are already in `public/`, so this is a no-op. On Vercel it
// runs via the `prebuild` npm script and fetches whatever is missing from the
// project's public asset bucket.
import { createWriteStream } from "node:fs";
import { mkdir, readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const root = resolve(import.meta.dirname, "..");
const manifestPath = join(root, "scripts", "assets.manifest.json");
const publicDir = join(root, "public");

const exists = async (path) => {
  try {
    const info = await stat(path);
    return info.size > 0;
  } catch {
    return false;
  }
};

const download = async (url, target) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  await mkdir(dirname(target), { recursive: true });
  await pipeline(Readable.fromWeb(response.body), createWriteStream(target));
};

const main = async () => {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const base = (process.env.SITE_ASSETS_BASE_URL || manifest.baseUrl).replace(/\/+$/, "");

  const missing = [];
  for (const file of manifest.files) {
    if (!(await exists(join(publicDir, file)))) missing.push(file);
  }

  if (missing.length === 0) {
    console.log(`assets: all ${manifest.files.length} files present`);
    return;
  }

  console.log(`assets: fetching ${missing.length}/${manifest.files.length} from ${base}`);
  let failures = 0;

  // small concurrency so the build step stays quick
  const queue = [...missing];
  const worker = async () => {
    for (let next = queue.shift(); next; next = queue.shift()) {
      try {
        await download(`${base}/${next}`, join(publicDir, next));
        process.stdout.write(".");
      } catch (error) {
        failures += 1;
        console.error(`\nassets: failed ${next} — ${error.message}`);
      }
    }
  };

  await Promise.all(Array.from({ length: 6 }, worker));
  process.stdout.write("\n");

  if (failures > 0) {
    console.error(`assets: ${failures} file(s) could not be fetched — the build would ship broken images`);
    process.exit(1);
  }
  console.log(`assets: ready (${missing.length} downloaded)`);
};

await main();
