import { useState, useRef } from 'react';
import { searchVideos, uploadAudio, startGenerate } from '../api';
import { VideoItem, ScriptResult } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface Props {
  bgKeyword: string;
  script: ScriptResult;
  onGenerate: (video: VideoItem) => void;
  onOutputReady: (filename: string) => void;
}

export default function VideoSection({ bgKeyword, script, onGenerate, onOutputReady }: Props) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [audioType, setAudioType] = useState<'ai' | 'upload'>('ai');
  const [voice, setVoice] = useState('ko-KR-SunHiNeural');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [searching, setSearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const search = async () => {
    setSearching(true);
    setError('');
    try {
      const data = await searchVideos(bgKeyword);
      setVideos(data);
    } catch {
      setError('영상을 검색하지 못했습니다.');
    } finally {
      setSearching(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedVideo) { setError('배경 영상을 선택해주세요.'); return; }
    if (audioType === 'upload' && !uploadedFile) { setError('음악 파일을 업로드해주세요.'); return; }

    setGenerating(true);
    setError('');
    setProgress(0);
    setProgressMsg('시작 중...');

    try {
      let uploadedAudioPath: string | undefined;
      if (audioType === 'upload' && uploadedFile) {
        const uploadRes = await uploadAudio(uploadedFile);
        uploadedAudioPath = uploadRes.path;
      }

      const jobId = uuidv4();

      const es = new EventSource(`http://localhost:3001/api/generate/progress/${jobId}`);
      es.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setProgress(data.percent);
        setProgressMsg(data.message);
        if (data.percent === 100) {
          es.close();
          onOutputReady(`${jobId}.mp4`);
          setGenerating(false);
        } else if (data.percent === -1) {
          es.close();
          setError(data.message);
          setGenerating(false);
        }
      };
      es.onerror = () => {
        es.close();
        setGenerating(false);
      };

      await startGenerate({
        jobId,
        script,
        videoUrl: selectedVideo.url,
        audioType,
        uploadedAudioPath,
        voice,
      });

      onGenerate(selectedVideo);
    } catch {
      setError('영상 생성 중 오류가 발생했습니다.');
      setGenerating(false);
    }
  };

  return (
    <div>
      <h2 className="section-title">영상 설정</h2>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <label style={{ color: '#00d084', fontWeight: 600 }}>배경 영상</label>
          <button className="btn-secondary" onClick={search} disabled={searching}>
            {searching ? '검색 중...' : videos.length ? '다른 영상 검색' : '영상 검색'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {videos.map(v => (
            <div
              key={v.id}
              onClick={() => setSelectedVideo(v)}
              style={{
                borderRadius: 10,
                overflow: 'hidden',
                border: selectedVideo?.id === v.id ? '2px solid #00d084' : '2px solid transparent',
                cursor: 'pointer',
                aspectRatio: '9/16',
                position: 'relative',
              }}
            >
              <img src={v.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: 6, right: 6, background: '#000a', borderRadius: 4, padding: '2px 6px', fontSize: 12 }}>
                {v.duration}s
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <label style={{ color: '#00d084', fontWeight: 600, display: 'block', marginBottom: 12 }}>오디오</label>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {(['ai', 'upload'] as const).map(type => (
            <label key={type} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="radio" checked={audioType === type} onChange={() => setAudioType(type)} />
              {type === 'ai' ? '🤖 AI 보이스 (Edge TTS)' : '🎵 내 음악 업로드'}
            </label>
          ))}
        </div>

        {audioType === 'ai' && (
          <select
            value={voice}
            onChange={e => setVoice(e.target.value)}
            style={{ background: '#111', color: '#fff', border: '1px solid #333', borderRadius: 8, padding: '8px 12px', width: '100%' }}
          >
            <option value="ko-KR-SunHiNeural">선희 (여성, 밝음)</option>
            <option value="ko-KR-InJoonNeural">인준 (남성, 차분)</option>
          </select>
        )}

        {audioType === 'upload' && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) setUploadedFile(f);
            }}
            style={{
              border: '2px dashed #333',
              borderRadius: 10,
              padding: 24,
              textAlign: 'center',
              cursor: 'pointer',
              color: '#666',
            }}
          >
            {uploadedFile ? `✅ ${uploadedFile.name}` : '클릭하거나 mp3/wav 파일을 드래그하세요'}
            <input ref={fileInputRef} type="file" accept=".mp3,.wav,.m4a" style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) setUploadedFile(e.target.files[0]); }} />
          </div>
        )}
      </div>

      {generating && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ height: 8, background: '#222', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', background: '#00d084', width: `${progress}%`, transition: 'width 0.5s' }} />
          </div>
          <p style={{ color: '#888', fontSize: 14 }}>{progress}% — {progressMsg}</p>
        </div>
      )}

      {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}

      <button
        className="btn-primary"
        onClick={handleGenerate}
        disabled={generating || !selectedVideo}
        style={{ width: '100%' }}
      >
        {generating ? <><span className="loading-spinner" />영상 만드는 중...</> : '영상 만들기'}
      </button>
    </div>
  );
}
