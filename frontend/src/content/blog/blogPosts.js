const postFiles = import.meta.glob('./*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) {
    return {
      metadata: {},
      body: markdown.trim(),
    };
  }

  const metadata = match[1].split('\n').reduce((data, line) => {
    const separatorIndex = line.indexOf(':');

    if (separatorIndex === -1) return data;

    const key = line.slice(0, separatorIndex).trim();
    const value = line
      .slice(separatorIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, '');

    return {
      ...data,
      [key]: value,
    };
  }, {});

  return {
    metadata,
    body: match[2].trim(),
  };
}

function getSlugFromPath(path) {
  return path.split('/').pop().replace(/\.md$/, '');
}

function getReadTime(body) {
  const words = body.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min read`;
}

function getExcerpt(body) {
  const firstParagraph = body.split(/\n{2,}/).find((block) => block.trim() && !block.trim().startsWith('#'));

  return firstParagraph?.replace(/\s+/g, ' ').slice(0, 180) || '';
}

export const blogPosts = Object.entries(postFiles)
  .map(([path, markdown]) => {
    const { metadata, body } = parseFrontmatter(markdown);

    return {
      slug: metadata.slug || getSlugFromPath(path),
      title: metadata.title || 'Untitled Article',
      excerpt: metadata.excerpt || getExcerpt(body),
      category: metadata.category || 'Strategy',
      date: metadata.date || 'August 11, 2026',
      readTime: metadata.readTime || getReadTime(body),
      author: metadata.author || 'RiverIQ',
      body,
      contentText: body.replace(/[#>*_\-[\]()`]/g, ' '),
    };
  })
  .sort((first, second) => new Date(second.date) - new Date(first.date));

export function getBlogPost(slug) {
  return blogPosts.find((post) => post.slug === slug);
}
