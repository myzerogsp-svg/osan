import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function run(command, args) {
  try {
    execFileSync(command, args, { cwd: root, stdio: "inherit" });
    return true;
  } catch (error) {
    console.log(`skip ${path.basename(command)}: ${error.message}`);
    return false;
  }
}

const manual = path.join(root, "public/manual.pdf");
run("python3", [path.join(root, "scripts/build-manual.py")]);
if (!existsSync(manual)) {
  console.error("public/manual.pdf 가 없습니다.");
  process.exit(1);
}

const dotnet = [
  process.env.DOTNET_ROOT && path.join(process.env.DOTNET_ROOT, "dotnet"),
  "/usr/local/dotnet/dotnet",
  path.join(root, ".dotnet/dotnet"),
].find((item) => item && existsSync(item));

if (dotnet) {
  run(process.execPath, [path.join(root, "scripts/pack-company-pc.mjs")]);
} else {
  console.log("skip company pc pack");
}
