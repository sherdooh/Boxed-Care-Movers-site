const express = require('express');
const router = express.Router();

router.get('/sitemap.xml', async (req, res) => {
  const baseUrl = 'https://boxedwithcare.co.ke';
  const currentDate = new Date().toISOString().split('T')[0];

  const pages = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/services', changefreq: 'weekly', priority: '0.9' },
    { loc: '/about', changefreq: 'monthly', priority: '0.8' },
    { loc: '/blog', changefreq: 'weekly', priority: '0.9' },
    { loc: '/contact', changefreq: 'monthly', priority: '0.8' },
  ];

  // Add blog posts
  try {
    const content = await fetchSiteContent();
    content.blogPosts.forEach((post) => {
      pages.push({
        loc: `/blog/${post.slug || post.id}`,
        changefreq: 'weekly',
        priority: '0.8',
      });
    });
  } catch (error) {
    console.warn('Could not fetch blog posts for sitemap');
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map((page) => `
    <url>
      <loc>${baseUrl}${page.loc}</loc>
      <lastmod>${currentDate}</lastmod>
      <changefreq>${page.changefreq}</changefreq>
      <priority>${page.priority}</priority>
    </url>
  `).join('')}
</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(sitemap);
});

module.exports = router;