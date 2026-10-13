// カトレアの給与（人件費）計算 — Monthly.html と Analytics.html で共通で使う
// ※ 計算ルールは timecard-payroll の index.html と同じ内容です。
//   時給・丸め方・交通費などを変えた時は、このファイルと timecard-payroll の両方を直してください。
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, getDoc }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA0P2xZW4uXbBL4dOFhuYLoFuXPAz68Ef4",
  authDomain: "cattleya-timecard.firebaseapp.com",
  projectId: "cattleya-timecard",
  storageBucket: "cattleya-timecard.firebasestorage.app",
  messagingSenderId: "308051028432",
  appId: "1:308051028432:web:f84c12cd3114878982f1d5"
};
const fbApp = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
const fbDb = getFirestore(fbApp);

// ※ このスタッフ一覧・計算ルールは timecard-payroll の index.html と同じ内容にしています。
// 給与の計算ルール（時給・丸め方・交通費など）を変えた時は、両方のファイルを直してください。
const PAYROLL_STAFF = [
  {id:"tencho",   name:"店長"},
  {id:"chief",    name:"チーフ"},
  {id:"sasaki",   name:"佐々木"},
  {id:"shirota",  name:"小泉"},
  {id:"miyagawa", name:"宮川"},
  {id:"ibuchi",   name:"井渕"},
  {id:"suenaga",  name:"末永"},
  {id:"bunya",    name:"文屋"},
  {id:"help",     name:"ヘルプ"}
];
const PAYROLL_DEFAULT_RATE  = 1330;
const PAYROLL_DEFAULT_BREAK = 30;
const PAYROLL_TRANSPORT_DEFAULTS = {
  "tencho":   {transType:"monthly", transport:6950,  dailyAllow:1500},
  "chief":    {transType:"monthly", transport:12390, dailyAllow:1190},
  "sasaki":   {transType:"daily",   transport:0,     dailyAllow:0},
  "shirota":  {transType:"daily",   transport:0,     dailyAllow:0},
  "miyagawa": {transType:"monthly", transport:5620,  dailyAllow:0},
  "ibuchi":   {transType:"daily",   transport:0,     dailyAllow:0},
  "suenaga":  {transType:"daily",   transport:0,     dailyAllow:0},
  "help":     {transType:"daily",   transport:0,     dailyAllow:0}
};

function payrollGetSetting(settings, id){
  const s  = settings[id] || {};
  const td = PAYROLL_TRANSPORT_DEFAULTS[id] || {};
  return {
    rate:       s.rate       ?? PAYROLL_DEFAULT_RATE,
    allowance:  s.allowance  || 0,
    dailyAllow: s.dailyAllow !== undefined ? s.dailyAllow : (td.dailyAllow || 0),
    transport:  s.transport  !== undefined ? s.transport  : (td.transport  || 0),
    transType:  s.transType  || td.transType || "monthly",
    brk:        s.brk        ?? PAYROLL_DEFAULT_BREAK,
    incomeTax:  s.incomeTax  || 0,
    dayBreaks:  s.dayBreaks  || {}
  };
}
function payrollTransAmount(set,workDays){ return set.transType==="daily" ? (set.transport||0)*workDays : (set.transport||0); }
function payrollDailyAllowAmount(set,workDays){ return (set.dailyAllow||0)*workDays; }
function payrollEffectiveTime(r){ return r.correctedTime || r.time; }
function payrollEffectiveBreak(settings, staffId, dk, baseBrk){
  const dayBreaks = payrollGetSetting(settings, staffId).dayBreaks;
  if (dayBreaks && Object.prototype.hasOwnProperty.call(dayBreaks, dk)) {
    return dayBreaks[dk] ? baseBrk : 0;
  }
  return baseBrk;
}
// 何時より前に来ても、その時刻から計算するか（ふだんは9:00）
// 2026/10/13〜：月曜の店長・火〜金のチーフは8:30開始のシフト
const EARLY_START_FROM = "2026-10-13";
function payrollStartFloor(staffId, dk){
  if (dk >= EARLY_START_FROM) {
    const wd = new Date(dk + "T00:00:00").getDay(); // 0=日 1=月 … 5=金
    if (staffId === "tencho" && wd === 1) return 8*60+30;
    if (staffId === "chief" && wd >= 2 && wd <= 5) return 8*60+30;
  }
  return 9*60;
}
function payrollRoundIn(d, floorMin = 9*60){
  const x = new Date(d);
  let total = x.getHours()*60 + x.getMinutes();
  total = Math.ceil(total/30)*30;
  if (total < floorMin) total = floorMin;
  x.setHours(Math.floor(total/60), total%60, 0, 0);
  return x;
}
function payrollRoundOut(d){
  const x = new Date(d);
  let total = x.getHours()*60 + x.getMinutes();
  if (total <= 20*60) total = Math.floor(total/30)*30;
  else total = Math.floor(total/15)*15;
  x.setHours(Math.floor(total/60), total%60, 0, 0);
  return x;
}
function payrollYen(n){ return "¥" + Math.round(n).toLocaleString("ja-JP"); }
function payrollDurStr(min){ return Math.floor(min/60) + "時間" + String(min%60).padStart(2,"0") + "分"; }

async function payrollLoadSettings(){
  try{
    const snap = await getDoc(doc(fbDb, "settings", "payroll"));
    return snap.exists() ? snap.data() : {};
  }catch(e){ console.warn(e); return {}; }
}
async function payrollGetMonthRecords(y, m){
  const prefix = `${y}-${String(m).padStart(2,"0")}`;
  const q = query(collection(fbDb, "records"),
    where("dateKey", ">=", prefix+"-01"), where("dateKey", "<=", prefix+"-31"));
  const snap = await getDocs(q);
  const arr = []; snap.forEach(d => arr.push(d.data()));
  return arr;
}


export { payrollYen, payrollDurStr };

/* 日当手当を「平日のみ」にするスタッフ（給与アプリと同じ） */
const PAYROLL_ALLOW_WEEKDAY_ONLY = ["tencho"];

/* 日本の祝日（給与アプリと同じ判定） */
const _holCache = {};
function _dk(y,m,d){ return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
function jpHolidays(y){
  if (_holCache[y]) return _holCache[y];
  const s = new Set();
  const add = (m,d) => s.add(_dk(y,m,d));
  const nthMon = (m,n) => { const f = new Date(y,m-1,1).getDay(); return 1+((8-f)%7)+(n-1)*7; };
  add(1,1); add(2,11); add(2,23); add(4,29); add(5,3); add(5,4); add(5,5);
  add(8,11); add(11,3); add(11,23);
  add(1,nthMon(1,2)); add(7,nthMon(7,3)); add(9,nthMon(9,3)); add(10,nthMon(10,2));
  const k = y-1980;
  add(3, Math.floor(20.8431+0.242194*k-Math.floor(k/4)));
  add(9, Math.floor(23.2488+0.242194*k-Math.floor(k/4)));
  for (let d = new Date(y,0,2); d.getFullYear()===y; d.setDate(d.getDate()+1)){
    const prev = new Date(d); prev.setDate(d.getDate()-1);
    const next = new Date(d); next.setDate(d.getDate()+1);
    const key = _dk(y,d.getMonth()+1,d.getDate());
    if (!s.has(key) && d.getDay()!==0
      && s.has(_dk(prev.getFullYear(),prev.getMonth()+1,prev.getDate()))
      && s.has(_dk(next.getFullYear(),next.getMonth()+1,next.getDate()))) s.add(key);
  }
  [...s].sort().forEach(key => {
    const d = new Date(key+"T00:00:00");
    if (d.getDay()===0){
      const n = new Date(d);
      do { n.setDate(n.getDate()+1); } while (s.has(_dk(n.getFullYear(),n.getMonth()+1,n.getDate())));
      if (n.getFullYear()===y) s.add(_dk(y,n.getMonth()+1,n.getDate()));
    }
  });
  _holCache[y] = s;
  return s;
}
export function isHoliday(dk){ return jpHolidays(parseInt(dk.slice(0,4))).has(dk); }
function isOffDay(dk){ const w = new Date(dk+"T00:00:00").getDay(); return w===0 || w===6 || isHoliday(dk); }

/* シフト（シフト作成アプリ shift.html が shift_data/current に保存しているもの） */
const SHIFT_ID_ALIAS = { shirota: "koizumi" }; // 打刻は shirota、シフトは koizumi
async function loadShifts(){
  try{
    const snap = await getDoc(doc(fbDb, "shift_data", "current"));
    return snap.exists() ? (snap.data().shifts || {}) : {};
  }catch(e){ console.warn(e); return {}; }
}
function shiftFor(shifts, staffId, dk){
  const sid = SHIFT_ID_ALIAS[staffId] || staffId;
  const [y,m,d] = dk.split("-").map(Number);
  const sh = shifts[`${sid}_${y}_${m}_${d}`];
  if (!sh) return null;
  if (sh.off) return { off: true };
  const blocks = (sh.blocks && sh.blocks.length) ? sh.blocks
    : ["hall","support","kitchen"].filter(k => sh[k] && sh[k].start).map(k => sh[k]);
  if (!blocks.length) return null;
  const start = blocks.map(b => b.start).sort()[0];
  const end = blocks.map(b => b.end).sort().slice(-1)[0];
  return { start, end };
}
const toMin = hhmm => { const [h,m] = hhmm.split(":").map(Number); return h*60+m; };
const minOfDay = d => d.getHours()*60 + d.getMinutes();

// 2026/10/1〜 シフトがある日：シフト開始より前に来たらシフト開始から、遅刻したら打刻の時刻（1分単位）から
// シフトがない日・休みの日：今まで通り（30分単位で切り上げ、開始時刻より前は開始時刻）
// ※ 給与（経営者）・給与明細（全員分）の calcIn と同じルール
export const SHIFT_RULE_FROM = "2026-10-01";
function payrollCalcIn(fi, shift, staffId, dk){
  if (dk >= SHIFT_RULE_FROM && shift && !shift.off && shift.start) {
    const s = toMin(shift.start), p = minOfDay(fi);
    const use = p <= s ? s : p;
    const x = new Date(fi); x.setHours(Math.floor(use/60), use%60, 0, 0);
    return x;
  }
  return payrollRoundIn(fi, payrollStartFloor(staffId, dk));
}

// 1か月分を計算：給与の行（rows）と、出勤簿の日ごとのデータ（attendance）
// year: 数値(例2026) / month: 1〜12
export async function getPayrollMonth(year, month){
  const [settings, recs, shifts] = await Promise.all([
    payrollLoadSettings(), payrollGetMonthRecords(year, month), loadShifts()
  ]);
  const rows = [], attendance = [];
  const lastDay = new Date(year, month, 0).getDate();
  for (const s of PAYROLL_STAFF) {
    const myRecs = recs.filter(r => r.staffId === s.id);
    const set = payrollGetSetting(settings, s.id);
    const weekdayOnly = PAYROLL_ALLOW_WEEKDAY_ONLY.includes(s.id);
    const days = {};
    myRecs.forEach(r => {
      if (!days[r.dateKey]) days[r.dateKey] = { ins:[], outs:[] };
      (r.type==="in" ? days[r.dateKey].ins : days[r.dateKey].outs).push(r);
    });
    // 打刻のある日＋シフトがある日（欠勤も載せるため）
    const dks = new Set(Object.keys(days));
    for (let d = 1; d <= lastDay; d++) {
      const dk = _dk(year, month, d);
      const sh = shiftFor(shifts, s.id, dk);
      if (sh && !sh.off && !isHoliday(dk)) dks.add(dk); // 祝日のシフトだけの日（打刻なし）は載せない
    }
    let totalMin = 0, workDays = 0, allowDays = 0, lateCount = 0, lateMin = 0;
    const dayList = [];
    [...dks].sort().forEach(dk => {
      const day = days[dk] || { ins:[], outs:[] };
      const inRec  = day.ins.length  ? day.ins.reduce((a,b)=>new Date(payrollEffectiveTime(a))<=new Date(payrollEffectiveTime(b))?a:b) : null;
      const outRec = day.outs.length ? day.outs.reduce((a,b)=>new Date(payrollEffectiveTime(a))>=new Date(payrollEffectiveTime(b))?a:b) : null;
      const fi = inRec  ? new Date(payrollEffectiveTime(inRec))  : null;
      const lo = outRec ? new Date(payrollEffectiveTime(outRec)) : null;
      const shift = shiftFor(shifts, s.id, dk);
      let brk = 0, mins = 0, gross = 0, calcIn = null, calcOut = null;
      if (fi && lo) {
        brk = payrollEffectiveBreak(settings, s.id, dk, set.brk);
        calcIn = payrollCalcIn(fi, shift, s.id, dk);
        calcOut = payrollRoundOut(lo);
        gross = Math.max(0, Math.round((calcOut - calcIn)/60000));
        mins = Math.max(0, gross-brk);
        if (gross > 0) {
          totalMin += mins; workDays++;
          if (!(weekdayOnly && isOffDay(dk))) allowDays++;
        }
      }
      let late = 0;
      if (fi && shift && shift.start) late = Math.max(0, minOfDay(fi) - toMin(shift.start));
      if (late > 0) { lateCount++; lateMin += late; }
      dayList.push({
        dk, shift, fi, lo, calcIn, calcOut, brk, mins, gross, late,
        inOriginal:  inRec  && inRec.originalTime  ? new Date(inRec.originalTime)  : null,
        outOriginal: outRec && outRec.originalTime ? new Date(outRec.originalTime) : null,
        inManual: !!(inRec && inRec.manual), outManual: !!(outRec && outRec.manual),
        voided: !!(fi && lo && minOfDay(fi) === minOfDay(lo)) // 出勤と退勤が同じ時刻＝誤打刻を0時間にしたもの
      });
    });
    const totalHours = totalMin/60;
    const wageAmount  = set.rate * totalHours;
    const transp      = payrollTransAmount(set, workDays);
    const dailyAllow  = payrollDailyAllowAmount(set, allowDays);
    const allowTotal  = set.allowance + transp + dailyAllow;
    const grossTotal  = wageAmount + allowTotal;
    const grandTotal  = grossTotal - set.incomeTax;
    if (dayList.length) attendance.push({ id: s.id, name: s.name, days: dayList, workDays, totalMin, lateCount, lateMin });
    if (grossTotal <= 0) continue;
    rows.push({
      name: s.name, workDays, allowDays, totalMin, totalHours, rate: set.rate,
      wageAmount, transp, transType: set.transType, transport: set.transport,
      dailyAllow: set.dailyAllow, allowances: dailyAllow + set.allowance, allowTotal, grossTotal,
      incomeTax: set.incomeTax, grandTotal
    });
  }
  return { rows, attendance };
}

// 給与の行だけ（月次メール・人件費PDF用）。支給額0円のスタッフは含めない
export async function getPayrollRows(year, month){
  return (await getPayrollMonth(year, month)).rows;
}
