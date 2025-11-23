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

const indexPath = path.join(docsDir, "index.html");
const fallbackPath = path.join(docsDir, "404.html");

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, fallbackPath);
  console.log("Created SPA fallback 404.html");
} else {
  console.warn("Index file missing; skipping 404 fallback");
}

const cnameContent = "control-panel.sfdatahub.com";
const cnamePath = path.join(docsDir, "CNAME");
fs.writeFileSync(cnamePath, cnameContent, "utf-8");
console.log("Ensured CNAME for GitHub Pages");
