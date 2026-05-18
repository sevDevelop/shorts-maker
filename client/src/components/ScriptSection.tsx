import type { ScriptResult } from '../types';

interface Props {
  script: ScriptResult;
  onScriptChange: (s: ScriptResult) => void;
  onNext: () => void;
}

const Field = ({ label, value, onChange, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; rows?: number;
}) => (
  <div style={{ marginBottom: 20 }}>
    <label style={{ display: 'block', color: '#00d084', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{label}</label>
    <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

export default function ScriptSection({ script, onScriptChange, onNext }: Props) {
  const update = (key: keyof ScriptResult) => (val: string) => {
    const updated = { ...script, [key]: val };
    if (key === 'hook' || key === 'body' || key === 'cta') {
      updated.full_script = [updated.hook, updated.body, updated.cta].filter(Boolean).join('\n\n');
    }
    onScriptChange(updated);
  };

  return (
    <div>
      <h2 className="section-title">스크립트 편집</h2>

      <Field label="훅 (첫 3초)" value={script.hook} onChange={update('hook')} rows={2} />
      <Field label="본문" value={script.body} onChange={update('body')} rows={6} />
      <Field label="CTA (마지막 5초)" value={script.cta} onChange={update('cta')} rows={2} />
      <Field label="제목" value={script.title} onChange={update('title')} rows={1} />
      <Field label="태그" value={script.tags} onChange={update('tags')} rows={1} />
      <Field label="캡션" value={script.caption} onChange={update('caption')} rows={2} />
      <Field label="배경 영상 키워드 (영어)" value={script.bg_keyword} onChange={update('bg_keyword')} rows={1} />

      <button className="btn-primary" onClick={onNext} style={{ width: '100%' }}>
        다음: 영상 설정 →
      </button>
    </div>
  );
}
