interface Props {
  onComplete: (filename: string) => void;
}

export default function GeneratingSection({ onComplete: _onComplete }: Props) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0' }}>
      <div className="loading-spinner" style={{ width: 48, height: 48, borderWidth: 4 }} />
      <p style={{ marginTop: 24, color: '#888' }}>영상을 생성하고 있습니다...</p>
    </div>
  );
}
