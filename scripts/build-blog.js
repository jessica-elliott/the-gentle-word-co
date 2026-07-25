// The Gentle Word Co. — Static Site Builder
// Markdown → HTML generator with future-date filtering
// Run: npm run build

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const ROOT = process.cwd();
const POSTS_DIR = path.join(ROOT, 'posts');
const OUT_DIR = path.join(ROOT, '_site');
const SITE_URL = 'https://thegentlewordco.com';
const TODAY = new Date();

// ── Helpers ──
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function readingTime(text) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Setup output directories ──
ensureDir(OUT_DIR);
ensureDir(path.join(OUT_DIR, 'blog'));
ensureDir(path.join(OUT_DIR, 'assets'));

// Copy static assets
fs.cpSync(path.join(ROOT, 'assets'), path.join(OUT_DIR, 'assets'), { recursive: true });

// ── Copy pages to directory-based routes ──
// / → _site/index.html
fs.copyFileSync(
  path.join(ROOT, 'pages', 'index.html'),
  path.join(OUT_DIR, 'index.html')
);

// /gentle-reset-starter-kit/ → _site/gentle-reset-starter-kit/index.html
ensureDir(path.join(OUT_DIR, 'gentle-reset-starter-kit'));
fs.copyFileSync(
  path.join(ROOT, 'pages', 'starter-kit.html'),
  path.join(OUT_DIR, 'gentle-reset-starter-kit', 'index.html')
);

// /404.html → custom not-found page
fs.copyFileSync(
  path.join(ROOT, 'pages', '404.html'),
  path.join(OUT_DIR, '404.html')
);

// ── Read and process blog posts ──
let posts = [];
if (fs.existsSync(POSTS_DIR)) {
  posts = fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(file => {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
      const { data, content } = matter(raw);
      return {
        title: data.title || 'Untitled',
        excerpt: data.excerpt || '',
        image: data.image || '',
        author: data.author || 'Jessica',
        category: data.category || 'Uncategorized',
        tags: data.tags || [],
        publishDate: data.publishDate || data.date || new Date().toISOString(),
        slug: file.replace(/\.md$/, ''),
        content: marked.parse(content),
        readingTime: readingTime(content)
      };
    })
    .filter(p => new Date(p.publishDate) <= TODAY) // Only published posts
    .sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
}

// ── Generate individual blog post pages ──
posts.forEach((post, i) => {
  const postDir = path.join(OUT_DIR, 'blog', post.slug);
  ensureDir(postDir);

  const related = posts
    .filter((p, j) => j !== i)
    .filter(p => {
      const sharedTags = p.tags.filter(t => post.tags.includes(t));
      const sharedCategory = p.category === post.category;
      return sharedTags.length > 0 || sharedCategory;
    })
    .slice(0, 2);

  const relatedHtml = related.length
    ? related.map(p => `
        <a href="/blog/${p.slug}/" class="card card-flush" style="text-decoration:none;color:inherit;display:block;">
          ${p.image ? `<img src="${p.image}" alt="" style="height:140px;object-fit:cover;border-radius:8px;margin-bottom:1rem;" loading="lazy">` : ''}
          <h3 style="font-size:1.2rem;margin-bottom:0.5rem;">${escapeHtml(p.title)}</h3>
          <p style="font-size:0.9rem;color:var(--text-light);">${escapeHtml(p.excerpt)}</p>
        </a>`).join('')
    : '<p style="color:var(--text-light);">No related articles yet.</p>';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(post.title)} • The Gentle Word Co.</title>
  <meta name="description" content="${escapeHtml(post.excerpt)}">
  <link rel="stylesheet" href="/assets/css/main.css">
  <link rel="canonical" href="${SITE_URL}/blog/${post.slug}/">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(post.title)}">
  <meta property="og:description" content="${escapeHtml(post.excerpt)}">
  <meta property="og:url" content="${SITE_URL}/blog/${post.slug}/">
  ${post.image ? `<meta property="og:image" content="${post.image}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(post.title)}">
  <meta name="twitter:description" content="${escapeHtml(post.excerpt)}">
  ${post.image ? `<meta name="twitter:image" content="${post.image}">` : ''}
  <meta property="article:published_time" content="${new Date(post.publishDate).toISOString()}">
  <meta property="article:author" content="${escapeHtml(post.author)}">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": "${escapeHtml(post.title)}",
    "description": "${escapeHtml(post.excerpt)}",
    "datePublished": "${new Date(post.publishDate).toISOString()}",
    "author": { "@type": "Person", "name": "${escapeHtml(post.author)}" },
    "publisher": { "@type": "Organization", "name": "The Gentle Word Co." },
    ${post.image ? `"image": "${post.image}",` : ''}
    "mainEntityOfPage": "${SITE_URL}/blog/${post.slug}/"
  }
  </script>
</head>
<body>
  <a href="#main" class="skip-link">Skip to content</a>
  <header>
    <nav class="container" aria-label="Primary navigation">
      <a href="/" class="logo">The Gentle Word Co.</a>
      <button class="nav-toggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="nav-links">
        <span></span><span></span><span></span>
      </button>
      <div class="nav-links" id="nav-links">
        <a href="/gentle-reset-starter-kit/">The Starter Kit</a>
        <a href="/blog/">Journal</a>
      </div>
    </nav>
  </header>

  <main id="main">
    <article class="blog-post container" style="padding: 2rem 0 5rem;">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a><span>/</span><a href="/blog/">Journal</a><span>/</span>${escapeHtml(post.title)}
      </nav>
      ${post.image ? `<img src="${post.image}" alt="${escapeHtml(post.title)}" style="width:100%;border-radius:var(--radius);margin-bottom:2rem;" loading="lazy">` : ''}
      <h1>${escapeHtml(post.title)}</h1>
      <div class="blog-meta">
        ${formatDate(post.publishDate)} · ${post.readingTime} min read · by ${escapeHtml(post.author)}
      </div>
      <div class="blog-content">
        ${post.content}
      </div>

      <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #EDE4D8;">
        <p style="font-size: 0.95rem; color: var(--text-light);">If this post encouraged you, consider sharing it with a friend who needs gentle words today.</p>
      </div>

      ${related.length ? `
      <section style="margin-top: 3rem;">
        <h2 style="font-size: 1.4rem; margin-bottom: 1.5rem;">Related Reading</h2>
        <div class="grid-cards">${relatedHtml}</div>
      </section>` : ''}
    </article>
  </main>

  <footer>
    <div class="container footer-content">
      <div>© 2026 The Gentle Word Co. All rights reserved.</div>
      <div class="footer-links">
        <a href="/">Home</a>
        <a href="/gentle-reset-starter-kit/">Free Starter Kit</a>
        <a href="https://thegentlewordco.gumroad.com/l/lgkqk" target="_blank" rel="noopener">7-Day Gentle Reset</a>
        <a href="/blog/">Journal</a>
      </div>
    </div>
  </footer>
  <script src="/assets/js/main.js"></script>
</body>
</html>`;

  fs.writeFileSync(path.join(postDir, 'index.html'), html);
});

// ── Generate blog index page ──
const blogIndexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Gentle Journal • The Gentle Word Co.</title>
  <meta name="description" content="Quiet reflections, encouragement, and truth for the woman learning to walk gently.">
  <link rel="stylesheet" href="/assets/css/main.css">
  <link rel="canonical" href="${SITE_URL}/blog/">
  <meta property="og:type" content="website">
  <meta property="og:title" content="The Gentle Journal • The Gentle Word Co.">
  <meta property="og:description" content="Quiet reflections, encouragement, and truth for the woman learning to walk gently.">
  <meta property="og:url" content="${SITE_URL}/blog/">
  <meta property="og:image" content="${SITE_URL}/assets/images/og-blog.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="The Gentle Journal • The Gentle Word Co.">
  <meta name="twitter:description" content="Quiet reflections, encouragement, and truth for the woman learning to walk gently.">
</head>
<body>
  <a href="#main" class="skip-link">Skip to content</a>
  <header>
    <nav class="container" aria-label="Primary navigation">
      <a href="/" class="logo">The Gentle Word Co.</a>
      <button class="nav-toggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="nav-links">
        <span></span><span></span><span></span>
      </button>
      <div class="nav-links" id="nav-links">
        <a href="/gentle-reset-starter-kit/">The Starter Kit</a>
        <a href="/blog/">Journal</a>
      </div>
    </nav>
  </header>

  <main id="main">
    <div class="container" style="padding: 3rem 0;">
      <nav class="breadcrumbs" aria-label="Breadcrumb" style="margin-bottom: 2rem;">
        <a href="/">Home</a><span>/</span>Journal
      </nav>
      <h1 style="text-align:center; margin-bottom:0.5rem;">The Gentle Journal</h1>
      <p style="text-align:center; color:var(--text-light); max-width:420px; margin:0 auto 3rem;">Quiet reflections, encouragement, and truth for the woman learning to walk gently.</p>

      ${posts.length === 0 ? `
      <div class="empty-state">
        <h3>Gentle words are on the way.</h3>
        <p>The Journal will soon be filled with thoughtful encouragement, practical reflections, and quiet reminders to help you move forward with faith and grace.</p>
        <p style="margin-top:1.5rem;"><a href="/gentle-reset-starter-kit/">Explore the Gentle Reset Starter Kit →</a></p>
      </div>
      ` : `
      <div class="grid-cards" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));">
        ${posts.map(p => `
        <a href="/blog/${p.slug}/" class="card card-flush" style="text-decoration:none;color:inherit;display:block;">
          ${p.image ? `<img src="${p.image}" alt="${escapeHtml(p.title)}" style="height:180px;object-fit:cover;border-radius:8px;margin-bottom:1.25rem;" loading="lazy">` : `<div class="img-placeholder" style="height:180px;margin-bottom:1.25rem;">No image</div>`}
          <span class="eyebrow" style="font-size:0.75rem;">${escapeHtml(p.category)}</span>
          <h3 style="font-size:1.3rem; margin: 0.5rem 0 0.5rem;">${escapeHtml(p.title)}</h3>
          <p style="font-size:0.95rem; color:var(--text-light); margin-bottom:1rem;">${escapeHtml(p.excerpt)}</p>
          <div style="font-size:0.85rem; color:#8B8173;">${formatDate(p.publishDate)} · ${p.readingTime} min read</div>
        </a>
        `).join('')}
      </div>
      `}
    </div>
  </main>

  <footer>
    <div class="container footer-content">
      <div>© 2026 The Gentle Word Co. All rights reserved.</div>
      <div class="footer-links">
        <a href="/">Home</a>
        <a href="/gentle-reset-starter-kit/">Free Starter Kit</a>
        <a href="https://thegentlewordco.gumroad.com/l/lgkqk" target="_blank" rel="noopener">7-Day Gentle Reset</a>
        <a href="/blog/">Journal</a>
      </div>
    </div>
  </footer>
  <script src="/assets/js/main.js"></script>
</body>
</html>`;

fs.writeFileSync(path.join(OUT_DIR, 'blog', 'index.html'), blogIndexHtml);

// ── Generate blog archive page ──
const archiveHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Archive • The Gentle Journal</title>
  <meta name="description" content="Browse all articles in The Gentle Journal.">
  <link rel="stylesheet" href="/assets/css/main.css">
  <link rel="canonical" href="${SITE_URL}/blog/archive/">
</head>
<body>
  <a href="#main" class="skip-link">Skip to content</a>
  <header>
    <nav class="container" aria-label="Primary navigation">
      <a href="/" class="logo">The Gentle Word Co.</a>
      <button class="nav-toggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="nav-links">
        <span></span><span></span><span></span>
      </button>
      <div class="nav-links" id="nav-links">
        <a href="/gentle-reset-starter-kit/">The Starter Kit</a>
        <a href="/blog/">Journal</a>
      </div>
    </nav>
  </header>

  <main id="main">
    <div class="container" style="padding: 3rem 0;">
      <nav class="breadcrumbs" aria-label="Breadcrumb" style="margin-bottom: 2rem;">
        <a href="/">Home</a><span>/</span><a href="/blog/">Journal</a><span>/</span>Archive
      </nav>
      <h1 style="margin-bottom: 2rem;">Archive</h1>
      ${posts.length === 0 ? `
      <div class="empty-state">
        <h3>No articles yet.</h3>
        <p>Articles will appear here as they are published.</p>
      </div>
      ` : `
      <div style="max-width: 680px;">
        ${posts.map(p => `
        <div style="padding: 1.25rem 0; border-bottom: 1px solid #EDE4D8;">
          <div style="font-size:0.85rem; color:#8B8173; margin-bottom:0.25rem;">${formatDate(p.publishDate)}</div>
          <h3 style="font-size:1.25rem; margin-bottom:0.25rem;"><a href="/blog/${p.slug}/">${escapeHtml(p.title)}</a></h3>
          <p style="font-size:0.95rem; color:var(--text-light);">${escapeHtml(p.excerpt)}</p>
        </div>
        `).join('')}
      </div>
      `}
    </div>
  </main>

  <footer>
    <div class="container footer-content">
      <div>© 2026 The Gentle Word Co. All rights reserved.</div>
      <div class="footer-links">
        <a href="/">Home</a>
        <a href="/gentle-reset-starter-kit/">Free Starter Kit</a>
        <a href="https://thegentlewordco.gumroad.com/l/lgkqk" target="_blank" rel="noopener">7-Day Gentle Reset</a>
        <a href="/blog/">Journal</a>
      </div>
    </div>
  </footer>
  <script src="/assets/js/main.js"></script>
</body>
</html>`;

const archiveDir = path.join(OUT_DIR, 'blog', 'archive');
ensureDir(archiveDir);
fs.writeFileSync(path.join(archiveDir, 'index.html'), archiveHtml);

// ── Generate RSS feed ──
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>The Gentle Journal • The Gentle Word Co.</title>
  <link>${SITE_URL}/blog/</link>
  <description>Quiet reflections for Christian women learning to walk in grace.</description>
  <language>en-us</language>
  <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml"/>
  ${posts.map(p => `
  <item>
    <title>${escapeHtml(p.title)}</title>
    <link>${SITE_URL}/blog/${p.slug}/</link>
    <pubDate>${new Date(p.publishDate).toUTCString()}</pubDate>
    <description><![CDATA[${p.excerpt}]]></description>
    <guid>${SITE_URL}/blog/${p.slug}/</guid>
  </item>`).join('')}
</channel>
</rss>`;

fs.writeFileSync(path.join(OUT_DIR, 'blog', 'rss.xml'), rss);

// ── Generate sitemap.xml ──
const staticUrls = [
  { loc: SITE_URL + '/', priority: '1.0', changefreq: 'weekly' },
  { loc: SITE_URL + '/gentle-reset-starter-kit/', priority: '0.9', changefreq: 'monthly' },
  { loc: SITE_URL + '/blog/', priority: '0.8', changefreq: 'weekly' },
  { loc: SITE_URL + '/blog/archive/', priority: '0.5', changefreq: 'monthly' }
];

const postUrls = posts.map(p => ({
  loc: `${SITE_URL}/blog/${p.slug}/`,
  priority: '0.7',
  changefreq: 'monthly',
  lastmod: new Date(p.publishDate).toISOString().split('T')[0]
}));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${[...staticUrls, ...postUrls].map(u => `
  <url>
    <loc>${u.loc}</loc>
    <priority>${u.priority}</priority>
    <changefreq>${u.changefreq}</changefreq>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`).join('')}
</urlset>`;

fs.writeFileSync(path.join(OUT_DIR, 'sitemap.xml'), sitemap);

// ── Generate robots.txt ──
const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml`;

fs.writeFileSync(path.join(OUT_DIR, 'robots.txt'), robots);

// ── Summary ──
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  The Gentle Word Co. — Build Complete');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Posts published: ${posts.length}`);
console.log(`  Routes generated:`);
console.log(`    /                        → _site/index.html`);
console.log(`    /gentle-reset-starter-kit/ → _site/gentle-reset-starter-kit/index.html`);
console.log(`    /blog/                   → _site/blog/index.html`);
console.log(`    /blog/archive/           → _site/blog/archive/index.html`);
posts.forEach(p => console.log(`    /blog/${p.slug}/      → _site/blog/${p.slug}/index.html`));
console.log(`  Feeds: rss.xml, sitemap.xml, robots.txt`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');