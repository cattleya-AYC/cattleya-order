import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://zxdgiszrsmumjjxmvszb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZGdpc3pyc211bWpqeG12c3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2ODM2MTksImV4cCI6MjA5NTI1OTYxOX0.vNndS7JEzIUsa007EPO2zRoYhUr-z01LM32BKIhMSz4"
);

const TOBACCO = [
  { id: 1, name: "ピースライト "},
  { id: 2, name: "セブンスター" },
  { id: 3, name: "セブンスターBOX" },
  { id: 4, name: "メビウス 1mg" },
  { id: 5, name: "メビウス 3mg" },
  { id: 6, name: "メビウス 6mg" },
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
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
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
  const { data } = await supabase.from("sales").select("amount").gte("sale_date", start).lte("sale_date", end).limit(3000);
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
  const [view, setView] = useState("report"); // report | history | coupon | daily | monthly | plu | drawer | cashcheck | staytime | clear
  const [historyDay, setHistoryDay] = useState("all");
  const [coupons, setCoupons] = useState([]);
  const [issuedCoupons, setIssuedCoupons] = useState([]);

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
        const [{ data: s }, { data: t }, { data: it }, { data: cp }, { data: ic }, pt, yt] = await Promise.all([
supabase.from("sales").select("*").gte("sale_date", start).lte("sale_date", end).order("sale_date", { ascending: true }).range(0, 4999),

          supabase.from("tobacco_sales").select("*").gte("sale_date", start).lte("sale_date", end).limit(10000),
          supabase.from("order_items").select("*").gte("sale_date", start).lte("sale_date", end).limit(10000),
          supabase.from("coupons").select("*").gte("used_at", start).lte("used_at", end + "T23:59:59").order("used_at", { ascending: false }),
          supabase.from("coupons").select("*").gte("issued_at", start).lte("issued_at", end + "T23:59:59").eq("is_used", false).order("issued_at", { ascending: true }),
          fetchSalesTotal(prevMonth(selectedMonth)),
          fetchSalesTotal(lastYear(selectedMonth)),
        ]);
        if (!alive) return;
        setSales(s || []);
        setTobacco(t || []);
        setItems(it || []);
        setCoupons(cp || []);
        setIssuedCoupons(ic || []);
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
    <div style={{ minHeight: "100vh", background: C.ink, color: C.cream ,fontFamily: "'Noto Sans JP', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&family=Noto+Sans+JP:wght@400;500;700&display=swap');
        * { box-sizing: border-box; }
        .mincho { font-family: 'Shippori Mincho', serif; }
        .no-print { }
        @media print {
          @page { size: A4; margin: 10mm; }
          body, * { background: #fff !important; color: #111 !important; }
          .no-print { display: none !important; }
          .sheet { background: #fff !important; color: #111 !important; box-shadow: none !important; }
          .card { background: #fff !important; border: 1px solid #ccc !important; break-inside: avoid; }
          .lbl { color: #555 !important; }
          .val { color: #111 !important; }
          .gold { color: #9a7016 !important; }
          .bar { background: #ddd !important; }
          .barfill { background: #9a7016 !important; }
          .pagebreak { break-before: page; }
          div, span, td, th, table, input { background: #fff !important; color: #111 !important; border-color: #ccc !important; }
        }
      `}</style>

      {/* ツールバー（印刷では消える） */}
      <div className="no-print" style={{ position: "sticky", top: 0, zIndex: 10, background: C.ink,
 borderBottom: `1px solid ${C.line}`, padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <span className="mincho" style={{ color: C.gold, fontSize: 16, fontWeight: 700 }}>経営レポート</span>
        <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}
          style={{ padding: "8px 10px", background: C.ink, border: `1px solid ${C.line}`, borderRadius: 8, color: C.cream, fontSize: 14 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 100 }}>
          {[
            ["report","月次レポート"],
            ["history","取引履歴"],
            ["coupon","🎟 クーポン"],
            ["daily","📊 日計"],
            ["monthly","📅 月次"],
            ["plu","📋 PLU"],
            ["drawer","🔓 ドロア"],
            ["cashcheck","💰 レジ確認"],
            ["staytime","⏱ 滞在時間"],
            ["clear","🗑 テーブルクリア"],
          ].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding: "7px 12px", background: view === v ? C.gold : "transparent", border: `1px solid ${C.gold}`, borderRadius: 6, color: view === v ? C.ink : C.gold, fontWeight: 700, fontSize: 12, cursor: "pointer", textAlign: "left", whiteSpace: "nowrap" }}>
              {label}
            </button>
          ))}
        </div>
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
            {yy}年 {Number(mm)}月　{view === "history" ? "取引履歴" : view === "coupon" ? "クーポン利用履歴" : view === "daily" ? "日計" : view === "monthly" ? "月次集計" : view === "plu" ? "PLU集計" : view === "drawer" ? "ドロア開閉ログ" : view === "cashcheck" ? "レジ確認ログ" : view === "staytime" ? "滞在時間" : view === "clear" ? "テーブルクリア（未収記録）" : "経営月次レポート"}
          </div>
          <div className="lbl" style={{ color: C.sub, fontSize: 11, marginTop: 4 }}>― 経営者専用 / Confidential ―</div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: C.sub, padding: 60 }}>読み込み中…</div>
        ) : view === "coupon" ? (
          <CouponView coupons={coupons} issuedCoupons={issuedCoupons} selectedMonth={selectedMonth} C={C} yen={yen} />
        ) : view === "daily" ? (
          <OwnerDailyView sales={sales} tobacco={tobacco} selectedMonth={selectedMonth} C={C} yen={yen} />
        ) : view === "monthly" ? (
          <OwnerMonthlyView sales={sales} tobacco={tobacco} selectedMonth={selectedMonth} C={C} yen={yen} />
        ) : view === "plu" ? (
          <OwnerPluView items={items} C={C} yen={yen} />
        ) : view === "drawer" ? (
          <DrawerLogView selectedMonth={selectedMonth} C={C} />
        ) : view === "cashcheck" ? (
          <CashCheckLogView selectedMonth={selectedMonth} C={C} yen={yen} />
        ) : view === "staytime" ? (
          <StayTimeView sales={sales} C={C} />
        ) : view === "clear" ? (
          <TableClearView supabase={supabase} C={C} yen={yen} />
        ) : view === "history" ? (
          <HistoryView sales={sales} items={items} historyDay={historyDay} setHistoryDay={setHistoryDay} C={C} yen={yen} />
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

function HistoryView({ sales, items, historyDay, setHistoryDay, C, yen }) {
  // 売上を新しい順に並べる
  const sorted = [...sales].sort((a, b) => {
    const ta = a.sale_time || a.sale_date || "";
    const tb = b.sale_time || b.sale_date || "";
    return tb.localeCompare(ta);
  });

  // 日付リスト（フィルタ用）
  const days = Array.from(new Set(sales.map(s => (s.sale_date || (s.sale_time || "").slice(0, 10))).filter(Boolean))).sort().reverse();

  const filtered = historyDay === "all"
    ? sorted
    : sorted.filter(s => (s.sale_date || (s.sale_time || "").slice(0, 10)) === historyDay);

  // 各伝票の明細をテーブル/時刻で対応づけ（order_items に sale_time があれば近いものを表示）
  const itemsForSale = (s) => {
    const sDate = s.sale_date || (s.sale_time || "").slice(0, 10);
    return items.filter(it => {
      const itDate = it.sale_date || (it.sale_time || "").slice(0, 10);
      return itDate === sDate && String(it.table_no) === String(s.table_no);
    });
  };

  const fmtTime = (s) => {
    const t = s.sale_time || "";
    if (t.length >= 16) {
      const d = new Date(t);
      if (!isNaN(d)) return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
    }
    return s.sale_date || "—";
  };

  return (
    <div style={{ marginTop: 16 }}>
      {/* 日付フィルタ */}
      <div className="no-print" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        <button onClick={() => setHistoryDay("all")} style={{ padding: "6px 12px", background: historyDay === "all" ? C.gold : "transparent", border: `1px solid ${C.line}`, borderRadius: 8, color: historyDay === "all" ? C.ink : C.cream, fontSize: 12, cursor: "pointer" }}>全て</button>
        {days.map(d => (
          <button key={d} onClick={() => setHistoryDay(d)} style={{ padding: "6px 12px", background: historyDay === d ? C.gold : "transparent", border: `1px solid ${C.line}`, borderRadius: 8, color: historyDay === d ? C.ink : C.cream, fontSize: 12, cursor: "pointer" }}>{Number(d.split("-")[1])}/{Number(d.split("-")[2])}</button>
        ))}
      </div>

      <div className="lbl" style={{ color: C.sub, fontSize: 12, marginBottom: 8 }}>
        {filtered.length} 件の取引{historyDay !== "all" ? `（${Number(historyDay.split("-")[1])}月${Number(historyDay.split("-")[2])}日）` : ""}
      </div>

      {filtered.length === 0 ? (
        <div className="lbl" style={{ color: C.sub, fontSize: 13, textAlign: "center", padding: 30 }}>取引データがありません</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((s, i) => {
            const its = itemsForSale(s);
            return (
              <div key={s.id || i} className="card" style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <div>
                    <span className="val" style={{ color: C.cream, fontWeight: 700, fontSize: 14 }}>テーブル {s.table_no}</span>
                    <span className="lbl" style={{ color: C.sub, fontSize: 11, marginLeft: 10 }}>{fmtTime(s)}</span>
                  </div>
                  <span className="gold" style={{ color: C.gold, fontWeight: 700, fontSize: 18 }}>{yen(s.amount)}</span>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: its.length ? 8 : 0 }}>
                  <span className="lbl" style={{ color: C.sub, fontSize: 11 }}>支払: {s.pay_method || "—"}</span>
                  <span className="lbl" style={{ color: C.sub, fontSize: 11 }}>{s.receipt_type ? `${s.receipt_type}` : ""}</span>
                  {s.people_count ? <span className="lbl" style={{ color: C.sub, fontSize: 11 }}>{s.people_count}名</span> : null}
                </div>
                {its.length > 0 && (
                  <div style={{ borderTop: `1px solid ${C.line}55`, paddingTop: 6 }}>
                    {its.map((it, j) => (
                      <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "1px 0" }}>
                        <span className="lbl" style={{ color: C.sub }}>{it.item_name} ×{it.qty}</span>
                        <span className="lbl" style={{ color: C.sub }}>{yen((it.price || 0) * (it.qty || 1))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="lbl" style={{ color: C.sub, fontSize: 10, textAlign: "center", marginTop: 24 }}>
        Lounge Cattleya ／ 取引履歴 ／ 出力日 {new Date().toLocaleString("ja-JP")}
      </div>
    </div>
  );
}

function CouponView({ coupons, issuedCoupons = [], selectedMonth, C, yen }) {
  // 日別発行集計
  const byDate = {};
  issuedCoupons.forEach(c => {
    const d = (c.issued_at || "").slice(0, 10);
    if (!d) return;
    if (!byDate[d]) byDate[d] = { nums: [] };
    const num = parseInt((c.coupon_no || "").replace(/[^0-9]/g, ""));
    if (!isNaN(num)) byDate[d].nums.push(num);
  });
  const issueDates = Object.keys(byDate).sort();
  const [yy, mm] = selectedMonth.split("-");
  const isJuly = Number(mm) === 7;
  const totalDiscount = coupons.reduce((a, c) => a + (c.discount_amount || 0), 0);
  const totalBefore = coupons.reduce((a, c) => a + (c.amount_before || 0), 0);

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  return (
    <div style={{ marginTop: 16 }}>
      {/* 集計サマリー */}
      <div className="card" style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
        <div className="lbl" style={{ color: C.sub, fontSize: 12, marginBottom: 10 }}>{yy}年{Number(mm)}月　クーポン利用集計</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span className="lbl" style={{ color: C.sub }}>利用件数</span>
          <span className="val" style={{ color: C.cream, fontWeight: 700 }}>{coupons.length}件</span>
        </div>
        {isJuly && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span className="lbl" style={{ color: C.sub }}>割引前売上合計</span>
              <span className="val" style={{ color: C.cream }}>{yen(totalBefore)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, borderTop: `1px solid ${C.line}`, paddingTop: 8 }}>
              <span className="lbl" style={{ color: C.sub }}>クーポン値引き合計</span>
              <span className="val" style={{ color: "#5a8aca", fontWeight: 700, fontSize: 18 }}>-{yen(totalDiscount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="lbl" style={{ color: C.sub }}>値引き後売上合計</span>
              <span className="val" style={{ color: C.gold, fontWeight: 700, fontSize: 20 }}>{yen(totalBefore - totalDiscount)}</span>
            </div>
          </>
        )}
      </div>

      {/* 日別発行集計 */}
      {issueDates.length > 0 && (
        <div className="card" style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
          <div className="lbl" style={{ color: C.sub, fontSize: 12, marginBottom: 10 }}>📋 日別発行番号</div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["日付","枚数","番号（最小〜最大）"].map(h => (
                  <th key={h} style={{ color: C.sub, fontSize: 11, padding: "4px 8px", borderBottom: `1px solid ${C.line}`, textAlign: h === "日付" ? "left" : "right" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {issueDates.map(d => {
                const nums = byDate[d].nums;
                const min = Math.min(...nums);
                const max = Math.max(...nums);
                const [, mm, dd] = d.split("-");
                return (
                  <tr key={d}>
                    <td style={{ color: C.cream, padding: "7px 8px", borderBottom: `1px solid ${C.line}33`, fontSize: 13 }}>{Number(mm)}/{Number(dd)}</td>
                    <td style={{ color: C.sub, padding: "7px 8px", borderBottom: `1px solid ${C.line}33`, textAlign: "right", fontSize: 13 }}>{nums.length}枚</td>
                    <td style={{ color: C.gold, padding: "7px 8px", borderBottom: `1px solid ${C.line}33`, textAlign: "right", fontWeight: 700, fontSize: 13 }}>A{min}〜A{max}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 利用一覧 */}
      <div className="lbl" style={{ color: C.sub, fontSize: 12, marginBottom: 8 }}>🎟 利用履歴</div>
      {/* 一覧 */}
      {coupons.length === 0 ? (
        <div className="lbl" style={{ color: C.sub, textAlign: "center", padding: 40 }}>この月のクーポン利用はありません</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {coupons.map((c, i) => (
            <div key={i} className="card" style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div className="val" style={{ color: C.cream, fontWeight: 700, fontSize: 15 }}>No. {c.coupon_no}</div>
                <div className="lbl" style={{ color: C.sub, fontSize: 12, marginTop: 2 }}>{fmtDate(c.used_at)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {isJuly && c.discount_amount ? (
                  <>
                    <div className="lbl" style={{ color: C.sub, fontSize: 11 }}>割引前 {yen(c.amount_before)}</div>
                    <div style={{ color: "#5a8aca", fontWeight: 700 }}>-{yen(c.discount_amount)}</div>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="lbl" style={{ color: C.sub, fontSize: 10, textAlign: "center", marginTop: 24 }}>
        {!isJuly && "※ 7月はクーポン値引き集計が表示されます"}
      </div>
    </div>
  );
}

// ===== 日計ビュー =====
function OwnerDailyView({ sales, tobacco, selectedMonth, C, yen }) {
  const [yy, mm] = selectedMonth.split("-");
  // 日付ごとに集計
  const byDate = {};
  sales.forEach(s => {
    const d = s.sale_date || (s.sale_time || "").slice(0, 10);
    if (!d) return;
    if (!byDate[d]) byDate[d] = { cash: 0, pay: 0, count: 0, people: 0 };
    if (s.pay_method === "現金") byDate[d].cash += s.amount;
    else byDate[d].pay += s.amount;
    byDate[d].count++;
    byDate[d].people += s.people_count || 0;
  });
  const dates = Object.keys(byDate).sort();
  return (
    <div style={{ marginTop: 16, background: "#181008" }}>


      <div className="lbl" style={{ color: C.sub, fontSize: 12, marginBottom: 12 }}>{yy}年{Number(mm)}月　日別集計</div>
      {dates.length === 0 ? <div className="lbl" style={{ color: C.sub, textAlign: "center", padding: 40 }}>データなし</div> : (
        <table style={{ width: "100%", borderCollapse: "collapse", background: "#181008" }}>
<thead>
            <tr>{["日付","組数","人数","現金","ペイキャス","合計"].map(h => (
              <th key={h} className="lbl" style={{ color: C.sub, fontSize: 11, padding: "6px 8px", borderBottom: `1px solid ${C.line}`, textAlign: h === "日付" ? "left" : "right" }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {dates.map(d => {
              const r = byDate[d];
              const dow = ["日","月","火","水","木","金","土"][new Date(d).getDay()];
              return (
                <tr key={d} style={{ background: "#181008" }}>

                  <td className="lbl" style={{ color: C.cream, padding: "8px 8px", borderBottom: `1px solid ${C.line}44`, fontSize: 13 }}>{Number(d.split("-")[2])}日({dow})</td>
                  <td className="lbl" style={{ color: C.sub, padding: "8px 8px", borderBottom: `1px solid ${C.line}44`, textAlign: "right", fontSize: 13 ,background: "#181008"}}>{r.count}</td>
                  <td className="lbl" style={{ color: C.sub, padding: "8px 8px", borderBottom: `1px solid ${C.line}44`, textAlign: "right", fontSize: 13,background: "#181008"}}>{r.people}</td>
                  <td className="val" style={{ color: C.cream, padding: "8px 8px", borderBottom: `1px solid ${C.line}44`, textAlign: "right", fontSize: 13,background: "#181008"}}>{yen(r.cash)}</td>
                  <td className="val" style={{ color: C.cream, padding: "8px 8px", borderBottom: `1px solid ${C.line}44`, textAlign: "right", fontSize: 13,background: "#181008"}}>{yen(r.pay)}</td>
                  <td className="gold" style={{ color: C.gold, padding: "8px 8px", borderBottom: `1px solid ${C.line}44`, textAlign: "right", fontWeight: 700, fontSize: 13,background: "#181008"}}>{yen(r.cash + r.pay)}</td>
                </tr>
              );
            })}
            <tr style={{ background: "#181008" }}>

              <td colSpan={2} className="lbl" style={{ color: C.gold, padding: "10px 8px", fontWeight: 700, background: "#181008" }}>合計</td>
<td className="val" style={{ color: C.gold, padding: "10px 8px", textAlign: "right", fontWeight: 700, background: "#181008" }}>{sales.reduce((a,s) => a + (s.people_count||0), 0)}</td>
<td className="gold" style={{ color: C.gold, padding: "10px 8px", textAlign: "right", fontWeight: 700, background: "#181008" }}>{yen(sales.filter(s=>s.pay_method==="現金").reduce((a,s)=>a+s.amount,0))}</td>
<td className="gold" style={{ color: C.gold, padding: "10px 8px", textAlign: "right", fontWeight: 700, background: "#181008" }}>{yen(sales.filter(s=>s.pay_method==="ペイキャス").reduce((a,s)=>a+s.amount,0))}</td>
<td className="gold" style={{ color: C.gold, padding: "10px 8px", textAlign: "right", fontWeight: 900, fontSize: 16, background: "#181008" }}>{yen(sales.reduce((a,s)=>a+s.amount,0))}</td>
         </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

// ===== 月次ビュー =====
function OwnerMonthlyView({ sales: _, tobacco: __, selectedMonth, C, yen }) {
  const [sales, setSales] = useState([]);
  const [tobacco, setTobacco] = useState([]);
  useEffect(() => {
    const { start, end } = monthRange(selectedMonth);
    supabase.from("sales").select("*").gte("sale_date", start).lte("sale_date", end).limit(5000)

      .then(({ data }) => setSales(data || []));
    supabase.from("tobacco_sales").select("*").gte("sale_date", start).lte("sale_date", end).range(0, 9999)
      .then(({ data }) => setTobacco(data || []));
  }, [selectedMonth]);

  const total = sales.reduce((a, s) => a + s.amount, 0);
  const cash = sales.filter(s => s.pay_method === "現金").reduce((a, s) => a + s.amount, 0);
  const pay = sales.filter(s => s.pay_method === "ペイキャス").reduce((a, s) => a + s.amount, 0);
  const people = sales.reduce((a, s) => a + (s.people_count || 0), 0);
  const tobTotal = tobacco.reduce((a, t) => a + t.price, 0);
  const tax = Math.round(total / 11);
  const rows = [
    ["総売上（タバコ除く）", yen(total)],
    ["　うち現金", yen(cash)],
    ["　うちペイキャス", yen(pay)],
    ["内消費税10%", yen(tax)],
    ["来客組数", `${sales.length}組`],
    ["来客人数", `${people}名`],
    ["客単価（組）", yen(sales.length ? Math.round(total / sales.length) : 0)],
    ["タバコ売上", yen(tobTotal)],
  ];
  return (
    <div style={{ marginTop: 16 }}>
      {rows.map(([label, val]) => (
        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.line}44` }}>
          <span className="lbl" style={{ color: C.sub }}>{label}</span>
          <span className="val" style={{ color: C.gold, fontWeight: 700 }}>{val}</span>
        </div>
      ))}
    </div>
  );
}

// ===== PLUビュー =====
function OwnerPluView({ items, C, yen }) {
  const [pluTab, setPluTab] = useState("all");
  const plu = {};
  items.forEach(o => {
    if (!o.item_name || o.item_name.startsWith("【") || o.price <= 0) return;
    if (!plu[o.item_name]) plu[o.item_name] = { qty: 0, amount: 0 };
    plu[o.item_name].qty += o.qty || 1;
    plu[o.item_name].amount += (o.price || 0) * (o.qty || 1);
  });
  const sorted = Object.entries(plu).sort((a, b) => b[1].amount - a[1].amount);

  // カテゴリフィルター
  const SWEETS = ["ミルクレープ","ガトーショコラ","フォンダンショコラ","チーズケーキ","紅茶のシフォン","栗のモンブラン","バニラアイスクリーム","コーヒーゼリー"];
  const STRAIGHT = ["トラジャ","マンデリン","モカ","グァテマラ","キリマンジェロ"];
  const filtered = pluTab === "all" ? sorted
    : pluTab === "sweets" ? sorted.filter(([name]) => SWEETS.some(s => name.includes(s)))
    : pluTab === "straight" ? sorted.filter(([name]) => STRAIGHT.some(s => name.includes(s)))
    : pluTab === "sand" ? sorted.filter(([name]) => name.endsWith("サンド") || name.endsWith("トースト"))
    : sorted;

  const tabs = [
    { key: "all", label: "全件" },
    { key: "sweets", label: "🍰 スイーツ" },
    { key: "straight", label: "☕ ストレート" },
    { key: "sand", label: "🥪 サンド" },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setPluTab(t.key)}
            style={{ padding: "6px 12px", background: pluTab === t.key ? C.gold : "transparent", border: `1px solid ${pluTab === t.key ? C.gold : C.line}`, borderRadius: 8, color: pluTab === t.key ? "#0d0905" : C.sub, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {t.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? <div className="lbl" style={{ color: C.sub, textAlign: "center", padding: 40 }}>データなし</div> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["商品名","数量","売上"].map(h => (
              <th key={h} className="lbl" style={{ color: C.sub, fontSize: 11, padding: "6px 8px", borderBottom: `1px solid ${C.line}`, textAlign: h === "商品名" ? "left" : "right" }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {filtered.map(([name, v], i) => (
              <tr key={name}>
                <td className="lbl" style={{ color: C.cream, padding: "7px 8px", borderBottom: `1px solid ${C.line}33`, fontSize: 13 }}>
                  <span className="lbl" style={{ color: C.sub, marginRight: 6 }}>{i + 1}.</span>{name}
                </td>
                <td className="lbl" style={{ color: C.sub, padding: "7px 8px", borderBottom: `1px solid ${C.line}33`, textAlign: "right", fontSize: 13 }}>{v.qty}</td>
                <td className="gold" style={{ color: C.gold, padding: "7px 8px", borderBottom: `1px solid ${C.line}33`, textAlign: "right", fontSize: 13 }}>{yen(v.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ===== ドロア開閉ログビュー（Supabase版）=====
function DrawerLogView({ selectedMonth, C }) {
  const [logs, setLogs] = useState([]);
  const [yy, mm] = selectedMonth.split("-");
  const start = `${yy}-${String(mm).padStart(2,"0")}-01`;
  const end = `${yy}-${String(mm).padStart(2,"0")}-${String(new Date(Number(yy), Number(mm), 0).getDate()).padStart(2,"0")}`;

  useEffect(() => {
    supabase.from("drawer_logs").select("*")
      .gte("log_date", start).lte("log_date", end)
      .order("opened_at", { ascending: false })
      .then(({ data }) => setLogs(data || []));
  }, [selectedMonth]);

  const fmt = (iso) => {
    const d = new Date(iso);
    return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div className="lbl" style={{ color: C.sub, fontSize: 12, marginBottom: 12 }}>{yy}年{Number(mm)}月　ドロア開閉ログ</div>
      <div className="lbl" style={{ color: C.sub, fontSize: 11, marginBottom: 16 }}>計 {logs.length}回</div>
      {logs.length === 0 ? <div className="lbl" style={{ color: C.sub, textAlign: "center", padding: 40 }}>ログなし</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {logs.map((log, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: C.panel, border: `1px solid ${C.line}`, borderRadius: 8 }}>
              <span className="lbl" style={{ color: C.cream }}>{fmt(log.opened_at)}</span>
              <span className="lbl" style={{ color: C.sub }}>ドロアを開けました</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== レジ確認ログビュー（Supabase版）=====
function CashCheckLogView({ selectedMonth, C, yen }) {
  const [logs, setLogs] = useState([]);
  const [yy, mm] = selectedMonth.split("-");
  const start = `${yy}-${String(mm).padStart(2,"0")}-01`;
  const end = `${yy}-${String(mm).padStart(2,"0")}-${String(new Date(Number(yy), Number(mm), 0).getDate()).padStart(2,"0")}`;

  useEffect(() => {
    supabase.from("cashcheck_logs").select("*")
      .gte("log_date", start).lte("log_date", end)
      .order("checked_at", { ascending: false })
      .then(({ data }) => setLogs(data || []));
  }, [selectedMonth]);

  const fmt = (iso) => {
    const d = new Date(iso);
    return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };
  const resultLabel = (r) => r === "same" ? { text: "✅ 同じ", color: "#4aaa5a" } : r === "short" ? { text: "⚠️ 不足", color: "#c95a5a" } : { text: "💡 多い", color: "#5a8aca" };

  return (
    <div style={{ marginTop: 16 }}>
      <div className="lbl" style={{ color: C.sub, fontSize: 12, marginBottom: 16 }}>{yy}年{Number(mm)}月　レジ確認ログ</div>
      {logs.length === 0 ? <div className="lbl" style={{ color: C.sub, textAlign: "center", padding: 40 }}>ログなし</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {logs.map((log, i) => {
            const rl = resultLabel(log.result);
            return (
              <div key={i} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span className="val" style={{ color: C.cream, fontWeight: 700 }}>{fmt(log.checked_at)}　{log.staff}</span>
                  <span style={{ color: rl.color, fontWeight: 700 }}>{rl.text}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span className="lbl" style={{ color: C.sub }}>あるべき金額</span>
                  <span className="val" style={{ color: C.gold }}>{yen(log.system_cash)}</span>
                </div>
                {log.diff !== 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 2 }}>
                    <span className="lbl" style={{ color: C.sub }}>差額</span>
                    <span style={{ color: log.diff < 0 ? "#c95a5a" : "#5a8aca", fontWeight: 700 }}>{log.diff > 0 ? "+" : ""}¥{(log.diff||0).toLocaleString()}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== 滞在時間ビュー =====
function StayTimeView({ sales, C }) {
  const fmtTime = (iso) => {
    if (!iso) return "—";
    // "HH:MM" 形式ならそのまま返す
    if (/^\d{1,2}:\d{2}$/.test(iso)) return iso;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };
  const fmtDuration = (ms) => {
    if (!ms || ms < 0) return "—";
    const m = Math.round(ms / 60000);
    if (m < 60) return `${m}分`;
    return `${Math.floor(m/60)}時間${m%60}分`;
  };

  const rows = sales.filter(s => s.checkin_time && s.sale_time).map(s => {
    const checkin = new Date(s.checkin_time);
    // sale_timeが "HH:MM" 形式の場合、sale_dateと合わせてDateに変換
    let checkout;
    if (/^\d{1,2}:\d{2}$/.test(s.sale_time)) {
      checkout = new Date(`${s.sale_date}T${s.sale_time.padStart(5,"0")}:00`);
    } else {
      checkout = new Date(s.sale_time);
    }
    const duration = (checkout - checkin > 0) ? checkout - checkin : null;
    return { ...s, checkin, checkout, duration };
  }).sort((a, b) => b.checkout - a.checkout);

  const avgMs = rows.length ? rows.reduce((a, r) => a + r.duration, 0) / rows.length : 0;
  const maxMs = rows.length ? Math.max(...rows.map(r => r.duration)) : 0;
  const minMs = rows.length ? Math.min(...rows.map(r => r.duration)) : 0;

  return (
    <div style={{ marginTop: 16 }}>
      {rows.length > 0 && (
        <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 10, padding: "14px 16px", marginBottom: 16 }}>
          <div style={{ color: C.sub, fontSize: 12, marginBottom: 10 }}>滞在時間サマリー</div>
          {[["平均滞在時間", fmtDuration(avgMs)], ["最長", fmtDuration(maxMs)], ["最短", fmtDuration(minMs)]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.line}44` }}>
              <span style={{ color: C.sub }}>{l}</span>
              <span style={{ color: C.gold, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
        </div>
      )}
      {rows.length === 0 ? (
        <div style={{ color: C.sub, textAlign: "center", padding: 40 }}>データなし（会計後から記録されます）</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>{["日付","T","来店","会計","滞在時間","人数"].map(h => (
              <th key={h} style={{ color: C.sub, fontSize: 11, padding: "6px 8px", borderBottom: `1px solid ${C.line}`, textAlign: h === "日付" ? "left" : "right" }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ color: C.cream, padding: "8px 8px", borderBottom: `1px solid ${C.line}33`, fontSize: 12 }}>{r.sale_date ? r.sale_date.slice(5) : "—"}</td>
                <td style={{ color: C.sub, padding: "8px 8px", borderBottom: `1px solid ${C.line}33`, textAlign: "right", fontSize: 12 }}>{r.table_no}</td>
                <td style={{ color: C.sub, padding: "8px 8px", borderBottom: `1px solid ${C.line}33`, textAlign: "right", fontSize: 12 }}>{fmtTime(r.checkin_time)}</td>
                <td style={{ color: C.sub, padding: "8px 8px", borderBottom: `1px solid ${C.line}33`, textAlign: "right", fontSize: 12 }}>{fmtTime(r.sale_time)}</td>
                <td style={{ color: C.gold, padding: "8px 8px", borderBottom: `1px solid ${C.line}33`, textAlign: "right", fontWeight: 700, fontSize: 13 }}>{fmtDuration(r.duration)}</td>
                <td style={{ color: C.sub, padding: "8px 8px", borderBottom: `1px solid ${C.line}33`, textAlign: "right", fontSize: 12 }}>{r.people_count}名</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ===== テーブルクリア（未収記録）ビュー =====
function TableClearView({ supabase, C, yen }) {
  const [orders, setOrders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [confirming, setConfirming] = useState(null); // クリア確認中のテーブルNo
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const [{ data: o }, { data: l }] = await Promise.all([
      supabase.from("orders").select("*").in("status", ["pending","served"]).order("table_no"),
      supabase.from("uncollected_logs").select("*").order("cleared_at", { ascending: false }).limit(20),
    ]);
    setOrders(o || []);
    setLogs(l || []);
  };

  useEffect(() => { fetchData(); }, []);

  // テーブルごとに注文を集計
  const byTable = {};
  orders.forEach(o => {
    if (o.item_name.startsWith("【人数")) return;
    if (!byTable[o.table_no]) byTable[o.table_no] = { items: [], total: 0 };
    byTable[o.table_no].items.push(o);
    byTable[o.table_no].total += o.price * o.qty;
  });
  const occupiedTables = Object.keys(byTable).sort();

  const clearTable = async (tableNo) => {
    setLoading(true);
    const tableData = byTable[tableNo];
    // 未収記録をSupabaseに保存
    await supabase.from("uncollected_logs").insert({
      cleared_at: new Date().toISOString(),
      log_date: new Date().toISOString().slice(0,10),
      table_no: tableNo,
      amount: tableData.total,
      items: tableData.items.map(o => ({ name: o.item_name, qty: o.qty, price: o.price })),
    });
    // 該当テーブルの注文を全削除
    await supabase.from("orders").delete().eq("table_no", String(tableNo));
    setConfirming(null);
    await fetchData();
    setLoading(false);
  };

  const fmtDate = (iso) => {
    const d = new Date(iso);
    return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  return (
    <div style={{ marginTop: 16 }}>
      {/* 使用中テーブル一覧 */}
      <div className="lbl" style={{ color: C.sub, fontSize: 12, marginBottom: 10 }}>現在使用中のテーブル</div>
      {occupiedTables.length === 0 ? (
        <div style={{ color: C.sub, textAlign: "center", padding: 30, background: C.panel, borderRadius: 10, marginBottom: 20 }}>使用中テーブルなし</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {occupiedTables.map(t => (
            <div key={t} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: C.gold, fontWeight: 900, fontSize: 18 }}>テーブル {t}</span>
                <span style={{ color: C.gold, fontWeight: 700, fontSize: 16 }}>{yen(byTable[t].total)}</span>
              </div>
              <div style={{ marginBottom: 10 }}>
                {byTable[t].items.filter(o => o.price >= 0).map((o, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.sub, padding: "2px 0" }}>
                    <span>{o.item_name} ×{o.qty}</span>
                    <span>{yen(o.price * o.qty)}</span>
                  </div>
                ))}
              </div>
              {confirming === t ? (
                <div style={{ background: "#2a0a0a", border: "2px solid #c95a5a", borderRadius: 10, padding: 12, textAlign: "center" }}>
                  <div style={{ color: "#ff6b6b", fontWeight: 700, marginBottom: 10 }}>⚠️ テーブル{t}の注文を未収として記録し削除します</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setConfirming(null)}
                      style={{ flex: 1, padding: 10, background: "transparent", border: `1px solid ${C.line}`, borderRadius: 8, color: C.sub, cursor: "pointer" }}>キャンセル</button>
                    <button onClick={() => clearTable(t)} disabled={loading}
                      style={{ flex: 2, padding: 10, background: "#c95a5a", border: "none", borderRadius: 8, color: "#fff", fontWeight: 900, cursor: "pointer" }}>
                      {loading ? "処理中…" : "🗑 未収記録してクリア"}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirming(t)}
                  style={{ width: "100%", padding: "10px 0", background: "transparent", border: "2px solid #c95a5a", borderRadius: 8, color: "#c95a5a", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  🗑 このテーブルをクリア
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 未収記録履歴 */}
      <div className="lbl" style={{ color: C.sub, fontSize: 12, marginBottom: 10 }}>未収記録履歴</div>
      {logs.length === 0 ? (
        <div style={{ color: C.sub, textAlign: "center", padding: 20 }}>記録なし</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {logs.map((log, i) => (
            <div key={i} style={{ background: C.panel, border: `1px solid #c95a5a44`, borderRadius: 8, padding: "10px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: C.cream, fontWeight: 700 }}>テーブル {log.table_no}</span>
                <span style={{ color: "#c95a5a", fontWeight: 700 }}>{yen(log.amount)}</span>
              </div>
              <div style={{ color: C.sub, fontSize: 12 }}>{fmtDate(log.cleared_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
