import { useState } from 'react';
import { fetchNews, generateScript } from '../api';
import type { NewsItem, ScriptResult } from '../types';

const CATEGORIES = ['기술', '경제', '세계', '엔터'];

interface Props {
  onScriptGenerated: (script: ScriptResult) => void;
}

export default function NewsSection({ onScriptGenerated }: Props) {
  const [category, setCategory] = useState('기술');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const loadNews = async (cat: string) => {
    setLoading(true);
    setError('');
    setSelected(null);
    try {
      const data = await fetchNews(cat);
      setNews(data);
    } catch {
      setError('뉴스를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (cat: string) => {
    setCategory(cat);
    loadNews(cat);
  };

  const handleGenerate = async () => {
    const topic = customTopic.trim() || selected?.title || '';
    if (!topic) { setError('주제를 선택하거나 직접 입력해주세요.'); return; }
    setGenerating(true);
    setError('');
    try {
      const script = await generateScript(topic);
      onScriptGenerated(script);
    } catch {
      setError('스크립트 생성에 실패했습니다. API 키를 확인해주세요.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <h2 className="section-title">뉴스 선택</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            style={{
              padding: '8px 16px',
              background: category === cat ? '#00d084' : '#222',
              color: category === cat ? '#000' : '#fff',
              borderRadius: 20,
              fontSize: 14,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="또는 직접 주제 입력 (예: 비트코인 반감기)"
          value={customTopic}
          onChange={e => setCustomTopic(e.target.value)}
        />
      </div>

      {loading && <p style={{ color: '#666' }}><span className="loading-spinner" />뉴스 불러오는 중...</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {news.map((item, i) => (
          <div
            key={i}
            className="card"
            onClick={() => { setSelected(item); setCustomTopic(''); }}
            style={{
              cursor: 'pointer',
              border: selected === item ? '1px solid #00d084' : '1px solid #222',
              transition: 'border-color 0.2s',
            }}
          >
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>{item.title}</p>
            <p style={{ color: '#666', fontSize: 13 }}>{item.source} · {item.published ? new Date(item.published).toLocaleDateString('ko-KR') : ''}</p>
          </div>
        ))}
      </div>

      {error && <p className="error-msg">{error}</p>}

      <button
        className="btn-primary"
        onClick={handleGenerate}
        disabled={generating || (!selected && !customTopic.trim())}
        style={{ width: '100%', marginTop: 8 }}
      >
        {generating ? <><span className="loading-spinner" />스크립트 생성 중...</> : '스크립트 생성'}
      </button>
    </div>
  );
}
