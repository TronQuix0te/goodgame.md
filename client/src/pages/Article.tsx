import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

interface ArticleData {
  id: number;
  slug: string;
  title: string;
  description: string;
  content: string;
  tags: string;
  published_at: string;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderMarkdown(md: string): string {
  // Extract code blocks first to protect them
  const codeBlocks: string[] = [];
  let processed = md.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, _lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(`<pre class="text-t-mid text-sm my-6 leading-relaxed border-l-2 border-t-dim/20 pl-6 overflow-x-auto">${escapeHtml(code)}</pre>`);
    return `%%CODEBLOCK_${idx}%%`;
  });

  // Inline code
  processed = processed.replace(/`([^`]+)`/g, (_m, code) => `<span class="text-t-hi">${escapeHtml(code)}</span>`);

  // Headers
  processed = processed.replace(/^## (.+)$/gm, '<div class="text-t-hi text-lg font-bold mt-10 mb-4 uppercase tracking-wider">$1</div>');
  processed = processed.replace(/^### (.+)$/gm, '<div class="text-t-fg font-bold mt-8 mb-3 uppercase tracking-wider">$1</div>');

  // Bold and italic
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<span class="text-t-hi">$1</span>');
  processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Lists
  processed = processed.replace(/^- (.+)$/gm, '<div class="text-t-mid ml-4 mb-1">&mdash; $1</div>');
  processed = processed.replace(/^\d+\. (.+)$/gm, '<div class="text-t-mid ml-4 mb-1">$1</div>');

  // Blockquotes
  processed = processed.replace(/^> (.+)$/gm, '<div class="text-t-dim italic border-l-2 border-t-dim/20 pl-4 my-4">$1</div>');

  // Paragraphs
  processed = processed.replace(/\n\n/g, '</p><p class="mb-4 text-t-mid leading-relaxed">');
  processed = processed.replace(/\n/g, '<br/>');

  // Restore code blocks
  for (let i = 0; i < codeBlocks.length; i++) {
    processed = processed.replace(`%%CODEBLOCK_${i}%%`, codeBlocks[i]);
  }

  return processed;
}

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api<ArticleData>(`/articles/${slug}`)
      .then(setArticle)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="text-t-dim text-center py-16 text-sm uppercase tracking-widest">LOADING<span className="cursor-blink" /></div>;
  if (!article) return <div className="text-t-dim text-center py-16 text-sm uppercase tracking-widest">NOT FOUND</div>;

  return (
    <div>
      <Link to="/blog" className="text-xs text-t-dim uppercase tracking-widest hover:text-t-accent transition-colors">
        &larr; BACK TO BLOG
      </Link>

      <div className="py-10">
        <div className="text-xl sm:text-2xl font-bold text-t-hi uppercase tracking-wider mb-3">{article.title}</div>
        <div className="text-sm sm:text-base text-t-mid leading-relaxed mb-4">{article.description}</div>
        <div className="text-xs text-t-dim uppercase tracking-widest">
          {new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase()}
          {article.tags && ` · ${article.tags.split(',').map(t => `#${t.trim()}`).join(' ')}`}
        </div>
      </div>

      <div
        className="py-8 text-sm sm:text-base leading-relaxed"
        dangerouslySetInnerHTML={{
          __html: `<p class="mb-4 text-t-mid leading-relaxed">${renderMarkdown(article.content)}</p>`
        }}
      />
    </div>
  );
}
