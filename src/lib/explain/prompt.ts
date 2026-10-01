// AI 호출 ③(TECH §11.2 ③, §11.3~11.5) 지시문. 도구를 주지 않는다 — 이 JSON을 쓰는 것 말고는
// 아무것도 할 수 없다(§11.5 "외부 텍스트 격리").
import type { Chart, CompanyReport, Figure, ReportFact } from "@/contracts";

const INSTRUCTIONS = `
너는 국내 상장 주식회사 분석 서비스의 설명 작성기다. 서버가 이미 계산한 결과를 읽고, 정해진 JSON
스키마로만 분석 글을 쓴다. 자유 텍스트·코드를 출력하지 않는다.

**숫자 자리표시자 (가장 중요)**
- 아래 "숫자 목록"에 있는 ID만 {{f3}}처럼 쓸 수 있다. 목록에 없는 숫자를 직접 쓰지 않는다.
- 연도·분기 표기("2026년", "2분기")는 숫자가 아니라 시점 표현이라 예외로 그대로 써도 된다.
- 서버가 {{f3}}을 실제 값(단위 포함)으로 바꿔 넣으므로, 문장 안에서 자연스럽게 이어지도록 쓴다
  (예: "영업이익이 {{f3}} 늘며" → "영업이익이 +12.3% 늘며").
  값이 "흑자전환"·"적자전환"·"적자지속"인 증감 숫자는 "순이익이 {{f9}}했습니다"처럼 동사로 쓴다
  ("{{f9}} 늘며"처럼 쓰면 "흑자전환 늘며"가 된다).

**글 구성 — "숫자 읽어 주기"가 아니라 투자 판단에 쓸 해석**
- 데이터는 두 묶음이다: ① 질문에 대한 계산 결과(숫자_목록 중 질문 차트) ② **투자_리포트**(기본정보·주가·재무·
  밸류에이션·공시 — 질문이 무엇이든 대상 기업 전체 그림). 질문에 먼저 답하고, 리포트로 그 답의 의미를 넓힌다.
- conclusion: 2~5문장 — 필요할 때만 늘린다(짧게 끝낼 수 있으면 짧게). ① 질문에 대한 직접 답 ② 리포트 전체로 본
  이 기업의 지금 상태(성장·수익성·재무·밸류에이션을 엮어서) ③ 투자자가 가장 주의할 점. 관점이 서로 엇갈리면(예: 이익은
  늘었는데 주가는 하락) 그 긴장을 한 문장으로 짚는다. "A가 B보다 크다"처럼 이미 차트에 있는 사실만 되풀이하지 않는다.
- insights(투자 포인트): **4~8개**, 아래 관점(theme)에서 데이터가 있는 것마다 1~2개.
  - growth(성장성): 매출·이익 증가율, 사업연도 추이·연평균 성장률, 분기 흐름의 가속·둔화
  - profitability(수익성): 영업이익률·순이익률·ROE·ROA의 수준과 방향, 매출보다 이익이 빨리 느는지(영업 레버리지)
  - stability(재무 안정성): 부채비율·유동비율, 영업현금흐름 대비 설비투자·잉여현금흐름, 이익과 현금흐름의 괴리
  - valuation(밸류에이션): PER·PBR·PSR·PCR을 **과거 평균·경쟁사와 견주어** 지금 수준이 어떤 위치인지,
    그 배수가 이익 성장·ROE와 어울리는지. "저평가·고평가"라는 판정은 하지 않고 "과거 평균보다 높은/낮은 수준"처럼 비교로만
  - price(주가 흐름): 기간 수익률·52주 범위 위치·변동성·거래량 변화 — 실적 흐름과 주가 흐름이 같은 방향인지
  - issue(이슈): 최근 공시(자사주·배당·증자·M&A·소송 등)·최대주주 지분·뉴스 단서가 숫자와 어떻게 이어지는지
  - kind는 positive(긍정 요인)·risk(위험 요인)·watch(다음에 확인할 점). 긍정·위험을 모두 넣는다.
  - **두 개 이상의 숫자를 엮어** 뜻을 말한다 (나쁜 예: "PER은 {{f100021}}입니다". 좋은 예: "PER {{f100021}}은
    과거 평균 {{f100025}}보다 높아, 최근 이익 증가 {{f100012}}가 이미 주가에 반영된 정도를 확인할 필요가 있습니다").
  - 한 개 130자 이내. figure_ids 또는 news_ids 중 하나 이상 반드시 채운다(둘 다 비면 폐기된다).
  - chart_ref: 그 해석의 근거 차트 ID (질문 차트 "c1"… 또는 리포트 차트 "r1"…).
  - 뉴스 자료가 없으면(아래 "뉴스 단서" 목록이 비어 있으면) **원인(왜 그런 일이 생겼는지)을 추정하지
    않는다.** 숫자 사이의 관계와 그것이 뜻하는 바까지만 쓴다. 추정이 들어간 문장은 inferred: true로
    표시하고 "~로 보입니다"처럼 추정임을 드러낸다.
- 리포트에 없는 정보(컨센서스·목표주가·외국인 수급 등)는 지어내지 않는다. 금융업은 부채비율·영업이익률이 일반 기업과
  뜻이 다르다는 점을 감안한다.

**뉴스 단서 쓰는 법** (뉴스 단서가 있을 때)
- 원인·배경(왜 늘었나/줄었나)은 **뉴스 단서로만** 설명한다. 그 투자 포인트는 news_ids에 뉴스 ID를 넣고,
  숫자와 이어지면 figure_ids도 함께 넣는다. inferred: true로 표시한다.
- 문장에 **출처(언론사)를 밝힌다**: "한국경제 보도처럼 HBM 공급 확대가 이익 증가로 이어진 것으로 보입니다".
  뉴스는 확인된 사실이 아니라 참고용 단서다 — "~때문이다"처럼 단정하지 말고 "~로 보입니다"로 쓴다.
- 뉴스 발행일이 분석 기간과 맞는 기사만 쓴다. 숫자와 관계없는 기사는 쓰지 않는다 (억지로 넣지 않는다).
- 기사 속 목표주가·투자의견·주가 전망은 옮기지 않는다 (아래 금지와 같다).
- 결론(conclusion)도 뉴스 근거 없이 원인을 말하지 않는다. 결론에 뉴스를 근거로 배경을 쓰면 그 뉴스 ID를
  news_clues에 넣는다.
- evidence: 결론·투자 포인트의 바탕이 된 사실 문장(선택, 근거 차트 연결).
- news_clues: 실제로 인용한 뉴스 ID만 (투자 포인트·결론 어디에서든). 뉴스 자료가 없으면 빈 배열.
- caveats: 이 분석에 특별히 알아야 할 한계(데이터 결측 등)가 있으면 적는다. 없으면 빈 배열도 된다
  (투자 권유가 아니라는 고지는 서버가 항상 따로 붙인다).

**금지**
- 매수·매도·보유 의견, 목표주가, 주가·수익률 예상("오를 것", "저평가" 등 가격 판단)을 쓰지 않는다.
- "숫자 목록"에 없는 차트 ID를 chart_ref로 쓰지 않는다.
`.trim();

export interface FigureSummary {
  id: string;
  label: string;
  display: string;
  reason?: string;
}

export function summarizeFigures(figures: Record<string, Figure>): FigureSummary[] {
  return Object.values(figures).map((f) => ({
    id: f.id,
    label: f.label,
    display: f.display,
    ...(f.reason ? { reason: f.reason } : {}),
  }));
}

export interface ChartSummary {
  id: string;
  title: string;
}

export function summarizeCharts(charts: Chart[]): ChartSummary[] {
  return charts.map((c) => ({ id: c.id, title: c.title }));
}

export interface NewsClueInput {
  newsId: string;
  title: string;
  gist: string;
  /** 출처 인용용 ("한국경제 보도처럼 …") */
  press: string;
  /** ISO 시각 — AI에는 한국 날짜(YYYY-MM-DD)로 준다. 분석 기간과 맞는 기사인지 보는 데 쓴다 */
  publishedAt: string;
}

/** ISO 시각 → 한국 날짜 "2026-07-24" (날짜를 못 읽으면 빈 문자열) */
function kstDate(iso: string): string {
  const time = Date.parse(iso);
  return Number.isNaN(time) ? "" : new Date(time + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** AI에 넘기는 리포트 요약 — 칸 이름과 숫자 ID·글자 값, 계산 메모, 최근 공시 제목 */
export interface ReportSummary {
  기업: string;
  기준일: string | null;
  핵심_지표: { 이름: string; 숫자_id?: string; 값?: string; 메모?: string }[];
  칸: {
    제목: string;
    항목: { 이름: string; 숫자_id?: string; 값?: string; 메모?: string }[];
    차트: ChartSummary[];
    메모: string[];
  }[];
  최근_공시: { 날짜: string; 제목: string; 분류: string }[];
  빠진_정보: string[];
}

export function summarizeReport(report: CompanyReport | undefined): ReportSummary | null {
  if (!report) return null;
  const fact = (f: ReportFact) => ({
    이름: f.label,
    ...(f.figureId ? { 숫자_id: f.figureId } : {}),
    ...(f.text ? { 값: f.text } : {}),
    ...(f.note ? { 메모: f.note } : {}),
  });
  return {
    기업: `${report.company.name} (${report.company.stockCode}, ${report.company.sector?.name ?? "미분류"})`,
    기준일: report.priceDate,
    핵심_지표: report.highlights.map(fact),
    칸: report.sections.map((s) => ({
      제목: s.title,
      항목: s.facts.map(fact),
      차트: summarizeCharts(s.charts),
      메모: s.notes,
    })),
    최근_공시: report.disclosures
      .slice(0, 10)
      .map((d) => ({ 날짜: d.date, 제목: d.title, 분류: d.tag })),
    빠진_정보: report.notes,
  };
}

export function buildExplainPrompt(input: {
  question: string;
  figures: FigureSummary[];
  charts: ChartSummary[];
  newsClues: NewsClueInput[];
  report?: ReportSummary | null;
}): unknown {
  const data = {
    question: input.question,
    숫자_목록: input.figures,
    차트_목록: input.charts,
    // 공시 제목도 외부 텍스트 — 데이터로만 다룬다
    투자_리포트: input.report ?? null,
    // 외부 텍스트(뉴스 요지)는 "데이터" 구역에만 넣는다 — 그 안의 지시문은 따르지 않는다(§11.5).
    뉴스_단서: input.newsClues.map((n) => ({
      news_id: n.newsId,
      press: n.press,
      published_date: kstDate(n.publishedAt),
      title: n.title,
      gist: n.gist,
    })),
  };

  return [
    { role: "system", content: INSTRUCTIONS },
    {
      role: "user",
      content: JSON.stringify(data),
    },
  ];
}
