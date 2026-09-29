import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const postsDir = path.join(root, 'public', 'posts');
const blogDir = path.join(root, 'public', 'blog');
const BASE = 'https://www.khunganhframie.io.vn';

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const parseFrontmatter = raw => {
  const match = raw.match(/^---\s*([\s\S]*?)\s*---\s*/);
  if (!match) return {};
  const meta = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (!m) continue;
    meta[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return meta;
};

const template = meta => `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#FDF4F4">
<meta name="description" content="${escapeHtml(meta.seoDescription || meta.excerpt || '')}">
<title>${escapeHtml(meta.seoTitle || meta.title || meta.slug)} | Framie</title>
<link rel="canonical" href="${BASE}/blog/${encodeURIComponent(meta.slug)}">
<link rel="icon" href="/framie-logo.png">
<link rel="stylesheet" href="/styles.css">
<script async src="https://www.googletagmanager.com/gtag/js?id=G-CJDZCZ8FYG"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag("js",new Date());gtag("config","G-CJDZCZ8FYG");</script>
</head>
<body>
<div id="app"></div>
<script src="/config.js"></script>
<script type="module" src="/app.js"></script>
</body>
</html>`;

const files = fs.readdirSync(postsDir)
  .filter(file => file.endsWith('.md'));

for (const file of files) {
  const raw = fs.readFileSync(path.join(postsDir, file), 'utf8');
  const meta = parseFrontmatter(raw);
  const slug = meta.slug || file.replace(/\.md$/, '');
  const dir = path.join(blogDir, slug);

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), template({ ...meta, slug }));
  console.log(`Generated /blog/${slug}/index.html`);
}
