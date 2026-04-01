import { writeFileSync } from "fs";

const BASE = "https://opbento.vercel.app";

const PARAMS = {
  n: "Jinef",
  i: "https://avatars.githubusercontent.com/u/137093087", // GitHub avatar (reliable)
  g: "jinef-john",
  x: "jinefjohn",
  l: "",
  p: "https://jinef.netlify.app/",
  z: "7708f",
};

const variants = [
  // 1. GitHub avatar (most reliable image src)
  { ...PARAMS },
  // 2. No avatar at all
  { ...PARAMS, i: "" },
  // 3. Original MIT image
  {
    ...PARAMS,
    i: "https://news.mit.edu/sites/default/files/styles/news_article__image_gallery/public/images/202012/MIT-Coding-Brain-01-press_0.jpg?itok=JKoUflf8",
  },
  // 4. z param from the HAR capture session
  { ...PARAMS, z: "b979d" },
];
const TIMEOUT_MS = 30000; // 30s — opbento image gen can be slow

async function probe(label, params) {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE}/api/bento?${qs}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    const ct = res.headers.get("content-type") ?? "";
    const buf = Buffer.from(await res.arrayBuffer());
    const isPng = buf[0] === 0x89 && buf[1] === 0x50;
    const isSvg =
      buf.slice(0, 5).toString().trim().startsWith("<svg") ||
      buf.slice(0, 5).toString().trim().startsWith("<?xml");
    console.log(
      `[${label}] status=${res.status} ct=${ct.split(";")[0]} size=${buf.length}B${isPng ? " ✓ PNG" : isSvg ? " ✓ SVG" : ""}`,
    );
    if (!isPng && !isSvg) {
      console.log(`  body: ${buf.slice(0, 120).toString()}`);
    }
    return { isPng, isSvg, buf, label };
  } catch (e) {
    console.log(`[${label}] ERROR: ${e.message}`);
    return null;
  }
}

async function checkDataApis() {
  console.log("\n--- Checking data APIs (should still work) ---");
  for (const path of [
    `/api/stats?username=jinef-john`,
    `/api/streak?username=jinef-john`,
  ]) {
    try {
      const res = await fetch(BASE + path, {
        signal: AbortSignal.timeout(10000),
      });
      const body = await res.text();
      console.log(`${path}: ${res.status} — ${body.slice(0, 100)}`);
    } catch (e) {
      console.log(`${path}: ERROR ${e.message}`);
    }
  }
}

console.log("=== opbento /api/bento probe ===\n");
const results = await Promise.all(
  variants.map((p, i) => probe(`variant-${i + 1}`, p)),
);

await checkDataApis();

// Save the first working image
const winner = results.find((r) => r && (r.isPng || r.isSvg));
if (winner) {
  const ext = winner.isPng ? "png" : "svg";
  const outPath = `/tmp/bento_result.${ext}`;
  writeFileSync(outPath, winner.buf);
  console.log(`\n✓ Saved to ${outPath} (${winner.label})`);
} else {
  console.log(
    "\n✗ No valid image returned from any variant. API appears to be down.",
  );
}
