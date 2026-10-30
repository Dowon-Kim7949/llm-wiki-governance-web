# llm-wiki-governance-web

[LLM-WIKI Governance](https://github.com/Dowon-Kim7949/llm-wiki-governance)의 공식 웹사이트입니다. LLM-WIKI Governance는 AI 코딩 에이전트가 쓰고 읽는 프로젝트 문서에 검토 상태와 소스 인용, 변경 점검을 붙이는 오픈 소스 CLI입니다.

[English](README.md)

- 사이트: https://dowon-kim7949.github.io/llm-wiki-governance-web/
- 제품 관련 사실은 **v1.42.0**(커밋 `7bb943f`) 기준입니다. 근거는 [docs/PRODUCT_CLAIMS.md](docs/PRODUCT_CLAIMS.md)에 있습니다.
- 이 저장소에는 웹사이트만 있습니다. CLI는 [Dowon-Kim7949/llm-wiki-governance](https://github.com/Dowon-Kim7949/llm-wiki-governance)에 있습니다.

## 구성

Next.js 16(App Router, 정적 export), React 19, TypeScript, 일반 CSS와 CSS Modules를 쓰고 GitHub Actions로 GitHub Pages에 배포합니다. 백엔드, 데이터베이스, 추적 스크립트는 없습니다.

## 개발

```bash
npm ci
npm run dev          # http://localhost:3000/ko/
npm run lint && npm run typecheck && npm test
npm run build        # out/ 생성
```

브라우저 테스트(Python 3.10 이상):

```bash
pip install playwright==1.56.0 && python -m playwright install chromium
npm run build && npm run serve &      # http://localhost:4173/
SITE_URL=http://localhost:4173 python tests/e2e/run_e2e.py
```

## 문서

- [디자인](docs/DESIGN.md): 브리프, 검토한 세 방향, 토큰, 컴포넌트
- [제품 주장 근거](docs/PRODUCT_CLAIMS.md): 사이트의 사실 주장과 검증 방법
- [테스트와 접근성](docs/TESTING.md)
- [배포](docs/DEPLOYMENT.md)

설계 문서는 영어로 씁니다. 사이트 본문은 한국어와 영어를 따로 편집합니다(`src/content/ko.ts`, `src/content/en.ts`).

## 라이선스

웹사이트 코드는 MIT([LICENSE](LICENSE))입니다. 현재 화면은 빌드 시 자체 호스팅하는 Archivo(OFL-1.1)와 시스템 한국어 글꼴을 사용합니다. 이전 IBM Plex Sans KR 서브셋은 기존 자산으로 보존합니다. 크롬·코발트 연결 조형은 이미지 생성 도구로 제작했고, 인터페이스 아이콘은 SVG입니다. [리디자인 기록](docs/REDESIGN_2026-10-30.md)에 영상 분석과 이미지 프롬프트가 있으며, 라이선스 정보는 [docs/THIRD_PARTY.md](docs/THIRD_PARTY.md)에 있습니다.
