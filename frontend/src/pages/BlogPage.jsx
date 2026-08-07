import { ArrowRight, BookOpen, Search } from 'lucide-react';
import { Link } from 'react-router';
import { blogPosts } from '../data/blogPosts';
import './BlogPage.css';

const BlogPage = () => {
  const featuredPost = blogPosts[0];
  const remainingPosts = blogPosts.slice(1);

  return (
    <main className='blog-page'>
      <section className='blog-shell'>
        <header className='blog-hero'>
          <div>
            <span className='blog-kicker'>
              <BookOpen aria-hidden='true' />
              RiverIQ Blog
            </span>
            <h1>Poker strategy, session review, and hand history analysis.</h1>
            <p>
              Practical articles for players who want to understand their stats, review sessions with more structure, and
              make better decisions away from the table.
            </p>
          </div>
          <div className='blog-search-card' aria-label='Blog topics'>
            <Search aria-hidden='true' />
            <span>Coming next: parser guides, position leaks, bankroll systems, and hand history walkthroughs.</span>
          </div>
        </header>

        {featuredPost && (
          <article className='blog-featured-card'>
            <div>
              <span className='blog-meta'>
                {featuredPost.category} · {featuredPost.readTime}
              </span>
              <h2>{featuredPost.title}</h2>
              <p>{featuredPost.excerpt}</p>
            </div>
            <Link to={`/blog/${featuredPost.slug}`}>
              Read article
              <ArrowRight aria-hidden='true' />
            </Link>
          </article>
        )}

        <section className='blog-grid' aria-label='Latest poker articles'>
          {remainingPosts.map((post) => (
            <article className='blog-card' key={post.slug}>
              <span className='blog-meta'>
                {post.category} · {post.readTime}
              </span>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <Link to={`/blog/${post.slug}`}>
                Read more
                <ArrowRight aria-hidden='true' />
              </Link>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
};

export default BlogPage;
