# my-alumni

5인 동창 곗모임 웹앱 (PWA · GitHub Pages · Firebase Firestore)

## 페이지 구성
| 파일 | 기능 |
|---|---|
| `index.html` | 대시보드 (현 회장, 다음 모임, 회원 가족 현황 → 회칙 제2·6·7조 자동 갱신) |
| `history.html` | 과거 여행 & 모임 기록 (사진 자동 압축) |
| `wiki.html` | 회칙 본문 · 개정 역사 · 회장 연혁 |
| `settlement.html` | 개별 지출 정산 (공금 통장 1원 단위 환급) |
| `election.html` | 대통령 임기 연동 카운트다운 · 4인 룰렛 회장 선출 (→ 회칙 제2·4조 자동 갱신) |
| `gathering.html` | 회장 모임 공표 |
| `ledger.html` | 회비 장부 (카카오뱅크 모임통장으로 이관, 비활성) |

## 공통 모듈
- `js/firebase.js` — Firebase 초기화
- `js/utils.js` — XSS 방지(`escapeHtml`, `safeImageSrc`), 회원 상수, 이름 검증, 시각 포맷
- `js/rules.js` — 회칙 조항 단위 자동 갱신 · 판본 저장(제10조 편집 요약 의무)

## 🔒 보안 설정 (필수)
Firebase 웹 API 키는 원래 공개되는 값이라 숨길 필요가 없습니다. 실제 데이터 보호는 **Firestore 보안 규칙**이 담당합니다.

1. [Firebase 콘솔](https://console.firebase.google.com/) → 프로젝트 `alumni-64530` → **Firestore Database → 규칙**
2. 저장소의 `firestore.rules` 내용을 전부 붙여넣고 **게시**
3. (권장) **Google Cloud 콘솔 → API 및 서비스 → 사용자 인증 정보**에서 API 키에 *HTTP 리퍼러 제한*으로 `https://jin-spec-0011.github.io/*` 추가

규칙이 강제하는 내용:
- 정해진 8개 컬렉션 외 읽기/쓰기 차단
- 필드 이름·타입·길이 검증 (영수증 금액은 1 ~ 10,000,000원 정수)
- 회칙 개정 로그(`rule_revisions`)는 추가만 가능 — 수정·삭제 불가
- 회칙 저장 시 편집 요약 필수 (제10조)
- 장우석 총무는 회장 당선 기록 불가 (제3조)
- 작성자/편집자 이름은 정회원 5인만 허용

> 로그인 기능이 없으므로 링크를 아는 사람은 누구나 데이터를 쓸 수 있습니다. 더 강하게 막으려면 Firebase Authentication(예: 이메일 링크 로그인) 도입이 필요합니다.
