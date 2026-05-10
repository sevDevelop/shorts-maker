const BASE = 'http://localhost:3001/api';

export async function fetchNews(category: string) {
  const res = await fetch(`${BASE}/news?category=${encodeURIComponent(category)}`);
  return res.json();
}

export async function generateScript(topic: string) {
  const res = await fetch(`${BASE}/script`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic }),
  });
  return res.json();
}

export async function searchVideos(keyword: string) {
  const res = await fetch(`${BASE}/videos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keyword }),
  });
  return res.json();
}

export async function startGenerate(payload: {
  jobId: string;
  script: any;
  videoUrl: string;
  audioType: 'ai' | 'upload';
  uploadedAudioPath?: string;
  voice?: string;
}) {
  const res = await fetch(`${BASE}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function uploadAudio(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/upload-audio`, { method: 'POST', body: form });
  return res.json();
}

export function createProgressStream(jobId: string) {
  return new EventSource(`${BASE}/generate/progress/${jobId}`);
}
