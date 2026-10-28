// js/rules.js
// 회칙 자동 갱신 공통 모듈
// - 인원 변동(제2·6·7조)과 회장 승계(제2·4조) 시 "해당 조항만" 교체하고
//   회원이 직접 편집한 나머지 조항(제8·9조 등)은 그대로 보존합니다.
import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { nowStr } from "./utils.js";

// 회원 목록으로부터 집계값 계산
export function computeStats(members) {
  let spouseCount = 0;
  let childCount = 0;
  let marriedCount = 0;
  let singleCount = 0;
  members.forEach(m => {
    if (m.marital === "married") { spouseCount += 1; marriedCount += 1; }
    else { singleCount += 1; }
    childCount += Number(m.children) || 0;
  });
  const adultCount = 5 + spouseCount;
  const totalCount = adultCount + childCount;
  const monthlyTarget = (marriedCount * 80000) + (singleCount * 40000);
  const leader = members.find(m => String(m.role || "").includes("회장"));
  const leaderName = leader ? leader.name : "송환오";
  return { adultCount, spouseCount, childCount, marriedCount, singleCount, totalCount, monthlyTarget, leaderName };
}

// 자동 생성 대상 조항 본문
function buildArticle(num, members) {
  const s = computeStats(members);
  switch (num) {
    case 2: {
      const lines = members.map(m => {
        const roleClean = String(m.role || "회원").replace(/^[^\s가-힣]+\s*/, "");
        const desc = (m.marital === "married")
          ? (Number(m.children) > 0 ? `기혼, 자녀 ${m.children}명` : "기혼, 무자녀")
          : "미혼";
        return `• ${m.name}: ${roleClean} (${desc})`;
      });
      return `제2조 (회원의 자격 및 현황)
본 회의 정회원은 아래 5인으로 영구 한정한다.
${lines.join("\n")}`;
    }
    case 4:
      return `제4조 (임기 및 탄핵 연동)
① 회장 임기는 대한민국 대통령 재임 기간과 일치한다.
② 대통령 탄핵 인용 시 회장직은 즉시 자동 박탈되며 비상 선출을 진행한다.
③ 차기 회장은 장우석 총무를 제외한 4인(${s.leaderName} 현 회장 포함)을 대상으로 룰렛 추첨하며 확률은 각 25%로 균등하다. (연임 제한 없음)`;
    case 6:
      return `제6조 (가족 동반 및 수용 상한)
최대 수용 규모는 성인 ${s.adultCount}명(회원 5 + 배우자 ${s.spouseCount}명)과 어린이 ${s.childCount}명을 합산한 총 ${s.totalCount}명으로 산정하여 단독 프라이빗 룸을 예약한다.`;
    case 7:
      return `제7조 (정기 회비 및 전환 규정)
① 월 정기 곗돈은 기혼자 월 80,000원, 미혼자 월 40,000원으로 차등 부과한다. (월 목표 ${s.monthlyTarget.toLocaleString()}원: 기혼 ${s.marriedCount}명, 미혼 ${s.singleCount}명)
② 미혼 회원이 결혼할 경우 익월부터 기혼자 요율(8만 원)로 자동 전환 적용된다.`;
    default:
      return "";
  }
}

// 회칙 전문 기본 템플릿 (Firestore에 회칙이 아직 없을 때만 사용)
export function buildFullRuleBook(members) {
  return `제1조 (명칭 및 목적)
본 모임은 고등학교 5인 동창 간의 친목 도모와 정기적인 회합, 상호 부조를 목적으로 2019년에 결성된 곗모임이다.

${buildArticle(2, members)}

제3조 (총무의 영구 면제권)
장우석 총무는 공금 관리 및 행정 업무를 상시 수행하는 대가로 차기 회장 피선거권에서 영구 면제된다.

${buildArticle(4, members)}

제5조 (장소 독점권 및 딴지 금지)
정기·임시 모임의 장소 및 예약은 회장이 단독 결정한다. 모든 회원은 회장의 결정에 대해 일체의 불만이나 딴지를 제기할 수 없으며 오직 가족 참석 여부(RSVP)만 회신한다.

${buildArticle(6, members)}

${buildArticle(7, members)}

제8조 (공금 통장 용도 제한: 식대 전용)
적립된 모임 공금 통장은 상·하반기 정기 모임 및 공식 모임의 식대, 다과비 결제에만 전액 사용하며, 개인 대여나 사적 유용은 일체 금지한다.

제9조 (경조사비 원칙)
① [개인 각출] 회원의 결혼(500,000원), 첫돌(100,000원), 부고 등의 모든 경조사비는 공금 통장에서 지출하지 아니하고, 해당 당사자를 제외한 4인이 개별 각출하여 송금한다.
② [공금 지원] 회원의 출산(300,000원), 집들이(400,000원)는 공금 통장에서 해당 회원에게 송금한다.

제10조 (편집 요약 의무제)
본 회칙을 개정할 때에는 개정 사유(편집 요약)를 필수로 입력해야만 판본으로 저장된다.`;
}

// 기존 회칙 문자열에서 지정한 조항만 교체 (나머지 조항은 원문 보존)
export function patchRuleContent(existing, members, articleNums) {
  if (!existing || !existing.trim()) return buildFullRuleBook(members);

  const text = existing.replace(/\r/g, "");
  const sections = text.split(/\n(?=제\d+조)/g);

  articleNums.forEach(num => {
    const idx = sections.findIndex(sec => new RegExp(`^\\s*제${num}조`).test(sec));
    const fresh = buildArticle(num, members);
    if (idx === -1) {
      // 조항이 사라졌다면 번호 순서에 맞춰 삽입
      let insertAt = sections.findIndex(sec => {
        const m = sec.trim().match(/^제(\d+)조/);
        return m && Number(m[1]) > num;
      });
      if (insertAt === -1) insertAt = sections.length;
      sections.splice(insertAt, 0, fresh + "\n");
      return;
    }

    if (num === 4) {
      // 제4조는 회원이 ①·② 문구를 다듬었을 수 있으므로 ③ 항(현 회장 이름)만 교체
      const freshLine3 = fresh.split("\n").find(l => l.startsWith("③"));
      const lines = sections[idx].split("\n");
      const li = lines.findIndex(l => l.trim().startsWith("③"));
      if (li !== -1) { lines[li] = freshLine3; sections[idx] = lines.join("\n"); return; }
    }

    // 원래 섹션 끝의 빈 줄(조항 사이 간격) 유지
    const trailing = sections[idx].match(/\n*$/)[0];
    sections[idx] = fresh + trailing;
  });

  return sections.join("\n");
}

// 다음 판본 번호 계산 (rule_revisions + rule_content/latest 중 최댓값 + 1)
async function getNextRev() {
  let maxNum = 0;
  const parse = v => parseInt(String(v || "").replace(/[^0-9]/g, ""), 10) || 0;
  const revSnap = await getDocs(collection(db, "rule_revisions"));
  revSnap.forEach(d => { maxNum = Math.max(maxNum, parse(d.data().rev)); });
  const latest = await getDoc(doc(db, "rule_content", "latest"));
  if (latest.exists()) maxNum = Math.max(maxNum, parse(latest.data().rev));
  return `r${maxNum + 1}`;
}

// 회칙 새 판본 저장 + 개정 로그 기록 (제10조 편집 요약 의무)
export async function saveRuleRevision({ content, author, summary }) {
  if (!summary || !summary.trim()) throw new Error("편집 요약(사유)은 필수입니다. (회칙 제10조)");
  const nextRev = await getNextRev();
  const dateStr = nowStr();

  await setDoc(doc(db, "rule_content", "latest"), {
    content,
    updatedAt: dateStr,
    author,
    rev: nextRev,
    summary
  });
  await setDoc(doc(db, "rule_revisions", `rev_${Date.now()}`), {
    rev: nextRev,
    date: dateStr,
    author,
    summary
  });
  return nextRev;
}

// 현재 회칙을 읽어 지정 조항만 갱신한 뒤 새 판본으로 저장
export async function autoUpdateArticles({ members, articleNums, author, summary }) {
  const latest = await getDoc(doc(db, "rule_content", "latest"));
  const existing = latest.exists() ? latest.data().content : "";
  const content = patchRuleContent(existing, members, articleNums);
  return saveRuleRevision({ content, author, summary });
}
