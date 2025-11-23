import fs from "fs";
import path from "path";

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, "dist");
const docsDir = path.join(projectRoot, "docs");

if (!fs.existsSync(distDir)) {
  console.error("dist directory is missing. Run `npm run build` first.");
  process.exit(1);
}

fs.rmSync(docsDir, { recursive: true, force: true });
fs.mkdirSync(docsDir, { recursive: true });

const copyRecursive = (source, target) => {
  const entries = fs.readdirSync(source, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(targetPath, { recursive: true });
      copyRecursive(sourcePath, targetPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
};

copyRecursive(distDir, docsDir);
console.log("Copied dist to docs/");
