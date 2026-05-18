import { useState } from 'react';

interface Props {
  filename: string;
  onReset: () => void;
}

export default function CompleteSection({ filename, onReset }: Props) {
  const videoUrl = `http://localhost:3001/output/${filename}`;
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <h2 className="section-title">🎉 완성!</h2>

      <div style={{ marginBottom: 24, borderRadius: 12, overflow: 'hidden', maxWidth: 360, margin: '0 auto 24px' }}>
        <video
          src={videoUrl}
          controls
          style={{ width: '100%', display: 'block' }}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button
          className="btn-primary"
          onClick={handleDownload}
          disabled={downloading}
          style={{ padding: '12px 28px', fontSize: 15 }}
        >
          {downloading ? '다운로드 중...' : '다운로드'}
        </button>
        <button className="btn-secondary" onClick={onReset}>
          새 영상 만들기
        </button>
      </div>
    </div>
  );
}
