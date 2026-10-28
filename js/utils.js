// js/utils.js
// 공통 상수 및 보안 유틸리티 (XSS 방지, 회원 검증, 시각 포맷)

// 고정 정회원 5인 (회칙 제2조)
export const MEMBER_NAMES = ["송환오", "장우석", "김진세", "김정수", "이해웅"];

// 회장 피선거권자 4인 (회칙 제3조: 장우석 총무 영구 면제)
export const CANDIDATE_NAMES = ["송환오", "김진세", "김정수", "이해웅"];

// 대통령 임기 만료 기본값 (Firestore term_config 미설정 시 사용)
export const DEFAULT_TERM_END = "2030-06-04T00:00:00+09:00";

// HTML 특수문자 이스케이프 — innerHTML에 사용자 입력을 넣을 때 반드시 사용
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 압축 업로드된 사진(data URL)만 허용 — 외부 URL·javascript: 스킴 차단
export function safeImageSrc(src) {
  const s = String(src || "");
  return /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s) ? s : "";
}

// "YYYY-MM-DD HH:mm" 형식의 현재 시각
export function nowStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// "YYYY-MM-DD" 형식의 오늘 날짜
export function todayStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// prompt()로 본인 이름을 받아 정회원 5인 중 한 명인지 검증
export function askMemberName(actionLabel) {
  const input = prompt(`${actionLabel}자 본인 이름을 입력하세요 (${MEMBER_NAMES.join(", ")}):`);
  if (input === null) return null;
  const name = input.trim();
  if (!MEMBER_NAMES.includes(name)) {
    alert("정회원 5인의 이름만 입력할 수 있습니다.");
    return null;
  }
  return name;
}
