import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ScriptResult {
  hook: string;
  body: string;
  cta: string;
  title: string;
  tags: string;
  caption: string;
  bg_keyword: string;
  full_script: string;
}

@Injectable()
export class ScriptService {
  private genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
  private model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  async generateScript(topic: string): Promise<ScriptResult> {
    const prompt = `주제: ${topic}

다음 형식으로 정확히 출력해. 태그 포함:

[HOOK]
첫 3초 훅 — 충격적 사실 또는 강한 질문 1문장
[/HOOK]

[BODY]
핵심 내용 3가지 (각 10~15초 분량, 번호 붙여서)
1.
2.
3.
[/BODY]

[CTA]
마지막 5초 행동 유도 1문장
[/CTA]

[TITLE]
유튜브 제목 (50자 이내, #Shorts 포함)
[/TITLE]

[TAGS]
#태그1 #태그2 #태그3 #태그4 #태그5 #태그6 #태그7 #태그8
[/TAGS]

[CAPTION]
틱톡/인스타 캡션 (150자 이내, 이모지 포함)
[/CAPTION]

[BG_KEYWORD]
Pexels 영상 검색용 영어 키워드 (2~3단어)
[/BG_KEYWORD]

조건: 친근하고 빠른 말투. 한국어.`;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text();

    const extract = (tag: string): string => {
      const match = text.match(new RegExp(`\\[${tag}\\]([\\s\\S]*?)\\[\\/${tag}\\]`));
      return match ? match[1].trim() : '';
    };

    const hook = extract('HOOK');
    const body = extract('BODY');
    const cta = extract('CTA');

    return {
      hook,
      body,
      cta,
      title: extract('TITLE'),
      tags: extract('TAGS'),
      caption: extract('CAPTION'),
      bg_keyword: extract('BG_KEYWORD'),
      full_script: [hook, body, cta].filter(Boolean).join('\n\n'),
    };
  }
}
