# Shorts Maker

뉴스를 보고 → 주제를 고르고 → 버튼 몇 번으로 숏츠 영상이 나오는 로컬 웹앱.

## 기술 스택

| 역할 | 기술 |
|------|------|
| 프론트엔드 | React + Vite + TypeScript |
| 백엔드 | NestJS + TypeScript |
| 뉴스 수집 | Google News RSS |
| 스크립트 생성 | Gemini 2.5 Flash API |
| AI 보이스 | Edge TTS |
| 배경 영상 | Pexels API |
| 영상 합성 | FFmpeg |
| 패키지 관리 | pnpm (모노레포) |

## 시작 전 준비

### 1. 필수 도구 설치

```bash
# FFmpeg
brew install ffmpeg

# Node.js 20+, pnpm
```

### 2. API 키 발급

- **Gemini**: https://aistudio.google.com/app/apikey
- **Pexels**: https://www.pexels.com/api/

### 3. 환경 변수 설정

`server/.env` 파일을 열어서 키 입력:

```
GEMINI_API_KEY=여기에_키_입력
PEXELS_API_KEY=여기에_키_입력
PORT=3001
```

### 4. 의존성 설치

```bash
pnpm install
```

## 실행

```bash
pnpm run dev
```

- 프론트엔드: http://localhost:5173
- 백엔드: http://localhost:3001

## 사용 방법

```
1. 카테고리 선택 (기술 / 경제 / 세계 / 엔터)
   또는 직접 주제 입력
       ↓
2. 뉴스 카드 클릭 → [스크립트 생성]
       ↓
3. Gemini가 만든 훅 / 본문 / CTA 직접 수정 가능
       ↓
4. [영상 검색] → Pexels 배경 영상 3개 중 선택
   오디오: AI 보이스 또는 내 음악 업로드
       ↓
5. [영상 만들기] → 실시간 진행 바 표시
       ↓
6. 완성된 영상 미리보기 + 다운로드
```

## 프로젝트 구조

```
shorts-maker/
├── client/                # React 프론트엔드
│   └── src/
│       ├── components/    # 화면별 컴포넌트 (5개 섹션)
│       ├── api/           # 서버 API 호출 함수
│       └── types/         # 공유 TypeScript 타입
├── server/                # NestJS 백엔드
│   └── src/
│       ├── news/          # Google News RSS 수집
│       ├── script/        # Gemini 스크립트 생성
│       ├── voice/         # Edge TTS 보이스오버
│       ├── video/         # Pexels 검색 + FFmpeg 합성
│       ├── generate/      # 전체 파이프라인 + SSE 진행상황
│       ├── progress/      # 실시간 진행률 관리
│       └── upload/        # 음악 파일 업로드
├── pnpm-workspace.yaml
└── package.json
```

## 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `GEMINI_API_KEY` | Gemini API 키 | 필수 |
| `PEXELS_API_KEY` | Pexels API 키 | 필수 |
| `PORT` | 백엔드 포트 | `3001` |
