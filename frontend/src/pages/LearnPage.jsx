import './LearnPage.css';

import { ArrowUpRight, BookOpen, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { blogPosts } from '../content/blog/blogPosts';

const categories = ['All', ...Array.from(new Set(blogPosts.map((post) => post.category)))];

const LearnPage = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return blogPosts.filter((post) => {
      const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
      const matchesSearch =
        !query ||
        [post.title, post.excerpt, post.category, post.author, post.contentText].some((value) =>
          value.toLowerCase().includes(query),
        );

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <main className='learn-page'>
      <header className='learn-header'>
        <div>
          <h1>Learn</h1>
          <p>Read RiverIQ articles, strategy notes, and hand-history workflows.</p>
        </div>
        <label className='learn-search'>
          <Search aria-hidden='true' />
          <input
            type='search'
            value={searchQuery}
            placeholder='Search articles'
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>
      </header>

      <div className='learn-tabs' role='tablist' aria-label='Article categories'>
        {categories.map((category) => (
          <button
            className={activeCategory === category ? 'learn-tab learn-tab--active' : 'learn-tab'}
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

      <section className='learn-list' aria-label='RiverIQ articles'>
        {filteredPosts.map((post) => (
          <a
            className='learn-article'
            key={post.slug}
            href={`/blog/${post.slug}`}
            target='_blank'
            rel='noreferrer'
          >
            <div className='learn-article__icon' aria-hidden='true'>
              <BookOpen />
            </div>
            <div className='learn-article__copy'>
              <div className='learn-article__meta'>
                <span>{post.category}</span>
                <span aria-hidden='true'>/</span>
                <time dateTime={new Date(post.date).toISOString()}>{post.date}</time>
                <span aria-hidden='true'>/</span>
                <span>{post.readTime}</span>
              </div>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
            </div>
            <ArrowUpRight className='learn-article__arrow' aria-hidden='true' />
          </a>
        ))}

        {!filteredPosts.length && (
          <div className='learn-empty'>
            <BookOpen aria-hidden='true' />
            <strong>No articles found</strong>
            <span>Try a different search or category.</span>
          </div>
        )}
      </section>
    </main>
  );
};

export default LearnPage;
