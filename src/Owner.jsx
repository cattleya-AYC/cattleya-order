import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://zxdgiszrsmumjjxmvszb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZGdpc3pyc211bWpqeG12c3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2ODM2MTksImV4cCI6MjA5NTI1OTYxOX0.vNndS7JEzIUsa007EPO2zRoYhUr-z01LM32BKIhMSz4"
);

const TOBACCO = [
  { id: 1, name: "ピースライト ボックス" },
  { id: 2, name: "セブンスター ボックス" },
  { id: 3, name: "メビウス 1mg" },
  { id: 4, name: "メビウス 3mg" },
  { id: 5, name: "メビウス 6mg" },
];

// PLU カテゴリー分類（レジアプリと同じ分類）
const CATEGORIES = {
  "コーヒー": ["コーヒー（HOT）", "アイスコーヒー", "アメリカン", "カフェ・オ・レ（HOT）", "アイスオ・レ", "ウィンナーコーヒー（HOT）", "アイスウィンナー"],
  "ストレート": ["トラジャ", "マンデリン", "モカ", "グァテマラ", "キリマンジェロ"],
  "紅茶": ["レモンティ（HOT）", "アイスレモンティ", "ミルクティ（HOT）", "アイスミルクティ", "ウーロン茶（HOT）", "アイスウーロン茶", "こんぶ茶（HOT）", "梅こん茶（HOT）"],
  "ジュース": ["ミルク（HOT）", "アイスミルク", "ココア（HOT）", "アイスココア", "トマトジュース", "リンゴジュース", "オレンジジュース", "バナナジュース", "レモンジュース", "レモンスカッシュ", "コカ・コーラ", "ジンジャーエール", "ソーダ水", "カルピス", "野菜ジュース", "グアバドリンク", "マンゴードリンク", "コーヒーフロート", "ソーダフロート"],
  "フード": ["トースト（バター＆ジャム）", "ピザトースト", "ミックスサンド", "ハムサンド", "野菜サンド", "玉子サンド", "トーストサンド（ミックス）", "トーストサンド（ハム）", "トーストサンド（たまご）"],
  "スイーツ": ["ミルクレープ", "ガトーショコラ", "フォンダンショコラ", "チーズケーキ", "紅茶のシフォン", "栗のモンブラン", "バニラアイスクリーム", "コーヒーゼリー"],
  "モーニング": ["モーニング（コーヒーHOT）", "モーニング（コーヒーICE）", "モーニング（紅茶HOT）", "モーニング（紅茶ICE）"],
  "おかわり": ["コーヒー おかわり（HOT）", "コーヒー おかわり（ICE）", "レモンティ おかわり（HOT）", "レモンティ おかわり（ICE）", "ミルクティ おかわり（HOT）", "ミルクティ おかわり（ICE）", "ウーロン茶 おかわり（HOT）", "ウーロン茶 おかわり（ICE）"],
  "アルコール": ["オールド（水割り）", "バドワイザー"],
  "その他": [],
};

const getCategory = (name) => {
  for (const [cat, list] of Object.entries(CATEGORIES)) {
    if (list.includes(name)) return cat;
  }
  return "その他";
};

const C = {
  ink: "#0d0905",
  paper: "#fbf7ee",
  panel: "#181008",
  gold: "#c9952a",
  goldSoft: "#e0c074",
  cream: "#f0e6d0",
  sub: "#8a7050",
  line: "#3d2c14",
  green: "#4aaa5a",
  red: "#c95a5a",
};

const yen = (n) => "¥" + Math.round(n || 0).toLocaleString("ja-JP");
const pct = (n) => (n == null ? "—" : (n >= 0 ? "+" : "") + n.toFixed(1) + "%");

function monthRange(ym) {
  const [y, m] = ym.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const end = new Date(y, m, 0).toISOString().split("T")[0];
  return { start, end };
}
function prevMonth(ym) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function lastYear(ym) {
  const [y, m] = ym.split("-");
  return `${Number(y) - 1}-${m}`;
}
function changePct(cur, prev) {
  if (!prev) return null;
  return ((cur - prev) / prev) * 100;
}

async function fetchSalesTotal(ym) {
  const { start, end } = monthRange(ym);
  const { data } = await supabase.from("sales").select("amount").gte("sale_date", start).lte("sale_date", end);
  return (data || []).reduce((a, s) => a + s.amount, 0);
}

export default function Owner() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [tobacco, setTobacco] = useState([]);
  const [items, setItems] = useState([]);
  const [prevTotal, setPrevTotal] = useState(0);
  const [yoyTotal, setYoyTotal] = useState(0);

  // 手入力コスト（端末に月ごと保存）
  const [foodCost, setFoodCost] = useState("");
  const [laborCost, setLaborCost] = useState("");
  const [otherCost, setOtherCost] = useState("");

  const costKey = `owner-costs:${selectedMonth}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(costKey);
      if (raw) {
        const o = JSON.parse(raw);
        setFoodCost(o.food || "");
        setLaborCost(o.labor || "");
        setOtherCost(o.other || "");
      } else {
        setFoodCost(""); setLaborCost(""); setOtherCost("");
      }
    } catch (e) {}
  }, [selectedMonth]);

  const saveCosts = (food, labor, other) => {
    try {
      localStorage.setItem(costKey, JSON.stringify({ food, labor, other }));
    } catch (e) {}
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { start, end } = monthRange(selectedMonth);
      try {
        const [{ data: s }, { data: t }, { data: it }, pt, yt] = await Promise.all([
          supabase.from("sales").select("*").gte("sale_date", start).lte("sale_date", end).order("sale_date", { ascending: true }),
          supabase.from("tobacco_sales").select("*").gte("sale_date", start).lte("sale_date", end),
          supabase.from("order_items").select("*").gte("sale_date", start).lte("sale_date", end),
          fetchSalesTotal(prevMonth(selectedMonth)),
          fetchSalesTotal(lastYear(selectedMonth)),
        ]);
        if (!alive) return;
        setSales(s || []);
        setTobacco(t || []);
        setItems(it || []);
        setPrevTotal(pt || 0);
        setYoyTotal(yt || 0);
      } catch (e) {
        if (alive) { setSales([]); setTobacco([]); setItems([]); }
      }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [selectedMonth]);

  // ---- 集計 ----
  const cash = sales.filter((s) => s.pay_method === "現金").reduce((a, s) => a + s.amount, 0);
  const paycas = sales.filter((s) => s.pay_method === "ペイキャス").reduce((a, s) => a + s.amount, 0);
  const totalSales = cash + paycas;
  const groups = sales.length;
  const people = sales.reduce((a, s) => a + (s.people_count || 0), 0);
  const perCustomer = people ? totalSales / people : 0;
  const perGroup = groups ? totalSales / groups : 0;
  const tobaccoTotal = tobacco.reduce((a, s) => a + s.price, 0);
  const grandTotal = totalSales + tobaccoTotal;

  const momPct = changePct(totalSales, prevTotal);
  const yoyPct = changePct(totalSales, yoyTotal);

  // 日別
  const byDate = {};
  sales.forEach((s) => {
    const d = s.sale_date;
    if (!byDate[d]) byDate[d] = { cash: 0, pay: 0, total: 0, groups: 0, people: 0 };
    byDate[d].total += s.amount;
    byDate[d].groups += 1;
    byDate[d].people += s.people_count || 0;
    if (s.pay_method === "現金") byDate[d].cash += s.amount;
    else byDate[d].pay += s.amount;
  });
  const dailyRows = Object.entries(byDate).sort();
  const bestDay = dailyRows.reduce((b, r) => (r[1].total > (b ? b[1].total : -1) ? r : b), null);

  // 時間帯別
  const bySlot = {};
  sales.forEach((s) => {
    const hour = s.sale_time ? s.sale_time.split(":")[0] : "—";
    if (!bySlot[hour]) bySlot[hour] = 0;
    bySlot[hour] += s.amount;
  });
  const slotRows = Object.entries(bySlot).sort();
  const slotMax = Math.max(1, ...slotRows.map((r) => r[1]));

  // タバコ銘柄別
  const tobByItem = {};
  TOBACCO.forEach((t) => { tobByItem[t.name] = { count: 0, total: 0 }; });
  tobacco.forEach((s) => {
    if (!tobByItem[s.item_name]) tobByItem[s.item_name] = { count: 0, total: 0 };
    tobByItem[s.item_name].count += 1;
    tobByItem[s.item_name].total += s.price;
  });

  // PLU（メニュー別）
  const pluByItem = {};
  items.forEach((it) => {
    if (it.price < 0) return;
    if (!pluByItem[it.item_name]) pluByItem[it.item_name] = { qty: 0, total: 0 };
    pluByItem[it.item_name].qty += it.qty;
    pluByItem[it.item_name].total += it.price * it.qty;
  });
  const pluSorted = Object.entries(pluByItem).sort((a, b) => b[1].total - a[1].total);
  const pluGrandTotal = pluSorted.reduce((a, [, v]) => a + v.total, 0);
  const pluGrandQty = pluSorted.reduce((a, [, v]) => a + v.qty, 0);

  // PLU（カテゴリ別）
  const pluByCat = {};
  pluSorted.forEach(([name, v]) => {
    const cat = getCategory(name);
    if (!pluByCat[cat]) pluByCat[cat] = { items: [], total: 0, qty: 0 };
    pluByCat[cat].items.push([name, v]);
    pluByCat[cat].total += v.total;
    pluByCat[cat].qty += v.qty;
  });
  const pluCatSorted = Object.entries(pluByCat).sort((a, b) => b[1].total - a[1].total);

  // コスト計算
  const F = parseInt(foodCost) || 0;
  const L = parseInt(laborCost) || 0;
  const O = parseInt(otherCost) || 0;
  const FL = F + L;
  const base = totalSales; // FL率の基準＝飲食売上（タバコ除く）
  const fRate = base ? (F / base) * 100 : 0;
  const lRate = base ? (L / base) * 100 : 0;
  const flRate = base ? (FL / base) * 100 : 0;
  const expenses = F + L + O;
  const profit = totalSales - expenses;
  const profitRate = totalSales ? (profit / totalSales) * 100 : 0;

  const onF = (v) => { setFoodCost(v); saveCosts(v, laborCost, otherCost); };
  const onL = (v) => { setLaborCost(v); saveCosts(foodCost, v, otherCost); };
  const onO = (v) => { setOtherCost(v); saveCosts(foodCost, laborCost, v); };

  const [yy, mm] = selectedMonth.split("-");

  return (
    <div style={{ minHeight: "100vh", background: C.ink, color: C.cream, fontFamily: "'Noto Sans JP', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&family=Noto+Sans+JP:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        .mincho { font-family: 'Shippori Mincho', serif; }
        .no-print { }
        @media print {
          @page { size: A4; margin: 10mm; }
          body { background: #fff; }
          .no-print { display: none !important; }
          .sheet { background: #fff !important; color: #111 !important; box-shadow: none !important; }
          .card { background: #fff !important; border: 1px solid #ccc !important; break-inside: avoid; }
          .lbl { color: #555 !important; }
          .val { color: #111 !important; }
          .gold { color: #9a7016 !important; }
          .bar { background: #ddd !important; }
          .barfill { background: #9a7016 !important; }
          .pagebreak { break-before: page; }
        }
      `}</style>

      {/* ツールバー（印刷では消える） */}
      <div className="no-print" style={{ position: "sticky", top: 0, zIndex: 10, background: C.panel, borderBottom: `1px solid ${C.line}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span className="mincho" style={{ color: C.gold, fontSize: 16, fontWeight: 700 }}>経営レポート</span>
        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
          style={{ padding: "8px 10px", background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8, color: C.cream, fontSize: 14 }} />
        <button onClick={() => window.print()} disabled={loading}
          style={{ marginLeft: "auto", padding: "8px 16px", background: C.gold, border: "none", borderRadius: 8, color: C.ink, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          🖨 印刷 / PDF保存
        </button>
      </div>

      <div className="sheet" style={{ maxWidth: 820, margin: "0 auto", padding: "24px 20px 60px" }}>
        {/* ヘッダー */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div className="mincho gold" style={{ color: C.gold, letterSpacing: 6, fontSize: 12 }}>LOUNGE CATTLEYA</div>
          <div className="mincho val" style={{ fontSize: 28, fontWeight: 700, color: C.cream, letterSpacing: 2 }}>
            {yy}年 {Number(mm)}月　経営月次レポート
          </div>
          <div className="lbl" style={{ color: C.sub, fontSize: 11, marginTop: 4 }}>― 経営者専用 / Confidential ―</div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: C.sub, padding: 60 }}>読み込み中…</div>
        ) : (
          <>
            {/* サマリー大枠 */}
            <div className="card" style={{ background: C.panel, border: `1px solid ${C.gold}`, borderRadius: 12, padding: 20, marginTop: 16 }}>
              <div className="lbl" style={{ color: C.sub, fontSize: 12 }}>総売上（飲食・タバコ除く）</div>
              <div className="mincho gold" style={{ color: C.gold, fontSize: 40, fontWeight: 700, lineHeight: 1.1 }}>{yen(totalSales)}</div>
              <div style={{ display: "flex", gap: 18, marginTop: 8, flexWrap: "wrap" }}>
                <span className="lbl" style={{ color: C.sub, fontSize: 12 }}>前月比 <b style={{ color: momPct >= 0 ? C.green : C.red }}>{pct(momPct)}</b></span>
                <span className="lbl" style={{ color: C.sub, fontSize: 12 }}>前年同月比 <b style={{ color: yoyPct >= 0 ? C.green : C.red }}>{pct(yoyPct)}</b></span>
                <span className="lbl" style={{ color: C.sub, fontSize: 12 }}>タバコ込み総合計 <b className="val" style={{ color: C.cream }}>{yen(grandTotal)}</b></span>
              </div>
            </div>

            {/* KPI 6マス */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 12 }}>
              <Kpi label="現金売上" value={yen(cash)} sub={totalSales ? `${((cash / totalSales) * 100).toFixed(0)}%` : ""} />
              <Kpi label="ペイキャス売上" value={yen(paycas)} sub={totalSales ? `${((paycas / totalSales) * 100).toFixed(0)}%` : ""} />
              <Kpi label="タバコ売上" value={yen(tobaccoTotal)} sub={`${tobacco.length}本`} />
              <Kpi label="組数" value={`${groups}組`} sub={`客単価/組 ${yen(perGroup)}`} />
              <Kpi label="来客人数" value={`${people}名`} sub={`客単価/人 ${yen(perCustomer)}`} />
              <Kpi label="最高売上日" value={bestDay ? `${Number(bestDay[0].split("-")[2])}日` : "—"} sub={bestDay ? yen(bestDay[1].total) : ""} />
            </div>

            {/* コスト入力 & 損益 */}
            <SectionTitle>原価・人件費（FLコスト）と損益</SectionTitle>
            <div className="card" style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 }}>
              <div className="no-print" style={{ color: C.sub, fontSize: 11, marginBottom: 10 }}>※ 金額を入力すると下の比率・利益が自動計算されます（この端末に月ごと保存）</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
                <CostInput label="食材原価 F" value={foodCost} onChange={onF} />
                <CostInput label="人件費 L" value={laborCost} onChange={onL} />
                <CostInput label="その他経費" value={otherCost} onChange={onO} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                <Stat label="原価率 F" value={`${fRate.toFixed(1)}%`} />
                <Stat label="人件費率 L" value={`${lRate.toFixed(1)}%`} />
                <Stat label="FLコスト合計" value={yen(FL)} />
                <Stat label="FLコスト率" value={`${flRate.toFixed(1)}%`} highlight={flRate > 60} note={flRate > 60 ? "60%超" : "目安60%以下"} />
                <Stat label="経費合計（F+L+他）" value={yen(expenses)} />
                <Stat label="概算利益" value={yen(profit)} highlight={profit < 0} valueColor={profit >= 0 ? C.green : C.red} />
              </div>
              <div className="lbl" style={{ color: C.sub, fontSize: 11, marginTop: 8 }}>利益率 {profitRate.toFixed(1)}%（基準：飲食売上 {yen(base)}）</div>
            </div>

            {/* 時間帯別 */}
            <SectionTitle>時間帯別 売上</SectionTitle>
            <div className="card" style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 }}>
              {slotRows.length === 0 ? <Empty /> : slotRows.map(([hour, amt]) => (
                <div key={hour} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                    <span className="lbl" style={{ color: C.sub }}>{hour}時台</span>
                    <span className="gold" style={{ color: C.gold, fontWeight: 700 }}>{yen(amt)}</span>
                  </div>
                  <div className="bar" style={{ height: 7, background: C.line, borderRadius: 4, overflow: "hidden" }}>
                    <div className="barfill" style={{ height: "100%", width: `${(amt / slotMax) * 100}%`, background: `linear-gradient(90deg, ${C.goldSoft}, ${C.gold})` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* PLU カテゴリ別 */}
            <SectionTitle>PLU カテゴリ別集計</SectionTitle>
            <div className="card" style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${C.line}`, paddingBottom: 8, marginBottom: 8 }}>
                <span className="lbl" style={{ color: C.sub, fontSize: 12 }}>合計（値引除く）</span>
                <span className="gold" style={{ color: C.gold, fontWeight: 700 }}>{pluGrandQty}点 / {yen(pluGrandTotal)}</span>
              </div>
              {pluCatSorted.length === 0 ? <Empty /> : pluCatSorted.map(([cat, d]) => (
                <div key={cat} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                  <span className="val" style={{ color: C.cream, fontSize: 13 }}>{cat}</span>
                  <span style={{ fontSize: 13 }}>
                    <span className="lbl" style={{ color: C.sub, marginRight: 10 }}>{d.qty}点</span>
                    <span className="gold" style={{ color: C.gold, fontWeight: 700 }}>{yen(d.total)}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* PLU メニュー別（全件） */}
            <SectionTitle>PLU メニュー別（売上順）</SectionTitle>
            <div className="card" style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 }}>
              {pluSorted.length === 0 ? <Empty /> : pluSorted.map(([name, v], i) => (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: i < pluSorted.length - 1 ? "1px solid #3d2c1433" : "none" }}>
                  <span className="val" style={{ color: C.cream, fontSize: 12.5 }}>
                    <span className="lbl" style={{ color: C.sub, marginRight: 8 }}>{i + 1}.</span>{name}
                  </span>
                  <span style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>
                    <span className="lbl" style={{ color: C.sub, marginRight: 10 }}>{v.qty}点</span>
                    <span className="gold" style={{ color: C.gold }}>{yen(v.total)}</span>
                  </span>
                </div>
              ))}
            </div>

            {/* タバコ銘柄別 */}
            <SectionTitle>タバコ 銘柄別集計</SectionTitle>
            <div className="card" style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 }}>
              {Object.entries(tobByItem).map(([name, d]) => (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #3d2c1433" }}>
                  <span className="val" style={{ color: C.cream, fontSize: 13 }}>{name}</span>
                  <span style={{ fontSize: 13 }}>
                    <span className="lbl" style={{ color: C.sub, marginRight: 10 }}>{d.count}本</span>
                    <span className="gold" style={{ color: C.gold, fontWeight: 700 }}>{yen(d.total)}</span>
                  </span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 4 }}>
                <span className="lbl" style={{ color: C.sub, fontSize: 12 }}>タバコ月計</span>
                <span className="gold" style={{ color: C.gold, fontWeight: 700 }}>{yen(tobaccoTotal)}</span>
              </div>
            </div>

            {/* 日別売上 */}
            <SectionTitle>日別 売上明細</SectionTitle>
            <div className="card" style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${C.line}`, paddingBottom: 6, marginBottom: 6 }}>
                <span className="lbl" style={{ color: C.sub, fontSize: 11, flex: 1 }}>日付</span>
                <span className="lbl" style={{ color: C.sub, fontSize: 11, width: 90, textAlign: "right" }}>現金</span>
                <span className="lbl" style={{ color: C.sub, fontSize: 11, width: 90, textAlign: "right" }}>ペイキャス</span>
                <span className="lbl" style={{ color: C.sub, fontSize: 11, width: 50, textAlign: "right" }}>組</span>
                <span className="lbl" style={{ color: C.sub, fontSize: 11, width: 90, textAlign: "right" }}>計</span>
              </div>
              {dailyRows.length === 0 ? <Empty /> : dailyRows.map(([date, d]) => (
                <div key={date} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #3d2c1433", fontSize: 12.5 }}>
                  <span className="val" style={{ color: C.cream, flex: 1 }}>{Number(date.split("-")[2])}日</span>
                  <span className="lbl" style={{ color: C.sub, width: 90, textAlign: "right" }}>{yen(d.cash)}</span>
                  <span className="lbl" style={{ color: C.sub, width: 90, textAlign: "right" }}>{yen(d.pay)}</span>
                  <span className="lbl" style={{ color: C.sub, width: 50, textAlign: "right" }}>{d.groups}</span>
                  <span className="gold" style={{ color: C.gold, fontWeight: 700, width: 90, textAlign: "right" }}>{yen(d.total)}</span>
                </div>
              ))}
            </div>

            <div className="lbl" style={{ color: C.sub, fontSize: 10, textAlign: "center", marginTop: 24 }}>
              Lounge Cattleya ／ 出力日 {new Date().toLocaleString("ja-JP")}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, sub }) {
  return (
    <div className="card" style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 12px" }}>
      <div className="lbl" style={{ color: C.sub, fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div className="mincho val" style={{ color: C.cream, fontSize: 19, fontWeight: 700, lineHeight: 1.15 }}>{value}</div>
      {sub ? <div className="lbl" style={{ color: C.sub, fontSize: 10.5, marginTop: 2 }}>{sub}</div> : null}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div className="mincho gold" style={{ color: C.gold, fontSize: 14, fontWeight: 700, margin: "20px 2px 8px", letterSpacing: 1 }}>
      ◆ {children}
    </div>
  );
}

function CostInput({ label, value, onChange }) {
  return (
    <div>
      <div className="lbl" style={{ color: C.sub, fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8, padding: "0 8px" }}>
        <span className="lbl" style={{ color: C.sub, fontSize: 14 }}>¥</span>
        <input value={value} onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="0"
          style={{ width: "100%", padding: "10px 4px", background: "transparent", border: "none", color: C.cream, fontSize: 15, outline: "none", textAlign: "right", fontFamily: "'Shippori Mincho', serif" }} />
      </div>
    </div>
  );
}

function Stat({ label, value, note, highlight, valueColor }) {
  return (
    <div className="card" style={{ background: highlight ? "#2a1208" : C.ink, border: `1px solid ${highlight ? C.red : C.line}`, borderRadius: 8, padding: "10px 12px" }}>
      <div className="lbl" style={{ color: C.sub, fontSize: 11 }}>{label}</div>
      <div className="mincho val" style={{ color: valueColor || C.cream, fontSize: 18, fontWeight: 700 }}>{value}</div>
      {note ? <div style={{ color: highlight ? C.red : C.sub, fontSize: 10 }}>{note}</div> : null}
    </div>
  );
}

function Empty() {
  return <div className="lbl" style={{ color: C.sub, fontSize: 13, textAlign: "center", padding: 12 }}>この月のデータはありません</div>;
}
