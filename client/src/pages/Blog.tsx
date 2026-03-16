import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface Article {
  id: number;
  slug: string;
  title: string;
  description: string;
  tags: string;
  published_at: string;
}

export default function Blog() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ articles: Article[] }>('/articles')
      .then(d => setArticles(d.articles))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="py-8">
        <div className="text-2xl font-bold text-t-hi uppercase tracking-widest mb-2">BLOG</div>
        <div className="text-xs text-t-dim uppercase tracking-widest">
          GUIDES AND THINKING ON BEHAVIORAL AI CONFIGURATION
        </div>
      </div>

      {loading ? (
        <div className="text-t-dim text-center py-16 text-sm uppercase tracking-widest">LOADING<span className="cursor-blink" /></div>
      ) : (
        <div className="py-6">
          {articles.map((article, i) => (
            <div key={article.id}>
              <Link
                to={`/blog/${article.slug}`}
                className="block py-6 hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="text-base text-t-fg uppercase tracking-wider group-hover:text-t-accent transition-colors mb-2">
                      {article.title}
                    </div>
                    <div className="text-sm text-t-dim leading-relaxed">{article.description}</div>
                    {article.tags && (
                      <div className="text-xs text-t-dim/50 mt-2 uppercase tracking-widest">
                        {article.tags.split(',').map(t => `#${t.trim()}`).join('  ')}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-t-dim uppercase tracking-widest whitespace-nowrap mt-1">
                    {new Date(article.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                  </span>
                </div>
              </Link>
              {i < articles.length - 1 && <div className="border-b border-t-dim/10" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
