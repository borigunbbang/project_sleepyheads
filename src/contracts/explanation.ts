// API_SPEC §2.6 분석 글 (우측 영역)

export interface NewsClue {
  newsId: string;
  title: string;
  press: string;
  publishedAt: string;
  /** Google 뉴스 RSS가 준 주소만 (Google 경유, 누르면 원문으로 이동) */
  url: string;
  /** 우리가 만든 1~2문장 요지 (본문 아님) */
  gist: string;
}

/** 긍정 요인 / 위험 요인 / 다음에 확인할 점 */
export type InsightKind = "positive" | "risk" | "watch";

/** 투자 포인트의 관점 (투자 리포트 — 성장성·수익성·재무 안정성·밸류에이션·주가 흐름·이슈) */
export type InsightTheme =
  "growth" | "profitability" | "stability" | "valuation" | "price" | "issue" | "general";

/** 투자 포인트 (PRD F-V6, F-V11~F-V13, TECH §11.3) — 숫자 해설이 아니라 투자 판단에 참고할 해석 */
export interface Insight {
  kind: InsightKind;
  /** 관점 (옛 분석 글에는 없다) */
  theme?: InsightTheme;
  /** 서버가 숫자를 채운 완성 문장 (insightMaxChars 이내) */
  text: string;
  /** 근거 숫자 ID — figureIds·newsIds 중 하나 이상 필수 */
  figureIds: string[];
  /** 근거 뉴스 ID (Step 3부터) */
  newsIds: string[];
  /** 근거 차트 ("해당 차트 보기") */
  chartRef: string | null;
  /** 추정이 들어간 문장 → 화면에 "추정" 표시 */
  inferred: boolean;
}

/**
 * 분량 상한 (PRD F-V11). 서버 검사와 화면 테스트가 같은 값을 쓴다.
 * 투자 리포트(Phase 5 후속)로 관점별 해석을 담느라 늘렸다 — 결론은 필요에 따라 최대 15문장(2026-10-01), 투자 포인트 2~8개.
 */
export const EXPLANATION_LIMITS = {
  conclusionSentences: 15,
  insightsMin: 2,
  insightsMax: 8,
  insightMaxChars: 160,
  /** 결론 + 투자 포인트 합계 (공백 포함) */
  mainMaxChars: 3500,
} as const;

export interface Explanation {
  /** stale = 필터 변경으로 원래 조건 기준 */
  status: "ready" | "failed" | "stale";
  /** 서버가 {{f3}}을 실제 값으로 채운 완성 문장 (최대 conclusionSentences문장) */
  conclusion: string[];
  /** 투자 포인트 (근거 연결 검사를 통과한 것만) */
  insights: Insight[];
  evidence: { text: string; chartRef: string | null }[];
  newsClues: NewsClue[];
  caveats: string[];
  label: "AI 작성";
  /** status = failed일 때 "설명 생성 실패" */
  failureMessage?: string;
}
