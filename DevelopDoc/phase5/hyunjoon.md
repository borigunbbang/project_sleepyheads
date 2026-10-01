# Phase 5 보고서 — 현준 (feat/P5-demo)

> 2026-10-01, 트랙 C "시연·사용자 테스트". 지시문 [phase5-hyunjoon](../prompts/phase5-hyunjoon.md) 순서대로. 마이그레이션 없음, 계약(`src/contracts/**`) 변경 없음, 운영 DB 변경 없음, **실제 AI 호출 0회**(운영 질문은 시연 리허설 1회에 모음).

## 1. 무엇을 했나

### 1.1 `DevelopDoc/DEMO_SCRIPT.md` (먼저 — 이 브랜치의 첫 커밋으로 올림)
- 시연 질문 6개: Q1 단순 `SK하이닉스 최근 실적 어때?` · Q2 추이 `… 최근 8분기 영업이익 추이` · Q3 복합+보드 `SK하이닉스 직전 분기 대비 영업이익 변화와 감소한 경쟁사 비교해줘` · Q4 `SK하이닉스 PER 알려줘` · Q5 뉴스 `… 2026년 2분기 영업이익이 왜 늘었어?` · Q6 거절 `SK하이닉스 지금 사도 돼?`
- 질문마다 기대 화면·말할 내용·막히면 대안(§4 A~E), 시연 전 점검(병준 `demo-preflight`·예림 `warm-demo` 연결), 리허설 1회 규칙
- **`warm-demo` 대상 기업** §2: SK하이닉스·삼성전자·한미반도체·DB하이텍 (자동 선택 경쟁사가 바뀌면 리허설 실행 기록으로 고친다)
- 질문 차감 약 7회(거절도 1회 차감 — PRD F-U8), 숫자 기준은 회귀 정답과 같음(2026Q2 영업이익 60.5조, PER 8.01배)

### 1.2 화면 마감 (가짜 모드 e2e로 확인)
1. **계획 카드 [닫기] 뒤 화면** (`AnalysisScreen.tsx`, 병준 Phase 4 부탁 2): 취소가 받아들여지면 곧바로 "취소한 분석"으로 바꾸고, 그 뒤엔 단계 반복(`load`) 없이 한 번만 읽는다. 읽은 응답이 아직 취소 전 상태(계획 카드·실행 중)여도 취소 결과로 보여 준다. 운영에서 화면이 남던 원인(다시 읽은 응답이 늦거나 이전 상태)은 확정 못 했지만, 어떤 경우든 화면이 바뀐다. 운영 확인은 리허설에서 남아 있는 분석 `32e0e56b`로 [닫기] + Network(STEP5 §3 #4)
   - e2e `steps.spec.ts` "[닫기] 뒤 다시 불러온 분석이 아직 계획 카드 상태여도 …" (가짜 모드 흉내 `sleepyheads.mock.staleAfterCancel`)
2. **보드를 볼 때 `VersionBar`** (`VersionBar.tsx`·`BoardPanel.tsx`): BoardPanel이 지금 보여 주는 보드 결과의 `basis.dataVersionId`를 위로 알려 주고, 원래 분석과 다르면 막대가 "원래 분석 데이터 버전 ○ · 아래 보드 데이터 버전 ○"과 "이 막대의 버튼은 원래 분석 기준" 안내를 보인다. 서버는 그대로(보드 결과 `flags` 줄도 그대로 보임)
   - e2e `board.spec.ts` "보드가 다른 데이터 버전으로 다시 계산되면 …" (흉내 `sleepyheads.mock.boardNewVersion`)
3. **조회 시작 분기 문구**: 화면에 직접 적힌 "2015년 1분기"(질문 422 안내·보드 422 안내·가짜 모드 2곳·e2e 1곳)를 `EARLIEST_QUARTER`에서 만들도록 — 예림님이 2016Q1로 바꾸면 화면도 같이 바뀐다 (`earliestQuarterLabel()`)

### 1.3 WU-599 Step 5 통과 테스트 — `STEP5_PASS_TEST.md`
- §1 조건 9개: 회귀 ✅(28/28·CI 초록불)·범위 판정 ✅·주입 방어 ✅·**결합 경고 ✅(자동)**·**작업 큐 ✅(자동)**·README ✅ / WU-505 🟨(대시보드 👤) / 시연·사용자 테스트 ⬜(병합 뒤)
- §3 Phase 4 병합 배포 확인표 8줄(PER 카드·ⓘ, 자동 선택 경쟁사 칩, VersionBar, [닫기], 주입 방어, 회귀 CI, 뉴스, 거절) — 자동 증거 채움, 운영은 리허설 칸
- §5 최종 시연 기록표 = DEMO_SCRIPT 순서

### 1.4 사용자 테스트 준비 — `USER_TEST.md`
- 과제 3개(T1 최근 실적 · T2 변화 원인 · T3 경쟁사 비교)로 나누고 과제마다 시간·"다 알았다" 기준, 과제 평균 3분·만족 80%·포기 수
- 동의 문구(수집 항목·녹화 없음·언제든 중단·탈퇴로 삭제·투자 권유 아님) + 동의/탈퇴 기록표
- §4 끝난 뒤 데이터 지우기: 참가자 본인 `/me` → 회원 탈퇴(`탈퇴` 입력) / 떠난 뒤 요청은 병준님 `OPS_RUNBOOK.md` / 진행자 시험 데이터는 본인 것만

### 1.5 FINAL_CHECKLIST v0.4.0
- 필수(●) **155개 중 102개 체크**(증거 위치 확인한 것만), 53개 미체크 → §15에 사유·영향·대응 **26줄** (승인 칸은 현준님)
- 문구가 구현과 다른 항목은 요구사항을 바꾸지 않고 증거 칸·§15에 차이를 적음 (질문당 AI 상한 $0.03, SECURITY DEFINER 8개·Advisor WARN 2, Cron 3개, `calc_version` v3 등)

### 1.6 회귀 CI
- main `Regression` run `36813584403` ✅ 28/28 (2026-10-01 13:06 KST, `83933e1`), 로컬 재실행 28/28 → `RESULTS.md` §5 실행 기록 표

### 1.7 WU-505 대시보드 (👤) — 진행 중
- 자동으로 확인된 것: ②③ 이메일 가입 꺼짐·구글 로그인 켜짐(`pnpm check:keys`가 Supabase 공개 설정을 읽음), ⑧ Supabase 프로젝트 `ACTIVE_HEALTHY`(일시정지 아님, MCP 읽기)
- 메뉴 이름 공식 문서로 다시 확인(2026-10-01): Supabase **URL Configuration**·**Authentication > Providers > Google**·**Database > Backups**(무료는 자동 백업 없음, `supabase db dump`), Google Cloud **APIs & Services > Credentials**(또는 Google Auth Platform > Clients) **Authorized redirect URIs**, Vercel 사이드바 **Usage**
- 남은 것(현준님): ⑥ URL·리디렉션, ⑦ 수동 백업 1회, OpenAI Monthly spend limit(조원 각자), ⑧ Vercel Usage → 결과는 SECURITY_CHECK에

## 2. 완료조건
| WU | 상태 |
|---|---|
| WU-599 | 🟨 통과 테스트 조건 4개(WU-501~504) ✅ 근거 기록, 시연 대본·사용자 테스트 진행표 준비. 리허설·사용자 테스트·`v1.0`은 Phase 5 병합 뒤 |
| WU-505 | 🟨 대시보드 👤 진행 중 (§1.7) |

## 3. 자체 검토
- `pnpm lint` ✅ · `format:check` ✅ · `typecheck` ✅ · `pnpm test` **1,310 ✅** (전체 실행에서 바쁠 때 4개가 5초 시간 초과 — `routes.test.ts` A1·A3, `quota-usage`, `injection-tools`; 따로 돌리면 92/92 ✅, 백그라운드 작업과 겹친 부하. 원래 있던 현상, Phase 4 보고서 §3과 같음) · `pnpm test:e2e` **161 ✅ / 1 건너뜀** · 회귀 **28 ✅**
- `/code-review high` 6개 → **고친 것 5개**: 실행 중(불러오는 중) [취소] 뒤 스피너가 남을 수 있던 것, 취소 뒤 오래된 "running" 응답이 단계 반복을 다시 돌려 오류 카드로 덮던 것, 가짜 모드 기간 밖 판정이 2015를 직접 적던 것, 흉내 스위치 중복(→ `mock-store.ts` `sessionFlag`), 낡은 주석
  - 남긴 것 1개: `earliestQuarterLabel()`이 `components/ask/errorMessages.ts`에 있어 가짜 모드(`lib/api-client`)가 화면 파일을 가져온다 → 제자리는 `lib/ask/quarter.ts`(예림 소유) — §4 부탁 1

## 4. 다른 트랙에 부탁
| # | 누구 | 내용 |
|---|---|---|
| 1 | 예림 (`lib/ask/quarter.ts`) | `EARLIEST_QUARTER` 옆에 `formatQuarterKo(q)`("2015년 1분기") 같은 함수를 두면 `errorMessages.ts`의 `earliestQuarterLabel()`을 그것으로 바꾸겠다 (통합 때 가능) |
| 2 | 예림 (`warm-demo`) | DEMO_SCRIPT §2 기업 4곳. 리허설 실행 기록의 자동 선택 경쟁사가 다르면 알려 주기 |
| 3 | 예림 | FINAL_CHECKLIST §15: 정확도 샘플 7곳(기준 10곳), 섹터 분류 근거(`직접 지정`/`업종코드 기준`)가 화면에 없음 — 서버가 결과에 실어 주면 화면은 현준 |
| 4 | 병준 | `DECLINE_LIMIT`(하루 거절 11번째)을 직접 지나는 테스트가 없다(라우트 테스트가 모두 false로 흉내), `max_news_search_calls`를 읽는 코드가 없다 — FINAL_CHECKLIST §5.1 |
| 5 | 병준 | `OPS_RUNBOOK.md`에 "참가자가 떠난 뒤 회원 데이터 지우기" 절차 (USER_TEST §4가 가리킴) |
| 6 | 통합 | ① HANDOFF에 Google 뉴스 RSS 404(2026-10-01 14:00 `check:keys`, 로컬) — 리허설 Q5 전에 다시 확인 ② WORK_UNITS 현황표 WU-201·202·204(완료조건 모두 체크인데 🟨)·WU-503 본문("통과 20 · 대기 8")·TECH §21 T5·T8 상태가 낡음 ③ README §3 "Cron 2개" → 3개 |

## 5. 마이그레이션·계약·공유 파일
- 마이그레이션 없음. 계약 변경 없음. 잠긴 파일(`ResultView.tsx`·`contracts/**`·`http.ts`·`route.ts`·`guards.ts`·`package.json`) 손대지 않음
- 고친 파일은 모두 소유표 안: `components/**`(Phase 5에 열린 `AnalysisScreen.tsx`·`VersionBar.tsx` 포함), `lib/api-client/mock-*.ts`, `tests/e2e/**`, `tests/regression/RESULTS.md`, `DevelopDoc/DEMO_SCRIPT.md`·`STEP5_PASS_TEST.md`·`USER_TEST.md`·`FINAL_CHECKLIST.md`, WORK_UNITS WU-599 칸
- `VersionBar.tsx` 머리 주석의 "예림님만 고친다"를 Phase 5 현준 변경으로 바꿈

## 6. 사람이 확인할 것
1. **WU-505 대시보드**(§1.7 남은 것) → SECURITY_CHECK 표
2. **시연 리허설 1회**(Phase 5 병합 배포 뒤, 시연 전날): DEMO_SCRIPT §5 — STEP5 §3·§5 칸 채우기, 375px 캡처, 오늘 AI 비용
3. **사용자 테스트**(리허설 뒤): USER_TEST — 3명 이상
4. FINAL_CHECKLIST §15 26줄 승인 여부(현준님)
