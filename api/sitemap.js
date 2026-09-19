import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://www.khunganhframie.io.vn';

export default function handler(req, res) {
  const fixedRoutes = [
    '/',
    '/about',
    '/shop',
    '/templates',
    '/blog',
    '/contact',
    '/policy'
  ];

  const postsDir = path.join(process.cwd(), 'public', 'posts');
  let blogSlugs = [];

  try {
    blogSlugs = fs.readdirSync(postsDir)
      .filter(name => name.endsWith('.md'))
      .map(name => name.slice(0, -3))
      .filter(Boolean)
      .sort();
  } catch {
    blogSlugs = [];
  }

  const urls = [
    ...fixedRoutes,
    ...blogSlugs.map(slug => `/blog/${slug}`)
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${BASE}${url}</loc>
  </url>`).join('\n')}
</urlset>`;

  res.writeHead(200, {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600, s-maxage=3600'
  });
  res.end(xml);
}
