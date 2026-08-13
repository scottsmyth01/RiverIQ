import { ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Link, Navigate, useParams } from 'react-router';
import remarkBreaks from 'remark-breaks';
import { getBlogPost } from '../content/blog/blogPosts';
import './BlogPage.css';

const BlogPostPage = () => {
  const { slug } = useParams();
  const post = getBlogPost(slug);

  if (!post) return <Navigate to='/blog' replace />;

  return (
    <main className='blog-page'>
      <article className='blog-article'>
        <Link className='blog-back-link' to='/blog'>
          <ArrowLeft aria-hidden='true' />
          Articles
        </Link>

        <header>
          <span className='blog-category'>{post.category}</span>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
          <div className='blog-meta-row'>
            <span>{post.author}</span>
            <span aria-hidden='true'>/</span>
            <time dateTime={new Date(post.date).toISOString()}>{post.date}</time>
            <span aria-hidden='true'>/</span>
            <span>{post.readTime}</span>
          </div>
        </header>

        <div className='blog-article-body'>
          <ReactMarkdown remarkPlugins={[remarkBreaks]}>{post.body}</ReactMarkdown>
        </div>
      </article>
    </main>
  );
};

export default BlogPostPage;
