import { useMemo, useState } from 'react';
import { ArrowRight, Search, Spade } from 'lucide-react';
import { Link } from 'react-router';
import { blogPosts } from '../content/blog/blogPosts';
import './BlogPage.css';

const categories = ['All', ...Array.from(new Set(blogPosts.map((post) => post.category)))];

const BlogPage = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return blogPosts.filter((post) => {
      const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
      const matchesSearch =
        !query ||
        [post.title, post.excerpt, post.category, post.contentText].some((value) =>
          value.toLowerCase().includes(query),
        );

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <main className='blog-page'>
      <section className='blog-shell'>
        <div className='blog-topbar'>
          <Link className='blog-brand' to='/blog'>
            <Spade aria-hidden='true' />
            RiverIQ Blog
          </Link>

          <label className='blog-search'>
            <Search aria-hidden='true' />
            <input
              type='search'
              value={searchQuery}
              placeholder='Search articles'
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </label>
        </div>

        <header className='blog-hero'>
          <h1>Articles</h1>
          <p>
            Strategy notes, review systems, hand-history workflows, and practical ways to understand your poker data.
          </p>
        </header>

        <div className='blog-tabs' role='tablist' aria-label='Article categories'>
          {categories.map((category) => (
            <button
              className={activeCategory === category ? 'blog-tab active' : 'blog-tab'}
              key={category}
              type='button'
              role='tab'
              aria-selected={activeCategory === category}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <section className='blog-list' aria-label='Latest poker articles'>
          {filteredPosts.map((post) => (
            <article className='blog-list-item' key={post.slug}>
              <time className='blog-date' dateTime={new Date(post.date).toISOString()}>
                {post.date}
              </time>
              <div>
                <h2>
                  <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p>{post.excerpt}</p>
                <div className='blog-meta-row'>
                  <span className='blog-category'>{post.category}</span>
                  <span aria-hidden='true'>/</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
              <Link className='blog-read-link' to={`/blog/${post.slug}`} aria-label={`Read ${post.title}`}>
                <ArrowRight aria-hidden='true' />
              </Link>
            </article>
          ))}

          {!filteredPosts.length && <p className='blog-empty'>No articles found.</p>}
        </section>
      </section>
    </main>
  );
};

export default BlogPage;
