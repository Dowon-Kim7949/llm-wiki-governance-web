# llm-wiki-governance-web

[LLM-WIKI Governance](https://github.com/Dowon-Kim7949/llm-wiki-governance)의 공식 웹사이트입니다. LLM-WIKI Governance는 AI 코딩 에이전트가 쓰고 읽는 프로젝트 문서에 검토 상태와 소스 인용, 변경 점검을 붙이는 오픈 소스 CLI입니다.

[English](README.md)

- 사이트: https://dowon-kim7949.github.io/llm-wiki-governance-web/
- 제품 관련 사실은 **v1.42.0**(커밋 `7bb943f`) 기준입니다. 근거는 [docs/PRODUCT_CLAIMS.md](docs/PRODUCT_CLAIMS.md)에 있습니다.
- 이 저장소에는 웹사이트만 있습니다. CLI는 [Dowon-Kim7949/llm-wiki-governance](https://github.com/Dowon-Kim7949/llm-wiki-governance)에 있습니다.

## 구성

Next.js 16(App Router, 정적 export), React 19, TypeScript, GSAP ScrollTrigger와 CSS Modules를 사용합니다. 하나의 sticky 무대에서 스크롤에 따라 여섯 장면이 이어집니다. GitHub Pages 배포 설정을 유지하며, 백엔드·데이터베이스·추적 스크립트는 없습니다.

## 개발

```bash
npm ci
npm run dev          # http://localhost:3000/ko/
npm run lint && npm run typecheck && npm test
npm run build        # out/ 생성
```

브라우저 테스트(Python 3.10 이상):

```bash
pip install playwright==1.56.0 Pillow && python -m playwright install chromium
npm run build && npm run serve &      # http://localhost:4173/
SITE_URL=http://localhost:4173 python tests/e2e/run_e2e.py
```

## 문서

- [현재 무대 리디자인](docs/STAGE_REDESIGN_2026-10-30.md): 영상 관찰, 구조, 여섯 장면과 검증
- [서체·반응형 보정](docs/TYPOGRAPHY_2026-10-30.md): 잘난체 고딕 출처, 배치 측정과 전후 검증
- [이전 디자인](docs/DESIGN.md): 과거 브리프와 방향
- [제품 주장 근거](docs/PRODUCT_CLAIMS.md): 사이트의 사실 주장과 검증 방법
- [테스트와 접근성](docs/TESTING.md)
- [배포](docs/DEPLOYMENT.md)

사이트 본문은 한국어와 영어를 따로 편집합니다(`src/content/ko.ts`, `src/content/en.ts`). 여섯 장면의 문구는 `src/content/story.ts`, 무대 구현은 `src/components/story/`에 있습니다.

## 라이선스

웹사이트 코드는 MIT([LICENSE](LICENSE))입니다. 한국어 큰 제목은 GC COMPANY 라이선스의 잘난체 고딕 Regular 원본을 사용하며, 저작권 안내와 공식 사용 가이드를 `public/fonts/`에 동봉합니다. 본문·영어는 Archivo(OFL-1.1)와 시스템 한국어 글꼴을 유지합니다. 글꼴은 `next/font`로 자체 호스팅합니다. 이전 IBM Plex Sans KR 서브셋은 기존 자산으로 보존합니다. 크롬·코발트 연결 조형은 이미지 생성 도구로 제작했고, 인터페이스 아이콘은 SVG입니다. [리디자인 기록](docs/REDESIGN_2026-10-30.md)에 영상 분석과 이미지 프롬프트가 있으며, 라이선스 정보는 [docs/THIRD_PARTY.md](docs/THIRD_PARTY.md)에 있습니다.
