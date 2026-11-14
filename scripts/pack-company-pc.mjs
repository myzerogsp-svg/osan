import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { deflateRawSync } from "node:zlib";

const root = path.resolve(import.meta.dirname, "..");

function kstLabel(date = new Date()) {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const pad = (value) => String(value).padStart(2, "0");
  return `${String(kst.getUTCFullYear()).slice(2)}${pad(kst.getUTCMonth() + 1)}${pad(kst.getUTCDate())}_${pad(kst.getUTCHours())}${pad(kst.getUTCMinutes())}`;
}

const builtAt = new Date();
const buildLabel = kstLabel(builtAt);
writeFileSync(path.join(root, "src/build-info.ts"), `export const BUILD_LABEL = "${buildLabel}";\n`);

execFileSync(process.execPath, [path.join(root, "scripts/build-offline.mjs")], {
  cwd: root,
  stdio: "inherit",
});

const htmlPath = path.join(root, "public/productivity.html");
const centerHtml = path.join(root, "company-pc/launcher/center.html");
const exePath = path.join(root, "company-pc/생산성보기.exe");
const stampPath = path.join(root, "company-pc/launcher/BuildStamp.cs");
copyFileSync(htmlPath, centerHtml);
const htmlBytes = readFileSync(htmlPath);
const htmlStamp = createHash("sha256").update(htmlBytes).digest("hex").slice(0, 16);

function readStamp() {
  try {
    const match = readFileSync(stampPath, "utf8").match(/Value = "([^"]+)"/);
    return match?.[1] ?? "";
  } catch {
    return "";
  }
}

let stamp = readStamp();

const dotnet = [
  process.env.DOTNET_ROOT && path.join(process.env.DOTNET_ROOT, "dotnet"),
  "/usr/local/dotnet/dotnet",
  path.join(root, ".dotnet/dotnet"),
].find((item) => item && existsSync(item));

if (process.env.VERCEL && !dotnet) {
  console.log("vercel build: packing the workspace 생산성보기.exe");
} else if (!dotnet) {
  console.error("회사 PC 프로그램을 다시 만들지 못했습니다. .NET SDK가 없습니다. 예전 생산성보기.exe 는 넣지 않습니다.");
  process.exit(1);
} else {
  const outDir = path.join(root, "company-pc/launcher/bin/publish-single");
  stamp = builtAt.toISOString().replace(/\.\d{3}Z$/, "Z");
  writeFileSync(stampPath, `internal static class BuildStamp\n{\n    public const string Value = "${stamp}";\n    public const string Html = "${htmlStamp}";\n    public const string Label = "${buildLabel}";\n}\n`);
  execFileSync(dotnet, [
    "publish",
    path.join(root, "company-pc/launcher/CenterOpen.csproj"),
    "-c", "Release",
    "-r", "win-x64",
    "--self-contained", "true",
    "-o", outDir,
  ], {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      DOTNET_ROOT: path.dirname(dotnet),
      DOTNET_CLI_TELEMETRY_OPTOUT: "1",
      DOTNET_NOLOGO: "1",
      DOTNET_SKIP_FIRST_TIME_EXPERIENCE: "1",
    },
  });
  copyFileSync(path.join(outDir, "생산성보기.exe"), exePath);
  console.log(`rebuilt ${exePath}`);
}

if (stamp) writeFileSync(path.join(root, "public/company-version.txt"), stamp + "\n");
writeFileSync(path.join(root, "public/company-html.txt"), htmlStamp + "\n");

const files = [
  ["생산성보기.exe", readFileSync(exePath)],
  ["화면.html", htmlBytes],
  ["이렇게하세요.txt", readFileSync(path.join(root, "company-pc/이렇게하세요.txt"))],
];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

const parts = [];
const central = [];
let offset = 0;
for (const [name, data] of files) {
  const nameBuf = Buffer.from(name, "utf8");
  const crc = crc32(data);
  const compressed = deflateRawSync(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0x0800, 6);
  local.writeUInt16LE(8, 8);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  parts.push(local, nameBuf, compressed);
  const cen = Buffer.alloc(46);
  cen.writeUInt32LE(0x02014b50, 0);
  cen.writeUInt16LE(20, 4);
  cen.writeUInt16LE(20, 6);
  cen.writeUInt16LE(0x0800, 8);
  cen.writeUInt16LE(8, 10);
  cen.writeUInt32LE(crc, 16);
  cen.writeUInt32LE(compressed.length, 20);
  cen.writeUInt32LE(data.length, 24);
  cen.writeUInt16LE(nameBuf.length, 28);
  cen.writeUInt32LE(offset, 42);
  central.push(cen, nameBuf);
  offset += local.length + nameBuf.length + compressed.length;
}
const centralBuf = Buffer.concat(central);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralBuf.length, 12);
end.writeUInt32LE(offset, 16);
const zip = Buffer.concat([...parts, centralBuf, end]);
const out = path.join(root, "public/company-pc.zip");
writeFileSync(out, zip);
console.log(`wrote ${out} (${zip.length} bytes)`);
