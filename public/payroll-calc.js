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
function payrollRoundIn(d){
  const x = new Date(d);
  let total = x.getHours()*60 + x.getMinutes();
  total = Math.ceil(total/30)*30;
  if (total < 9*60) total = 9*60;
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

// year: 数値(例2026) / month: 1〜12。支給額0円のスタッフは含めない
export async function getPayrollRows(year, month){
  const settings = await payrollLoadSettings();
  const recs = await payrollGetMonthRecords(year, month);
  const rows = [];
  for (const s of PAYROLL_STAFF) {
    const myRecs = recs.filter(r => r.staffId === s.id);
    const set = payrollGetSetting(settings, s.id);
    const days = {};
    myRecs.forEach(r => {
      if (!days[r.dateKey]) days[r.dateKey] = { ins:[], outs:[] };
      (r.type==="in" ? days[r.dateKey].ins : days[r.dateKey].outs).push(r);
    });
    let totalMin = 0, workDays = 0;
    Object.keys(days).forEach(dk => {
      const day = days[dk];
      const inRec  = day.ins.length  ? day.ins.reduce((a,b)=>new Date(payrollEffectiveTime(a))<=new Date(payrollEffectiveTime(b))?a:b) : null;
      const outRec = day.outs.length ? day.outs.reduce((a,b)=>new Date(payrollEffectiveTime(a))>=new Date(payrollEffectiveTime(b))?a:b) : null;
      const fi = inRec  ? new Date(payrollEffectiveTime(inRec))  : null;
      const lo = outRec ? new Date(payrollEffectiveTime(outRec)) : null;
      if (fi && lo) {
        const brk = payrollEffectiveBreak(settings, s.id, dk, set.brk);
        const gross = Math.max(0, Math.round((payrollRoundOut(lo)-payrollRoundIn(fi))/60000));
        const mins = Math.max(0, gross-brk);
        if (gross > 0) { totalMin += mins; workDays++; }
      }
    });
    const totalHours = totalMin/60;
    const wageAmount  = set.rate * totalHours;
    const transp      = payrollTransAmount(set, workDays);
    const dailyAllow  = payrollDailyAllowAmount(set, workDays);
    const allowTotal  = set.allowance + transp + dailyAllow;
    const grossTotal  = wageAmount + allowTotal;
    const grandTotal  = grossTotal - set.incomeTax;
    if (grossTotal <= 0) continue;
    rows.push({
      name: s.name, workDays, totalMin, totalHours, rate: set.rate,
      wageAmount, transp, transType: set.transType, transport: set.transport,
      allowances: dailyAllow + set.allowance, allowTotal, grossTotal,
      incomeTax: set.incomeTax, grandTotal
    });
  }
  return rows;
}
