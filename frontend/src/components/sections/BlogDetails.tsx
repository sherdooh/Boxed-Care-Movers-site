import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Copy, Share2, MessageCircle, Package } from 'lucide-react';
import Footer from '../layout/Footer';
import { SiteContent, BlogPost } from '../../lib/siteContent';
import { estimateReadingTime, slugifyBlogTitle, splitIntoParagraphs } from '../../lib/blogUtils';




interface BlogDetailsProps {
  content: SiteContent;
  post: BlogPost;
  posts: BlogPost[];
}

export default function BlogDetails({ content, post, posts }: BlogDetailsProps) {
  const [copyStatus, setCopyStatus] = useState('');

  const currentSlug = post.slug || slugifyBlogTitle(post.title);
  const currentIndex = useMemo(() => {
    return posts.findIndex((item) => (item.slug || slugifyBlogTitle(item.title)) === currentSlug);
  }, [currentSlug, posts]);

  const previousPost = currentIndex > 0 ? posts[currentIndex - 1] : null;
  const nextPost = currentIndex >= 0 && currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;
  const relatedPosts = posts
    .filter((item) => (item.slug || slugifyBlogTitle(item.title)) !== currentSlug)
    .sort((a, b) => {
      if (a.category === post.category && b.category !== post.category) return -1;
      if (a.category !== post.category && b.category === post.category) return 1;
      return 0;
    })
    .slice(0, 3);

  const articleUrl = typeof window !== 'undefined' ? window.location.href : `/blog/${currentSlug}`;
  const shareText = encodeURIComponent(`${post.title} | ${content.siteName}`);
  const encodedUrl = encodeURIComponent(articleUrl);

  const onCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(articleUrl);
      setCopyStatus('Link copied');
      window.setTimeout(() => setCopyStatus(''), 1800);
    } catch {
      setCopyStatus('Copy failed');
      window.setTimeout(() => setCopyStatus(''), 1800);
    }
  };

  const paragraphs = splitIntoParagraphs(post.content || post.excerpt);

  return (
    <div className="min-h-screen bg-[#f7f1e8] text-gray-900">
      <div className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#171311] text-white shadow-sm">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none text-gray-900">{content.siteName}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">{content.siteTagline}</p>
            </div>
          </a>

          <a
            href="/#blog"
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-amber-300 hover:text-amber-700"
          >
            Back to blog
          </a>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-6 lg:px-8">
        <a
          href="/#blog"
          className="inline-flex items-center gap-2 rounded-full border border-[#d8c1a4] bg-white/70 px-4 py-2 text-sm font-semibold text-[#6f543a] shadow-sm backdrop-blur-sm transition hover:-translate-x-0.5 hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to articles
        </a>

        <article className="mt-8 overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-[0_24px_70px_rgba(107,81,50,0.12)] backdrop-blur-sm">
          <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
            <img
              src={post.image}
              alt={post.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/28 via-black/5 to-transparent" />
          </div>

          <div className="px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a6f53]">
              <span className="rounded-full bg-[#f4eadf] px-3 py-1">{post.category}</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#f4eadf] px-3 py-1">
                <Clock className="h-3.5 w-3.5" />
                {estimateReadingTime(post.content || post.excerpt)}
              </span>
              {post.publishedAt && (
                <span className="inline-flex items-center gap-2 rounded-full bg-[#f4eadf] px-3 py-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(post.publishedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-gray-900 sm:text-5xl">
              {post.title}
            </h1>

            <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600">
              {post.excerpt}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${post.title} - ${articleUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
              <a
                href={`https://x.com/intent/tweet?text=${shareText}&url=${encodedUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#111827] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
              >
                <Share2 className="h-4 w-4" />
                X
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#1877F2] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5"
              >
                <Share2 className="h-4 w-4" />
                Facebook
              </a>
              <button
                type="button"
                onClick={onCopyLink}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:text-amber-700"
              >
                <Copy className="h-4 w-4" />
                {copyStatus || 'Copy link'}
              </button>
            </div>

            <div className="mt-10 space-y-6 text-[1.03rem] leading-8 text-gray-700">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            {(previousPost || nextPost) && (
              <div className="mt-12 grid gap-4 border-t border-gray-100 pt-8 sm:grid-cols-2">
                {previousPost ? (
                  <a
                    href={`/blog/${previousPost.slug || slugifyBlogTitle(previousPost.title)}`}
                    className="group rounded-3xl border border-gray-100 bg-[#faf7f1] p-5 transition hover:-translate-y-0.5 hover:border-amber-200"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Previous</p>
                    <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-500">
                      <ArrowLeft className="h-4 w-4" />
                      Previous article
                    </div>
                    <h2 className="mt-3 text-lg font-bold text-gray-900 group-hover:text-amber-700">
                      {previousPost.title}
                    </h2>
                  </a>
                ) : <div />}

                {nextPost ? (
                  <a
                    href={`/blog/${nextPost.slug || slugifyBlogTitle(nextPost.title)}`}
                    className="group rounded-3xl border border-gray-100 bg-[#faf7f1] p-5 text-right transition hover:-translate-y-0.5 hover:border-amber-200"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">Next</p>
                    <div className="mt-2 flex items-center justify-end gap-2 text-sm font-semibold text-gray-500">
                      Next article
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <h2 className="mt-3 text-lg font-bold text-gray-900 group-hover:text-amber-700">
                      {nextPost.title}
                    </h2>
                  </a>
                ) : <div />}
              </div>
            )}
          </div>
        </article>

        <section className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-700">Related articles</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-gray-900">More useful moving advice</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPosts.map((item) => {
              const slug = item.slug || slugifyBlogTitle(item.title);
              return (
                <a
                  key={item.id}
                  href={`/blog/${slug}`}
                  className="group overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-[0_16px_40px_rgba(107,81,50,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(107,81,50,0.14)]"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">{item.category}</p>
                    <h3 className="mt-2 text-lg font-bold leading-tight text-gray-900">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-gray-600">{item.excerpt}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      </main>

      {/* <Footer content={content} /> */}

      <Footer
  siteName={content.siteName}
  siteTagline={content.siteTagline}
  phone={content.phone}
  email={content.email}
  footerText={content.footerText}
  logoUrl={content.logoUrl}
/>
    </div>
  );
}
