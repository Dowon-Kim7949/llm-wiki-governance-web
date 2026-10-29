import type { Dictionary } from "./types";

export const ko: Dictionary = {
  meta: {
    title: "LLM-WIKI Governance: AI 에이전트 문서의 검토 상태와 소스 인용",
    description:
      "AI 코딩 에이전트가 쓰고 읽는 프로젝트 문서에 검토 상태와 소스 인용, 변경 점검을 붙이는 오픈 소스 CLI입니다. 런타임 의존성이 없고 MIT 라이선스입니다.",
    ogAlt: "LLM-WIKI Governance. 문서가 인용한 소스와 그 소스의 변경을 선으로 잇는 도면",
  },
  nav: {
    skip: "본문으로 건너뛰기",
    label: "주요 메뉴",
    workflow: "작동 방식",
    demo: "데모",
    start: "시작하기",
    limits: "한계",
    langLabel: "언어",
    otherLang: "en",
    otherLangName: "English",
  },
  hero: {
    title: "문서가 무엇을 근거로 삼는지, 누가 승인했는지, 그 근거가 언제 바뀌었는지.",
    lede:
      "LLM-WIKI Governance는 AI 코딩 에이전트가 쓰고 읽는 프로젝트 문서를 코드와 같은 규율로 다루는 CLI입니다. 에이전트가 쓴 문서는 누군가 승인할 때까지 검토 대기에 머물고, 문서마다 자신이 설명하는 파일을 인용합니다. 인용한 파일이 바뀌면 그 문서를 다시 보라고 알려 줍니다.",
    primary: "시작하기",
    secondary: "GitHub에서 보기",
    facts: ["v1.42.0", "MIT 라이선스", "Node.js 18.18 이상", "런타임 의존성 없음"],
    plotLabel: "도면: 문서 하나와 그 문서가 인용하는 소스 두 개",
    plotDoc: "billing.md",
    plotSrcA: "src/invoice.js",
    plotSrcB: "src/tax.js",
    plotNote:
      "문서 billing.md가 두 소스를 인용합니다. src/invoice.js가 바뀌어 그 인용이 재검토 대상으로 표시됐습니다. src/tax.js의 인용은 그대로입니다.",
  },
  problem: {
    heading: "문서는 코드보다 늦게 바뀝니다",
    intro:
      "코딩 에이전트는 프로젝트 문서를 잘 씁니다. 그런데 그 문서가 언제부터 틀렸는지는 잘 알아채지 못합니다. 그리고 다음 작업에서 그 문서를 다시 근거로 읽습니다.",
    points: [
      {
        title: "코드에는 점검이 있고 문서에는 없습니다",
        body: "코드는 리뷰와 테스트를 거쳐 바뀝니다. 그 코드를 설명하는 문서는 아무도 확인하지 않은 채 낡아 갑니다.",
      },
      {
        title: "에이전트는 낡은 문서도 믿습니다",
        body: "틀린 문서를 읽은 에이전트는 틀린 전제로 코드를 고칩니다. 문서가 길고 그럴듯할수록 알아채기 어렵습니다.",
      },
      {
        title: "초안과 확인된 문서가 똑같아 보입니다",
        body: "에이전트가 방금 쓴 초안과 사람이 코드와 대조해 본 문서를 겉으로는 구별할 수 없습니다.",
      },
    ],
  },
  workflow: {
    heading: "작동 방식",
    intro: "문서는 docs/llm-wiki/ 아래 평범한 Markdown 파일입니다. 상태와 근거는 각 문서의 frontmatter에 기록됩니다.",
    steps: [
      {
        name: "Scaffold",
        title: "뼈대를 만듭니다",
        body: "quickstart가 프로젝트를 감지해 문서 뼈대를 만듭니다. 새로 만든 문서는 모두 needs_review로 시작합니다.",
        cmd: "quickstart --write",
      },
      {
        name: "Enrich",
        title: "실제 코드로 채웁니다",
        body: "에이전트나 사람이 코드를 읽고 내용을 채웁니다. 문서마다 source_files와 evidence에 근거를 적습니다. 예를 들면 src/api.ts#symbol:getUser처럼 적습니다.",
      },
      {
        name: "Review",
        title: "읽고 승인합니다",
        body: "문서를 verified로 올리는 명령은 review --approve 하나뿐입니다. 검사 결과가 남아 있는 문서는 승인을 거부합니다.",
        cmd: "review --approve <path>",
      },
      {
        name: "Watch",
        title: "근거가 바뀌면 다시 봅니다",
        body: "인용한 소스가 바뀌면 impact와 drift가 그 문서를 지목합니다. 새 프로젝트의 기본값인 lite에서는 꺼져 있고, standard는 경고, strict는 빌드 실패로 보고합니다.",
        cmd: "impact --since <ref>",
      },
    ],
  },
  demo: {
    heading: "근거가 바뀌는 순간을 따라가 보기",
    intro:
      "소스 파일 하나와 그것을 설명하는 문서 하나가 승인되고, 소스가 바뀌고, 다시 검토되기까지의 일곱 단계입니다. 6단계에서는 거버넌스 모드를 바꿔 같은 변경이 어떻게 다르게 보고되는지 볼 수 있습니다.",
    disclaimer:
      "설명용 시뮬레이션입니다. 여러분의 저장소에 연결되지 않습니다. 명령 출력은 v1.42.0을 실제로 실행해 얻은 결과에서 발췌했습니다.",
    controlsLabel: "데모 단계 이동",
    prev: "이전 단계",
    next: "다음 단계",
    stepOf: "{total}단계 중 {n}단계",
    modeLabel: "거버넌스 모드",
    modeHint: "모드는 6단계부터 결과에 영향을 줍니다.",
    modes: {
      lite: { label: "lite", summary: "새 프로젝트의 기본값입니다. 변경 점검이 꺼져 있어 아무 문서도 검사하지 않고 통과합니다." },
      standard: { label: "standard", summary: "바뀐 소스를 인용하는 verified 문서를 경고로 보고합니다. 빌드는 통과합니다." },
      strict: { label: "strict", summary: "같은 문서를 오류로 보고하고 빌드를 실패시킵니다(exit 1)." },
    },
    status: {
      title: "문서 상태",
      none: "아직 문서 없음",
      needs: "검토 대기 (needs_review)",
      verified: "승인됨 (verified)",
      flagged: "승인됨, 재검토 지목 (finding)",
      unchecked: "승인됨, 변경 점검 꺼짐",
    },
    fileSource: "소스",
    fileDoc: "문서",
    terminal: "터미널",
    steps: [
      {
        id: "source",
        title: "소스 파일이 있습니다",
        body: "src/invoice.js의 computeTotal(items)는 각 항목의 price를 더해 합계를 돌려줍니다.",
        caveat: "예시를 위해 만든 가상의 파일입니다.",
      },
      {
        id: "cite",
        title: "문서가 그 소스를 인용합니다",
        body: "에이전트가 docs/llm-wiki/domains/billing.md를 쓰면서 evidence에 src/invoice.js#symbol:computeTotal을 적습니다.",
        caveat: "validate는 인용이 해석되는지, 즉 파일이 있고 심볼이 언급되는지만 확인합니다. 문장이 맞는지는 확인하지 않습니다.",
      },
      {
        id: "draft",
        title: "에이전트가 쓴 초안은 검토 대기입니다",
        body: "에이전트가 쓴 문서는 status: needs_review로 남습니다. review는 대기 중인 문서를 위험도 순으로 보여 줄 뿐 아무것도 바꾸지 않습니다.",
        caveat: "검사 결과가 남은 문서는 승인할 수 없습니다. 실제로 실행했을 때 필수 필드 contains_sensitive_info가 빠진 문서는 승인이 거부됐습니다.",
      },
      {
        id: "approve",
        title: "사람이 읽고 명시적으로 승인합니다",
        body: "review --approve가 status: verified와 reviewed_by, reviewed_at을 기록합니다. 문서를 승격하는 명령은 이것 하나뿐입니다.",
        caveat: "reviewed_by는 승인할 때 넘긴 이름을 기록할 뿐, 그 사람이 누구인지 증명하지 않습니다. 누가 병합할 수 있는지는 브랜치 보호 규칙이 정합니다.",
      },
      {
        id: "change",
        title: "인용한 소스가 바뀝니다",
        body: "computeTotal이 수량까지 곱하도록 바뀌었습니다. 문서는 그대로입니다.",
        caveat: "문서의 문장은 이제 사실과 다릅니다. 하지만 파일만 봐서는 아무도 알 수 없습니다.",
      },
      {
        id: "check",
        title: "무엇이 보고되는지는 모드가 정합니다",
        body: "impact --since <ref>는 diff 안에서 바뀐 소스를 인용하면서 자신은 바뀌지 않은 verified 문서를 찾습니다. 위에서 모드를 바꿔 보세요.",
        caveat: "변경 감지는 대부분 파일 단위입니다. 파일이 바뀌었다는 사실을 알려 줄 뿐, 문서의 어느 문장이 틀렸는지는 알려 주지 않습니다.",
      },
      {
        id: "rereview",
        title: "다시 읽고, 고치고, 다시 승인합니다",
        body: "사람이 소스와 문서를 다시 읽고 틀린 문장을 고칩니다. 문서가 아직 verified인 채로 승인하면 \"already verified\"로 거부되므로, status를 needs_review로 되돌린 뒤 review --approve로 다시 승인합니다. 문서를 같은 변경 안에서 고쳤으므로 strict에서도 impact가 통과합니다.",
        caveat: "lite에서는 이 순간을 알려 주는 것이 없습니다. 재검토 신호가 필요하면 mode set standard --write로 점검을 켜세요.",
      },
    ],
    textHeading: "데모를 글로 읽기",
    textIntro: "위 시각화와 같은 내용입니다.",
    legend: { citation: "인용", unchanged: "그대로인 소스", changed: "바뀐 소스" },
    finding: {
      lite: "impact.source_changed: off (governance mode lite or config) — no document was checked",
      standard:
        "[warning] impact.source_changed docs/llm-wiki/domains/billing.md: Verified document depends on src/invoice.js, which changed in this diff, but the document is unchanged; re-review and update it or downgrade to needs_review.",
      strict:
        "[error] impact.source_changed docs/llm-wiki/domains/billing.md: Verified document depends on src/invoice.js, which changed in this diff, but the document is unchanged; re-review and update it or downgrade to needs_review.\nexit code 1",
    },
    sentenceBefore: "computeTotal(items)는 각 항목의 price 합계를 돌려준다.",
    sentenceAfter: "computeTotal(items)는 각 항목의 price × qty 합계를 돌려준다.",
  },
  start: {
    heading: "시작하기",
    intro:
      "먼저 아무것도 쓰지 않는 미리보기로 시작하세요. 각 명령이 파일을 바꾸는지, 설치가 필요한지 함께 적었습니다. 모든 명령은 v1.42.0에서 직접 실행해 확인했습니다.",
    writes: "파일을 씁니다",
    readOnly: "읽기 전용",
    noInstall: "설치 없이 실행",
    afterInstall: "설치 후 실행",
    copy: "복사",
    copied: "복사했습니다",
    copyFailed: "복사하지 못했습니다. 직접 선택해 복사하세요.",
    commands: [
      {
        id: "preview",
        cmd: "npx llm-wiki-governance@latest quickstart --dry-run",
        writes: false,
        needsInstall: false,
        title: "무엇이 생길지 미리 보기",
        effect: "만들어질 문서 목록과 다음 단계를 출력하고 끝납니다. 파일을 하나도 쓰지 않습니다. CLI 도움말은 오래된 캐시 버전을 피하려고 @latest를 붙이라고 안내합니다.",
      },
      {
        id: "install",
        cmd: "npm install -D llm-wiki-governance",
        writes: true,
        needsInstall: false,
        title: "개발 의존성으로 설치",
        effect: "package.json과 lock 파일, node_modules를 바꿉니다. 이후에는 npx llm-wiki로 실행합니다.",
      },
      {
        id: "scaffold",
        cmd: "npx llm-wiki-governance quickstart --write --agent claude",
        writes: true,
        needsInstall: false,
        title: "문서 뼈대 만들기",
        effect: "docs/llm-wiki/ 문서 뼈대, lite 모드로 설정된 llm-wiki.config.json, CLAUDE.md, 에이전트용 스킬과 프롬프트 파일을 만듭니다. Codex를 쓴다면 --agent codex를 쓰세요.",
      },
      {
        id: "validate",
        cmd: "npx llm-wiki validate",
        writes: false,
        needsInstall: true,
        title: "구조와 인용 검사",
        effect: "frontmatter 구조와 인용이 해석되는지 검사합니다. 아무것도 쓰지 않습니다.",
      },
      {
        id: "review",
        cmd: "npx llm-wiki review",
        writes: false,
        needsInstall: true,
        title: "검토 대기 목록 보기",
        effect: "needs_review 문서를 위험도 순으로 나열하고, 승인 가능한 문서와 막힌 문서를 구분합니다.",
      },
      {
        id: "approve",
        cmd: "npx llm-wiki review --approve docs/llm-wiki/project-profile.md",
        writes: true,
        needsInstall: true,
        title: "읽어 본 문서 하나 승인",
        effect: "그 문서의 frontmatter에 status: verified, reviewed_by, reviewed_at을 기록합니다. 직접 읽고 확인한 문서에만 쓰세요.",
      },
      {
        id: "mode",
        cmd: "npx llm-wiki mode set standard --write",
        writes: true,
        needsInstall: true,
        title: "변경 점검 켜기",
        effect: "llm-wiki.config.json의 모드만 바꿉니다. 문서는 만들거나 고치거나 승격하지 않습니다. 이때부터 impact와 drift가 경고를 보고합니다.",
      },
      {
        id: "impact",
        cmd: "npx llm-wiki impact --since origin/main",
        writes: false,
        needsInstall: true,
        title: "PR에서 재검토할 문서 찾기",
        effect: "기준 ref 이후 바뀐 소스를 인용하는 verified 문서를 나열합니다. lite에서는 아무것도 검사하지 않고 통과합니다.",
      },
    ],
    warning:
      "패키지를 설치하지 않은 곳에서 npx llm-wiki를 실행하지 마세요. 같은 이름의 무관한 npm 패키지가 있습니다. 설치 전에는 npx llm-wiki-governance를 씁니다.",
  },
  limits: {
    heading: "이 도구가 증명하지 않는 것",
    intro: "검사를 통과했다는 것이 문서가 맞다는 뜻은 아닙니다. 다음은 v1.42.0 README가 직접 밝히는 한계입니다.",
    items: [
      {
        title: "문장이 참인지 확인하지 않습니다",
        body: "인용이 해석되는지만 확인합니다. 문장이 맞는지는 여전히 검토자가 판단합니다. 숫자를 틀리게 고친 문서도 통과할 수 있습니다.",
      },
      {
        title: "누가 승인했는지 증명하지 못합니다",
        body: "reviewed_by는 승인 명령에 넘긴 이름입니다. 에이전트 이름을 agentReviewers에 등록하면 통계에서 따로 셉니다.",
      },
      {
        title: "문서를 대신 써 주지 않습니다",
        body: "CLI는 뼈대를 만들고, 검사하고, 프롬프트를 출력합니다. 내용은 사람이나 에이전트가 씁니다. README에 기록된 작은 실험(외부 저장소 1개, 모델 1개, 과제 6개)에서는 채우지 않은 위키가 위키가 없을 때보다 결과가 나빴습니다.",
      },
      {
        title: "변경 감지는 대부분 파일 단위입니다",
        body: "줄 범위와 Markdown 섹션 인용만 영역 단위로 좁혀집니다. 날짜 기반 drift는 승인한 날 커밋된 변경을 보지 못할 수 있습니다.",
      },
      {
        title: "계획 승인은 구현 승인이 아닙니다",
        body: "요구사항 문서를 승인하면 계획을 승인한 것입니다. impact.plan_changed는 다시 볼 파일을 알려 줄 뿐, 코드가 요구사항을 충족한다는 것을 보여 주지 않습니다.",
      },
      {
        title: "의미 검색도, 호스팅 서비스도 아닙니다",
        body: "검색은 BM25 키워드 순위입니다. 임베딩이나 색인 서비스는 없고, CLI는 스스로 네트워크 요청을 보내지 않습니다.",
      },
    ],
  },
  open: {
    heading: "오픈 소스",
    body: "MIT 라이선스로 공개된 무료 도구이고, 개인 개발자가 유지보수합니다. 버그 제보와 질문은 GitHub에 남겨 주세요.",
    links: { repo: "소스 저장소", docs: "문서", issues: "이슈", discussions: "토론", npm: "npm 패키지" },
  },
  footer: {
    label: "도면 정보",
    product: "제품",
    version: "기준 버전",
    baseline: "기준 커밋",
    license: "라이선스",
    site: "이 사이트",
    siteValue: "llm-wiki-governance-web, MIT",
    note: "이 사이트는 제품 저장소와 별개로 관리됩니다. 데모는 설명용 시뮬레이션이며 어떤 저장소에도 연결되지 않습니다.",
  },
};
