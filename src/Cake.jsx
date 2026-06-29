import { useState, useEffect, useCallback } from "react";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://zxdgiszrsmumjjxmvszb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZGdpc3pyc211bWpqeG12c3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk3MDEyMDAsImV4cCI6MjAyNTI3NzIwMH0.vSVV6_9bFCEMEJmgNuIMhbTpqylVhIqFiqKuDmhkVHc"
);

const ITEMS = [
  "ミルクレープ",
  "ガトーショコラ",
  "フォンダンショコラ",
  "チーズケーキ",
  "紅茶のシフォン",
  "栗のモンブラン",
  "コーヒーゼリー",
];

function toJST(date = new Date()) {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

// order_itemsから日別・商品別販売数を集計
async function fetchSoldFromOrderItems(from, to) {
  const { data } = await supabase
    .from("order_items")
    .select("item_name, qty, sale_date")
    .gte("sale_date", from)
    .lte("sale_date", to)
    .in("item_name", ITEMS);

  const byDateItem = {};
  const byItem = {};
  ITEMS.forEach((item) => (byItem[item] = 0));

  (data || []).forEach((row) => {
    const key = row.sale_date + "__" + row.item_name;
    byDateItem[key] = (byDateItem[key] || 0) + (row.qty || 1);
    byItem[row.item_name] = (byItem[row.item_name] || 0) + (row.qty || 1);
  });

  return { byDateItem, byItem };
}

export default function Cake() {
  const [tab, setTab] = useState("today");
  const [today] = useState(toJST());
  const [stockMap, setStockMap] = useState({});
  const [soldMap, setSoldMap] = useState({});
  const [inputMap, setInputMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [monthYear, setMonthYear] = useState(today.slice(0, 7));

  // 月次集計
  const [monthSold, setMonthSold] = useState({});

  // 日別売上
  const [dailyRows, setDailyRows] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(false);

  const [loading, setLoading] = useState(true);

  // 今日の解凍数
  const fetchTodayStock = useCallback(async () => {
    const { data } = await supabase
      .from("cake_stock")
      .select("item_name, thawed")
      .eq("date", today);
    const map = {};
    (data || []).forEach((r) => (map[r.item_name] = r.thawed));
    setStockMap(map);
    const init = {};
    ITEMS.forEach((item) => (init[item] = map[item] ?? ""));
    setInputMap(init);
  }, [today]);

  // 今日の販売数（order_items）
  const fetchTodaySold = useCallback(async () => {
    const { byItem } = await fetchSoldFromOrderItems(today, today);
    setSoldMap(byItem);
    setLoading(false);
  }, [today]);

  // 月次・日別データ取得
  const fetchMonthData = useCallback(async () => {
    setDailyLoading(true);
    const from = monthYear + "-01";
    const lastDay = new Date(
      parseInt(monthYear.slice(0, 4)),
      parseInt(monthYear.slice(5, 7)),
      0
    ).getDate();
    const to = monthYear + "-" + String(lastDay).padStart(2, "0");

    const { byDateItem, byItem } = await fetchSoldFromOrderItems(from, to);
    setMonthSold(byItem);

    // 全日付を生成（売上ゼロの日も含む）
    const rows = [];
    for (let d = 1; d <= lastDay; d++) {
      const date = monthYear + "-" + String(d).padStart(2, "0");
      const sold = {};
      ITEMS.forEach((item) => {
        sold[item] = byDateItem[date + "__" + item] || 0;
      });
      rows.push({ date, sold });
    }
    setDailyRows(rows);
    setDailyLoading(false);
  }, [monthYear]);

  useEffect(() => {
    fetchTodayStock();
    fetchTodaySold();
  }, [fetchTodayStock, fetchTodaySold]);

  useEffect(() => {
    if (tab === "month" || tab === "daily") fetchMonthData();
  }, [tab, fetchMonthData, monthYear]);

  // 解凍数保存
  const saveThawed = async () => {
    setSaving(true);
    const upserts = ITEMS.map((item) => ({
      date: today,
      item_name: item,
      thawed: parseInt(inputMap[item]) || 0,
      sold: soldMap[item] || 0,
    }));
    const { error } = await supabase.from("cake_stock").upsert(upserts, {
      onConflict: "date,item_name",
    });
    setSaving(false);
    if (!error) {
      setSavedMsg("保存しました ✓");
      fetchTodayStock();
      setTimeout(() => setSavedMsg(""), 2500);
    }
  };

  // PDF印刷（日別）
  const printDailyPDF = () => {
    const win = window.open("", "_blank");
    const year = monthYear.slice(0, 4);
    const month = monthYear.slice(5, 7);

    const tableRows = dailyRows.map((row) => {
      const total = ITEMS.reduce((s, item) => s + (row.sold[item] || 0), 0);
      const cells = ITEMS.map((item) => {
        const s = row.sold[item] || 0;
        return `<td style="color:${s > 0 ? "#27ae60" : "#ccc"}">${s > 0 ? s : "-"}</td>`;
      }).join("");
      return `<tr><td><strong>${row.date.slice(5)}</strong></td>${cells}<td><strong>${total > 0 ? total : "-"}</strong></td></tr>`;
    }).join("");

    const headerCells = ITEMS.map(
      (item) => `<th style="background:#3d2b1f;color:#fff;padding:6px 4px;font-size:11px">${item}</th>`
    ).join("");

    const totalCells = ITEMS.map((item) => {
      const s = dailyRows.reduce((sum, r) => sum + (r.sold[item] || 0), 0);
      return `<td><strong>${s}</strong></td>`;
    }).join("");
    const grandTotal = ITEMS.reduce((s, item) => s + (monthSold[item] || 0), 0);

    win.document.write(`
      <html><head><title>スイーツ日別売上 ${year}年${month}月</title>
      <style>
        body{font-family:'Hiragino Sans',sans-serif;padding:20px;font-size:12px;}
        h2{text-align:center;color:#3d2b1f;margin-bottom:4px;}
        p{text-align:center;color:#666;margin-bottom:16px;}
        table{width:100%;border-collapse:collapse;font-size:11px;}
        th,td{border:1px solid #ddd;padding:5px 4px;text-align:center;}
        tr:nth-child(even){background:#fafafa;}
        .total-row{background:#fff3e0;font-weight:bold;}
        @media print{@page{size:A4 landscape;margin:10mm;}}
      </style></head>
      <body>
        <h2>🎂 スイーツ日別売上</h2>
        <p>${year}年${month}月</p>
        <table>
          <thead>
            <tr>
              <th style="background:#3d2b1f;color:#fff">日付</th>
              ${headerCells}
              <th style="background:#3d2b1f;color:#fff">合計</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
            <tr class="total-row">
              <td><strong>合計</strong></td>${totalCells}<td><strong>${grandTotal}</strong></td>
            </tr>
          </tbody>
        </table>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const today_display = today.replace(/-/g, "/");

  const tabStyle = (key) => ({
    flex: 1, padding: "12px 0", border: "none", cursor: "pointer", fontSize: 14, fontWeight: "bold",
    background: tab === key ? "#fdf8f4" : "#fff",
    color: tab === key ? "#3d2b1f" : "#999",
    borderBottom: tab === key ? "3px solid #8b5e3c" : "3px solid transparent",
    transition: "all 0.2s",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#fdf8f4", fontFamily: "'Hiragino Sans', sans-serif" }}>
      {/* ヘッダー */}
      <div style={{ background: "#3d2b1f", color: "#fff", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 28 }}>🎂</span>
        <div>
          <div style={{ fontSize: 20, fontWeight: "bold", letterSpacing: 2 }}>スイーツ管理</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>Lounge Cattleya</div>
        </div>
      </div>

      {/* タブ */}
      <div style={{ display: "flex", background: "#fff", borderBottom: "2px solid #e8ddd5" }}>
        <button onClick={() => setTab("today")} style={tabStyle("today")}>📋 今日の状況</button>
        <button onClick={() => setTab("month")} style={tabStyle("month")}>📊 月次集計</button>
        <button onClick={() => setTab("daily")} style={tabStyle("daily")}>📅 日別売上</button>
      </div>

      {/* 今日の状況 */}
      {tab === "today" && (
        <div style={{ padding: "16px 12px", maxWidth: 600, margin: "0 auto" }}>
          <div style={{ textAlign: "center", color: "#8b5e3c", fontSize: 14, marginBottom: 16 }}>
            📅 {today_display}
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#999" }}>読み込み中...</div>
          ) : (
            <>
              {ITEMS.map((item) => {
                const thawed = parseInt(inputMap[item]) || 0;
                const sold = soldMap[item] || 0;
                const remaining = thawed - sold;
                const isLow = thawed > 0 && remaining <= 1;
                const isOut = thawed > 0 && remaining <= 0;
                return (
                  <div key={item} style={{
                    background: isOut ? "#fff5f5" : isLow ? "#fffbf0" : "#fff",
                    border: `2px solid ${isOut ? "#e74c3c" : isLow ? "#f39c12" : "#e8ddd5"}`,
                    borderRadius: 12, marginBottom: 10, padding: "14px 16px",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold", fontSize: 16, color: "#3d2b1f" }}>{item}</div>
                      <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
                        販売済み: <strong style={{ color: "#555" }}>{sold}</strong> 個
                      </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#999", marginBottom: 3 }}>解凍数</div>
                      <input
                        type="number" min="0" value={inputMap[item] ?? ""}
                        onChange={(e) => setInputMap((prev) => ({ ...prev, [item]: e.target.value }))}
                        style={{
                          width: 56, height: 44, textAlign: "center", fontSize: 20, fontWeight: "bold",
                          border: "2px solid #c9a882", borderRadius: 8, color: "#3d2b1f", background: "#fdf8f4",
                        }}
                      />
                    </div>
                    <div style={{ textAlign: "center", minWidth: 52 }}>
                      <div style={{ fontSize: 10, color: "#999", marginBottom: 3 }}>残数</div>
                      <div style={{
                        fontSize: 22, fontWeight: "bold",
                        color: isOut ? "#e74c3c" : isLow ? "#e67e22" : "#27ae60",
                        background: isOut ? "#fde" : isLow ? "#fef9e7" : "#eafaf1",
                        borderRadius: 8, padding: "6px 10px",
                      }}>
                        {thawed > 0 ? remaining : "-"}
                      </div>
                    </div>
                  </div>
                );
              })}
              <button onClick={saveThawed} disabled={saving} style={{
                width: "100%", padding: "16px 0", marginTop: 8,
                background: saving ? "#ccc" : "#3d2b1f", color: "#fff",
                border: "none", borderRadius: 12, fontSize: 17, fontWeight: "bold",
                cursor: saving ? "not-allowed" : "pointer", letterSpacing: 1,
              }}>
                {saving ? "保存中..." : "💾 解凍数を保存"}
              </button>
              {savedMsg && (
                <div style={{ textAlign: "center", color: "#27ae60", fontWeight: "bold", marginTop: 10, fontSize: 16 }}>
                  {savedMsg}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 月次集計 */}
      {tab === "month" && (
        <div style={{ padding: "16px 12px", maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <input type="month" value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              style={{ flex: 1, padding: "10px 14px", border: "2px solid #c9a882", borderRadius: 8, fontSize: 16, color: "#3d2b1f", background: "#fff" }}
            />
          </div>
          <div style={{ background: "#fff", border: "2px solid #e8ddd5", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 13, fontWeight: "bold", color: "#8b5e3c", marginBottom: 10 }}>📊 月間販売合計</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ITEMS.map((item) => (
                <div key={item} style={{
                  background: "#fdf8f4", border: "1px solid #e8ddd5", borderRadius: 8,
                  padding: "8px 12px", textAlign: "center", minWidth: 90,
                }}>
                  <div style={{ fontSize: 11, color: "#999", marginBottom: 3 }}>{item}</div>
                  <div style={{ fontSize: 22, fontWeight: "bold", color: "#3d2b1f" }}>{monthSold[item] || 0}</div>
                  <div style={{ fontSize: 10, color: "#aaa" }}>個</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 日別売上 */}
      {tab === "daily" && (
        <div style={{ padding: "16px 12px", maxWidth: 900, margin: "0 auto" }}>
          {/* 月選択＋PDF */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <input type="month" value={monthYear}
              onChange={(e) => setMonthYear(e.target.value)}
              style={{ flex: 1, padding: "10px 14px", border: "2px solid #c9a882", borderRadius: 8, fontSize: 16, color: "#3d2b1f", background: "#fff" }}
            />
            <button onClick={printDailyPDF} style={{
              padding: "10px 20px", background: "#3d2b1f", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 15, fontWeight: "bold", cursor: "pointer",
            }}>
              🖨 PDF印刷
            </button>
          </div>

          {dailyLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#999" }}>読み込み中...</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, background: "#fff", borderRadius: 12, overflow: "hidden" }}>
                <thead>
                  <tr>
                    <th style={{ background: "#3d2b1f", color: "#fff", padding: "10px 8px", textAlign: "center", minWidth: 48 }}>日付</th>
                    {ITEMS.map((item) => (
                      <th key={item} style={{ background: "#3d2b1f", color: "#fff", padding: "10px 6px", textAlign: "center", fontSize: 12, minWidth: 72 }}>
                        {item}
                      </th>
                    ))}
                    <th style={{ background: "#3d2b1f", color: "#fff", padding: "10px 8px", textAlign: "center", minWidth: 48 }}>合計</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyRows.map((row, i) => {
                    const total = ITEMS.reduce((s, item) => s + (row.sold[item] || 0), 0);
                    return (
                      <tr key={row.date} style={{ background: i % 2 === 0 ? "#fff" : "#fdf8f4" }}>
                        <td style={{ textAlign: "center", fontWeight: "bold", color: "#3d2b1f", padding: "9px 4px" }}>
                          {row.date.slice(5)}
                        </td>
                        {ITEMS.map((item) => {
                          const s = row.sold[item] || 0;
                          return (
                            <td key={item} style={{ textAlign: "center", padding: "9px 4px", color: s > 0 ? "#27ae60" : "#ccc", fontWeight: s > 0 ? "bold" : "normal" }}>
                              {s > 0 ? s : "-"}
                            </td>
                          );
                        })}
                        <td style={{ textAlign: "center", padding: "9px 4px", fontWeight: "bold", color: total > 0 ? "#3d2b1f" : "#ccc" }}>
                          {total > 0 ? total : "-"}
                        </td>
                      </tr>
                    );
                  })}
                  {/* 合計行 */}
                  <tr style={{ background: "#fff3e0", fontWeight: "bold" }}>
                    <td style={{ textAlign: "center", color: "#3d2b1f", padding: "10px 4px" }}>合計</td>
                    {ITEMS.map((item) => {
                      const s = monthSold[item] || 0;
                      return (
                        <td key={item} style={{ textAlign: "center", padding: "10px 4px", color: "#27ae60" }}>{s}</td>
                      );
                    })}
                    <td style={{ textAlign: "center", padding: "10px 4px", color: "#3d2b1f" }}>
                      {ITEMS.reduce((s, item) => s + (monthSold[item] || 0), 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
