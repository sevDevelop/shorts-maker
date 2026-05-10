interface Props {
  filename: string;
  onReset: () => void;
}

export default function CompleteSection({ filename, onReset }: Props) {
  const videoUrl = `http://localhost:3001/output/${filename}`;

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
        <a
          href={videoUrl}
          download={filename}
          style={{
            background: '#00d084',
            color: '#000',
            padding: '12px 28px',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 15,
            textDecoration: 'none',
          }}
        >
          다운로드
        </a>
        <button className="btn-secondary" onClick={onReset}>
          새 영상 만들기
        </button>
      </div>
    </div>
  );
}
