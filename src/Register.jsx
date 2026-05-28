import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://zxdgiszrsmumjjxmvszb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZGdpc3pyc211bWpqeG12c3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2ODM2MTksImV4cCI6MjA5NTI1OTYxOX0.vNndS7JEzIUsa007EPO2zRoYhUr-z01LM32BKIhMSz4"
);

const TABLES = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,"A","B","C","D","E","F","G","H","I","J","K","L","M","N","O"];

const TOBACCO = [
  { id: 1, name: "ピースライト ボックス", price: 600 },
  { id: 2, name: "セブンスター ボックス", price: 600 },
  { id: 3, name: "メビウス 1mg", price: 580 },
  { id: 4, name: "メビウス 3mg", price: 580 },
  { id: 5, name: "メビウス 6mg", price: 580 },
];

const STAFF = ["佐々木店長", "宮川", "末永", "井淵"];

function Keypad({ value, onChange }) {
  const keys = ["1","2","3","4","5","6","7","8","9","000","0","⌫"];
  const handle = (k) => {
    if (k === "⌫") onChange(value.slice(0, -1));
    else if (value.length < 6) onChange(value + k);
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginTop: 8 }}>
      {keys.map((k) => (
        <button key={k} onClick={() => handle(k)}
          style={{ padding: "14px 0", background: k === "⌫" ? "#3d1010" : "#251a0a", border: "1px solid #3d2c14", borderRadius: 8, color: k === "⌫" ? "#c95a5a" : "#c9952a", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>
          {k}
        </button>
      ))}
    </div>
  );
}

function PLUReport({ supabase, onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => { fetchItems(); }, [selectedMonth]);

  const fetchItems = async () => {
    setLoading(true);
    const [year, month] = selectedMonth.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    const { data } = await supabase
      .from("order_items")
      .select("*")
      .gte("sale_date", startDate)
      .lte("sale_date", endDate);
    setItems(data || []);
    setLoading(false);
  };

  // メニュー別集計
  const byItem = {};
  items.forEach(item => {
    if (item.price < 0) return; // 値引きは除外
    if (!byItem[item.item_name]) {
      byItem[item.item_name] = { qty: 0, total: 0, price: item.price };
    }
    byItem[item.item_name].qty += item.qty;
    byItem[item.item_name].total += item.price * item.qty;
  });

  // 売上順にソート
  const sorted = Object.entries(byItem).sort((a, b) => b[1].total - a[1].total);
  const grandTotal = sorted.reduce((a, [, v]) => a + v.total, 0);
  const grandQty = sorted.reduce((a, [, v]) => a + v.qty, 0);

  // カテゴリー分類
  const categories = {
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
    for (const [cat, items] of Object.entries(categories)) {
      if (items.includes(name)) return cat;
    }
    return "その他";
  };

  const byCategory = {};
  sorted.forEach(([name, data]) => {
    const cat = getCategory(name);
    if (!byCategory[cat]) byCategory[cat] = { items: [], total: 0, qty: 0 };
    byCategory[cat].items.push([name, data]);
    byCategory[cat].total += data.total;
    byCategory[cat].qty += data.qty;
  });

  return (
    <div style={{ background: "#0d0905", minHeight: "100vh", color: "#f0e6d0", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 18 }}>📋 PLU集計</div>
        <button onClick={onBack} style={{ padding: "6px 14px", background: "transparent", border: "1px solid #3d2c14", borderRadius: 8, color: "#8a7050", cursor: "pointer" }}>戻る</button>
      </div>

      <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
        style={{ width: "100%", padding: "10px 12px", background: "#251a0a", border: "1px solid #3d2c14", borderRadius: 8, color: "#f0e6d0", fontSize: 14, marginBottom: 16, boxSizing: "border-box" }} />

      {loading ? <div style={{ textAlign: "center", color: "#8a7050", paddingTop: 40 }}>読み込み中...</div> : (
        <>
          <div style={{ background: "#181008", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "#8a7050", fontSize: 12 }}>総売上（値引除く）</span>
              <span style={{ color: "#c9952a", fontFamily: "serif", fontSize: 18, fontWeight: 700 }}>¥{grandTotal.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#8a7050", fontSize: 12 }}>総販売数</span>
              <span style={{ color: "#c9952a" }}>{grandQty}点</span>
            </div>
          </div>

          {Object.entries(byCategory).filter(([, d]) => d.items.length > 0).map(([cat, catData]) => (
            <div key={cat} style={{ background: "#181008", borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 14 }}>{cat}</div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ color: "#8a7050", fontSize: 11, marginRight: 8 }}>{catData.qty}点</span>
                  <span style={{ color: "#c9952a", fontSize: 13, fontWeight: 700 }}>¥{catData.total.toLocaleString()}</span>
                </div>
              </div>
              {catData.items.map(([name, data]) => (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #3d2c1433" }}>
                  <span style={{ color: "#f0e6d0", fontSize: 12 }}>{name}</span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ color: "#8a7050", fontSize: 11, marginRight: 8 }}>{data.qty}点</span>
                    <span style={{ color: "#c9952a", fontSize: 12 }}>¥{data.total.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {sorted.length === 0 && (
            <div style={{ textAlign: "center", color: "#3d2c14", paddingTop: 40, fontSize: 14 }}>データなし</div>
          )}
        </>
      )}
    </div>
  );
}

function DailyReport({ supabase, onBack, cashCheckLogs }) {
  const [sales, setSales] = useState([]);
  const [tobaccoSales, setTobaccoSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const [{ data: s }, { data: t }] = await Promise.all([
      supabase.from("sales").select("*").eq("sale_date", today).order("created_at", { ascending: true }),
      supabase.from("tobacco_sales").select("*").eq("sale_date", today).order("created_at", { ascending: true }),
    ]);
    setSales(s || []);
    setTobaccoSales(t || []);
    setLoading(false);
  };

  const todayCash = sales.filter(s => s.pay_method === "現金").reduce((a, s) => a + s.amount, 0);
  const todayPay = sales.filter(s => s.pay_method === "ペイキャス").reduce((a, s) => a + s.amount, 0);
  const todayTotal = sales.reduce((a, s) => a + s.amount, 0);
  const todayCount = sales.length;
  const todayPeople = sales.reduce((a, s) => a + (s.people_count || 0), 0);
  const tobaccoTotal = tobaccoSales.reduce((a, s) => a + s.price, 0);
  const groups = {};
  sales.forEach(s => {
    const hour = s.sale_time ? s.sale_time.split(":")[0] : "不明";
    if (!groups[hour]) groups[hour] = 0;
    groups[hour] += s.amount;
  });

  return (
    <div style={{ background: "#0d0905", minHeight: "100vh", color: "#f0e6d0", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 18 }}>📊 日計</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchAll} style={{ padding: "6px 14px", background: "transparent", border: "1px solid #3d2c14", borderRadius: 8, color: "#8a7050", cursor: "pointer", fontSize: 11 }}>更新</button>
          <button onClick={onBack} style={{ padding: "6px 14px", background: "transparent", border: "1px solid #3d2c14", borderRadius: 8, color: "#8a7050", cursor: "pointer" }}>戻る</button>
        </div>
      </div>
      {loading ? <div style={{ textAlign: "center", color: "#8a7050", paddingTop: 40 }}>読み込み中...</div> : (
        <>
          <div style={{ background: "#181008", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 14, marginBottom: 10 }}>{new Date().toLocaleDateString("ja-JP")} 本日集計</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#8a7050" }}>現金合計</span>
              <span style={{ color: "#c9952a", fontFamily: "serif" }}>¥{todayCash.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#8a7050" }}>ペイキャス合計</span>
              <span style={{ color: "#c9952a", fontFamily: "serif" }}>¥{todayPay.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, borderTop: "1px solid #3d2c14", paddingTop: 8 }}>
              <span style={{ color: "#f0e6d0", fontWeight: 700 }}>総売上（タバコ除く）</span>
              <span style={{ color: "#c9952a", fontFamily: "serif", fontSize: 20, fontWeight: 700 }}>¥{todayTotal.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#8a7050" }}>組数</span>
              <span style={{ color: "#c9952a", fontFamily: "serif" }}>{todayCount}組</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#8a7050" }}>人数</span>
              <span style={{ color: "#c9952a", fontFamily: "serif" }}>{todayPeople}名</span>
            </div>
          </div>
          <div style={{ background: "#181008", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ color: "#8a7050", fontSize: 12, marginBottom: 8 }}>時間帯別売上</div>
            {Object.keys(groups).length === 0 ? <div style={{ color: "#3d2c14", fontSize: 13 }}>データなし</div>
              : Object.entries(groups).sort().map(([hour, amount]) => (
                <div key={hour} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #3d2c1433" }}>
                  <span style={{ color: "#8a7050" }}>{hour}時台</span>
                  <span style={{ color: "#c9952a" }}>¥{amount.toLocaleString()}</span>
                </div>
              ))}
          </div>
          <div style={{ background: "#181008", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: "#8a7050" }}>🚬 タバコ売上（現金・別）</span>
              <span style={{ color: "#c9952a", fontFamily: "serif", fontWeight: 700 }}>¥{tobaccoTotal.toLocaleString()}</span>
            </div>
            {tobaccoSales.map((h, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8a7050", padding: "3px 0" }}>
                <span>{h.sale_time} {h.item_name}</span>
                <span>¥{h.price}</span>
              </div>
            ))}
          </div>
          {cashCheckLogs.length > 0 && (
            <div style={{ background: "#181008", borderRadius: 10, padding: 16 }}>
              <div style={{ color: "#8a7050", fontSize: 12, marginBottom: 8 }}>💰 レジ確認履歴</div>
              {cashCheckLogs.map((log, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #3d2c1433" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "#f0e6d0" }}>{log.time} {log.staff}</span>
                    <span style={{ color: "#c9952a" }}>¥{log.systemCash.toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#8a7050", marginTop: 2 }}>釣り銭¥50,000 ＋ 売上¥{log.salesCash.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MonthlyReport({ supabase, onBack }) {
  const [sales, setSales] = useState([]);
  const [tobaccoSales, setTobaccoSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => { fetchAll(); }, [selectedMonth]);

  const fetchAll = async () => {
    setLoading(true);
    const [year, month] = selectedMonth.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    const [{ data: s }, { data: t }] = await Promise.all([
      supabase.from("sales").select("*").gte("sale_date", startDate).lte("sale_date", endDate).order("sale_date", { ascending: true }),
      supabase.from("tobacco_sales").select("*").gte("sale_date", startDate).lte("sale_date", endDate),
    ]);
    setSales(s || []);
    setTobaccoSales(t || []);
    setLoading(false);
  };

  const byDate = {};
  sales.forEach(s => {
    const d = s.sale_date;
    if (!byDate[d]) byDate[d] = { cash: 0, pay: 0, total: 0, count: 0, people: 0 };
    byDate[d].total += s.amount;
    byDate[d].count += 1;
    byDate[d].people += s.people_count || 0;
    if (s.pay_method === "現金") byDate[d].cash += s.amount;
    else byDate[d].pay += s.amount;
  });

  const totalCash = sales.filter(s => s.pay_method === "現金").reduce((a, s) => a + s.amount, 0);
  const totalPay = sales.filter(s => s.pay_method === "ペイキャス").reduce((a, s) => a + s.amount, 0);
  const totalAmount = sales.reduce((a, s) => a + s.amount, 0);
  const totalCount = sales.length;
  const totalPeople = sales.reduce((a, s) => a + (s.people_count || 0), 0);
  const firstHalfPay = sales.filter(s => s.pay_method === "ペイキャス" && parseInt(s.sale_date.split('-')[2]) <= 15).reduce((a, s) => a + s.amount, 0);
  const secondHalfPay = sales.filter(s => s.pay_method === "ペイキャス" && parseInt(s.sale_date.split('-')[2]) > 15).reduce((a, s) => a + s.amount, 0);
  const tobaccoTotal = tobaccoSales.reduce((a, s) => a + s.price, 0);
  const tobaccoByItem = {};
  TOBACCO.forEach(t => { tobaccoByItem[t.name] = { count: 0, total: 0 }; });
  tobaccoSales.forEach(s => {
    if (tobaccoByItem[s.item_name]) {
      tobaccoByItem[s.item_name].count += 1;
      tobaccoByItem[s.item_name].total += s.price;
    }
  });

  return (
    <div style={{ background: "#0d0905", minHeight: "100vh", color: "#f0e6d0", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 18 }}>📅 月次レポート</div>
        <button onClick={onBack} style={{ padding: "6px 14px", background: "transparent", border: "1px solid #3d2c14", borderRadius: 8, color: "#8a7050", cursor: "pointer" }}>戻る</button>
      </div>
      <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
        style={{ width: "100%", padding: "10px 12px", background: "#251a0a", border: "1px solid #3d2c14", borderRadius: 8, color: "#f0e6d0", fontSize: 14, marginBottom: 16, boxSizing: "border-box" }} />
      {loading ? <div style={{ textAlign: "center", color: "#8a7050", paddingTop: 40 }}>読み込み中...</div> : (
        <>
          <div style={{ background: "#181008", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 14, marginBottom: 10 }}>月間合計</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "#8a7050", fontSize: 12 }}>現金合計</span>
              <span style={{ color: "#c9952a" }}>¥{totalCash.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "#8a7050", fontSize: 12 }}>ペイキャス合計</span>
              <span style={{ color: "#c9952a" }}>¥{totalPay.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, borderTop: "1px solid #3d2c14", paddingTop: 6 }}>
              <span style={{ color: "#f0e6d0", fontSize: 13, fontWeight: 700 }}>総売上（タバコ除く）</span>
              <span style={{ color: "#c9952a", fontFamily: "serif", fontSize: 18, fontWeight: 700 }}>¥{totalAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#8a7050", fontSize: 12 }}>総組数</span>
              <span style={{ color: "#c9952a" }}>{totalCount}組</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#8a7050", fontSize: 12 }}>総人数</span>
              <span style={{ color: "#c9952a" }}>{totalPeople}名</span>
            </div>
          </div>
          <div style={{ background: "#181008", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 14, marginBottom: 10 }}>ペイキャス内訳</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "#8a7050", fontSize: 12 }}>1日〜15日</span>
              <span style={{ color: "#c9952a" }}>¥{firstHalfPay.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "#8a7050", fontSize: 12 }}>16日〜月末</span>
              <span style={{ color: "#c9952a" }}>¥{secondHalfPay.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #3d2c14", paddingTop: 6 }}>
              <span style={{ color: "#f0e6d0", fontSize: 12, fontWeight: 700 }}>合計</span>
              <span style={{ color: "#c9952a", fontWeight: 700 }}>¥{totalPay.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ background: "#181008", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 14, marginBottom: 10 }}>🚬 タバコ月間集計（別）</div>
            {TOBACCO.map(t => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #3d2c1433" }}>
                <span style={{ color: "#f0e6d0", fontSize: 12 }}>{t.name}</span>
                <div style={{ textAlign: "right" }}>
                  <span style={{ color: "#8a7050", fontSize: 11, marginRight: 8 }}>{tobaccoByItem[t.name]?.count || 0}本</span>
                  <span style={{ color: "#c9952a" }}>¥{(tobaccoByItem[t.name]?.total || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid #6a4d15" }}>
              <span style={{ color: "#8a7050", fontSize: 12 }}>月計</span>
              <span style={{ color: "#c9952a", fontFamily: "serif", fontWeight: 700 }}>¥{tobaccoTotal.toLocaleString()}</span>
            </div>
          </div>
          <div style={{ background: "#181008", borderRadius: 10, padding: 16 }}>
            <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 14, marginBottom: 10 }}>日別売上</div>
            {Object.keys(byDate).length === 0 ? <div style={{ color: "#3d2c14", fontSize: 13 }}>データなし</div>
              : Object.entries(byDate).sort().map(([date, d]) => (
                <div key={date} style={{ padding: "10px 0", borderBottom: "1px solid #3d2c1433" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "#f0e6d0", fontSize: 13 }}>{date.split('-')[2]}日</span>
                    <span style={{ color: "#c9952a", fontFamily: "serif", fontWeight: 700 }}>¥{d.total.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#8a7050" }}>
                    <span>現金¥{d.cash.toLocaleString()}</span>
                    <span>ペイキャス¥{d.pay.toLocaleString()}</span>
                    <span>{d.count}組</span>
                    <span>{d.people}名</span>
                  </div>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Register() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [confirming, setConfirming] = useState(false);
  const [debugMsg, setDebugMsg] = useState("起動中...");
  const [payMethod, setPayMethod] = useState(null);
  const [receiptType, setReceiptType] = useState(null);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [mode, setMode] = useState("register");
  const [tobaccoConfirming, setTobaccoConfirming] = useState(null);
  const [tobaccoReceiptType, setTobaccoReceiptType] = useState(null);
  const [tobaccoReceived, setTobaccoReceived] = useState("");
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [checkoutInfo, setCheckoutInfo] = useState(null);
  const [lastCheckout, setLastCheckout] = useState(null);
  const [cashCheckLogs, setCashCheckLogs] = useState([]);
  const [cashChecking, setCashChecking] = useState(false);
  const [cashCheckStaff, setCashCheckStaff] = useState(null);
  const [cashCheckOther, setCashCheckOther] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [todaySalesFromDB, setTodaySalesFromDB] = useState([]);
  const [todayTobaccoFromDB, setTodayTobaccoFromDB] = useState([]);
  const [monthlyTobaccoFromDB, setMonthlyTobaccoFromDB] = useState([]);

  useEffect(() => {
    fetchOrders();
    fetchTodaySales();
    fetchTodayTobacco();
    fetchMonthlyTobacco();
    const subscription = supabase.channel("orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => { fetchOrders(); })
      .subscribe();
    return () => supabase.removeChannel(subscription);
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: true });
    if (error) setDebugMsg("エラー: " + error.message);
    else setDebugMsg("取得件数: " + (data ? data.length : 0) + "件");
    
