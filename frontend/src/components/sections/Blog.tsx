import { useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { SiteContent } from '../../lib/siteContent';
import { estimateReadingTime, slugifyBlogTitle } from '../../lib/blogUtils';

interface BlogProps {
  content: SiteContent;
}

export default function Blog({ content }: BlogProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(content.blogPosts.map((post) => post.category).filter(Boolean)));
    return ['All', ...uniqueCategories];
  }, [content.blogPosts]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return content.blogPosts.filter((post) => {
      const matchesCategory = category === 'All' || post.category === category;
      const searchTarget = [post.title, post.excerpt, post.content, post.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesQuery = !normalizedQuery || searchTarget.includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, content.blogPosts, query]);

  return (
    <section id="blog" className="py-24 bg-[linear-gradient(180deg,#fffaf2_0%,#f7f1e8_100%)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-block text-amber-700 font-semibold text-sm tracking-[0.3em] uppercase mb-3">
            Latest Articles
          </span>
          <h2 className="text-4xl font-black tracking-[-0.04em] text-gray-900 sm:text-5xl">
            {content.blogSectionHeadline}
          </h2>
          <p className="mt-4 text-lg leading-8 text-gray-600">{content.blogSectionSubtext}</p>
        </div>

        <div className="mt-12 rounded-[28px] border border-white/70 bg-white/70 p-4 shadow-[0_24px_60px_rgba(113,88,55,0.08)] backdrop-blur-md sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition focus-within:ring-2 focus-within:ring-amber-200">
              <Search className="h-4 w-4 text-amber-600" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search articles"
                className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
              />
            </label>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    category === item
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-amber-300 hover:text-amber-700'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filteredPosts.map((post) => {
            const slug = post.slug || slugifyBlogTitle(post.title);
            const readingTime = estimateReadingTime(post.content || `${post.title} ${post.excerpt}`);

            return (
              <article
                key={post.id}
                className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_18px_50px_rgba(104,78,48,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(104,78,48,0.14)]"
              >
                <a href={`/blog/${slug}`} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-transparent" />
                    <span className="absolute left-4 top-4 inline-flex rounded-full bg-[#171311]/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-sm backdrop-blur-sm">
                      {post.category}
                    </span>
                  </div>
                </a>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">
                    <span>{readingTime}</span>
                    <span>{post.category}</span>
                  </div>

                  <h3 className="mt-4 text-xl font-bold leading-tight text-gray-900">
                    {post.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-gray-600">
                    {post.excerpt}
                  </p>

                  <div className="mt-6 pt-4">
                    <a
                      href={`/blog/${slug}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 transition-all duration-200 hover:gap-3 hover:text-amber-800"
                    >
                      Read More
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {filteredPosts.length === 0 && (
          <div className="mt-12 rounded-3xl border border-dashed border-amber-300 bg-white/80 p-8 text-center text-gray-600">
            No articles match your search.
          </div>
        )}
      </div>
    </section>
  );
}
