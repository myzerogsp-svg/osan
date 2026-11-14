import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
execFileSync("python3", [path.join(root, "scripts/build-manual.py")], {
  cwd: root,
  stdio: "inherit",
});
execFileSync("npx", ["vite", "build", "--config", "vite.offline.config.ts"], {
  cwd: root,
  stdio: "inherit",
});

const outDir = path.join(root, "dist-offline");
const assets = path.join(outDir, "assets");
const names = readdirSync(assets);
const js = names.find((name) => name.endsWith(".js"));
const css = names.find((name) => name.endsWith(".css"));
if (!js || !css) throw new Error("오프라인 묶음에서 js/css를 찾지 못했습니다.");

const script = readFileSync(path.join(assets, js), "utf8").replaceAll("</script", "<\\/script");
const style = readFileSync(path.join(assets, css), "utf8").replaceAll("</style", "<\\/style");

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>센터 생산성</title>
<style>${style}</style>
</head>
<body>
<div id="root"></div>
<script>window.__WB__="";window.__WB_NAME__="";window.__WB_FILES__=[];</script>
<script type="module">${script}</script>
</body>
</html>
`;

mkdirSync(path.join(root, "public"), { recursive: true });
const file = path.join(root, "public", "productivity.html");
writeFileSync(file, html);
console.log(`wrote ${file} (${html.length} bytes)`);
