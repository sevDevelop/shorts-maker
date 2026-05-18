import { useState } from 'react';
import type { Section, ScriptResult } from './types';
import NewsSection from './components/NewsSection';
import ScriptSection from './components/ScriptSection';
import VideoSection from './components/VideoSection';
import CompleteSection from './components/CompleteSection';
import './index.css';
import './App.css';

export default function App() {
  const [section, setSection] = useState<Section>('news');
  const [script, setScript] = useState<ScriptResult | null>(null);
  const [outputFilename, setOutputFilename] = useState('');

  const go = (s: Section) => setSection(s);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="logo">⚡ Shorts Maker</h1>
        <div className="steps">
          {(['news', 'script', 'video'] as Section[]).map((s, i) => (
            <span key={s} className={`step ${section === s ? 'active' : ''}`}>{i + 1}</span>
          ))}
        </div>
      </header>

      <main className="app-main">
        {section === 'news' && (
          <NewsSection
            onScriptGenerated={(s) => { setScript(s); go('script'); }}
          />
        )}
        {section === 'script' && script && (
          <ScriptSection
            script={script}
            onScriptChange={setScript}
            onBack={() => go('news')}
            onNext={() => go('video')}
          />
        )}
        {section === 'video' && script && (
          <VideoSection
            bgKeyword={script.bg_keyword}
            script={script}
            onBack={() => go('script')}
            onOutputReady={(filename) => {
              setOutputFilename(filename);
              go('complete');
            }}
          />
        )}
        {section === 'complete' && (
          <CompleteSection
            filename={outputFilename}
            onReset={() => { setScript(null); go('news'); }}
          />
        )}
      </main>
    </div>
  );
}
