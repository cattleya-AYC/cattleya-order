import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://zxdgiszrsmumjjxmvszb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZGdpc3pyc211bWpqeG12c3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2ODM2MTksImV4cCI6MjA5NTI1OTYxOX0.vNndS7JEzIUsa007EPO2zRoYhUr-z01LM32BKIhMSz4"
);

const C = {
  ink: "#0d0905",
  panel: "#181008",
  line: "#3d2c14",
  gold: "#c9952a",
  goldSoft: "#a07020",
  cream: "#f0e6d0",
  sub: "#8a7050",
};

function yen(n) {
  return `¥${(n || 0).toLocaleString()}`;
}

function fmtTime(iso) {
  if (!iso) return "—";
  if (/^\d{1,2}:\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmtDate(dateStr) {
  if (!dateStr) return "—";
  const [, m, d] = dateStr.split("-");
  return `${Number(m)}/${Number(d)}`;
}

export default function HistoryPage() {
  const [sales, setSales] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("today");
  const [customDate, setCustomDate] = useState("");

  const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });

  useEffect(() => {
    (async () => {
      setLoading(true);
      // 過去30日分を取得
      const from = new Date();
      from.setDate(from.getDate() - 30);
      const fromStr = from.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });

      const [{ data: s }, { data: it }] = await Promise.all([
        supabase.from("sales").select("*").gte("sale_date", fromStr).order("sale_date", { ascending: false }),
        supabase.from("order_items").select("*").gte("sale_date", fromStr),
      ]);
      setSales(s || []);
      setItems(it || []);
      setLoading(false);
    })();
  }, []);

  // 日付リスト
  const days = Array.from(
    new Set(sales.map((s) => s.sale_date).filter(Boolean))
  ).sort().reverse();

  // 表示対象日
  const targetDate =
    selectedDay === "today"
      ? todayStr
      : selectedDay === "custom"
      ? customDate
      : selectedDay;

  const filtered = [...sales]
    .filter((s) => s.sale_date === targetDate)
    .sort((a, b) => {
      const ta = a.sale_time || "";
      const tb = b.sale_time || "";
      return tb.localeCompare(ta);
    });

  // メニュー明細をテーブル＋日付で対応
  const itemsForSale = (s) =>
    items.filter(
      (it) =>
        it.sale_date === s.sale_date &&
        String(it.table_no) === String(s.table_no)
    );

  // 合計
  const totalAmount = filtered.reduce((a, s) => a + s.amount, 0);
  const totalPeople = filtered.reduce((a, s) => a + (s.people_count || 0), 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.ink,
        color: C.cream,
        fontFamily: "'Noto Sans JP', sans-serif",
        paddingBottom: 40,
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: C.panel,
          borderBottom: `1px solid ${C.line}`,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            fontFamily: "serif",
            color: C.gold,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 2,
          }}
        >
          📋 取引履歴
        </div>
        <div style={{ color: C.sub, fontSize: 12 }}>ラウンジ カトレア</div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {/* 日付タブ */}
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 14,
            overflowX: "auto",
          }}
        >
          <button
            onClick={() => setSelectedDay("today")}
            style={{
              padding: "8px 14px",
              background: selectedDay === "today" ? C.gold : "transparent",
              border: `1px solid ${selectedDay === "today" ? C.gold : C.line}`,
              borderRadius: 8,
              color: selectedDay === "today" ? C.ink : C.cream,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            今日
          </button>
          {days
            .filter((d) => d !== todayStr)
            .slice(0, 14)
            .map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                style={{
                  padding: "8px 14px",
                  background: selectedDay === d ? C.gold : "transparent",
                  border: `1px solid ${selectedDay === d ? C.gold : C.line}`,
                  borderRadius: 8,
                  color: selectedDay === d ? C.ink : C.cream,
                  fontSize: 13,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {fmtDate(d)}
              </button>
            ))}
        </div>

        {/* 日次サマリー */}
        {!loading && filtered.length > 0 && (
          <div
            style={{
              background: C.panel,
              border: `1px solid ${C.gold}`,
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 14,
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              <div style={{ color: C.sub, fontSize: 11 }}>売上合計</div>
              <div
                style={{
                  color: C.gold,
                  fontSize: 24,
                  fontWeight: 900,
                  fontFamily: "serif",
                }}
              >
                {yen(totalAmount)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: C.sub, fontSize: 11 }}>
                {filtered.length}組　{totalPeople}名
              </div>
              <div style={{ color: C.sub, fontSize: 11, marginTop: 4 }}>
                客単価（人） {yen(totalPeople ? Math.round(totalAmount / totalPeople) : 0)}
              </div>
            </div>
          </div>
        )}

        {/* 取引一覧 */}
        {loading ? (
          <div
            style={{ color: C.sub, textAlign: "center", padding: 60, fontSize: 14 }}
          >
            読み込み中…
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{ color: C.sub, textAlign: "center", padding: 60, fontSize: 14 }}
          >
            この日の取引データはありません
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((s, i) => {
              const its = itemsForSale(s);
              return (
                <div
                  key={s.id || i}
                  style={{
                    background: C.panel,
                    border: `1px solid ${C.line}`,
                    borderRadius: 12,
                    padding: "14px 16px",
                  }}
                >
                  {/* ヘッダー行 */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                      <span
                        style={{
                          color: C.cream,
                          fontWeight: 700,
                          fontSize: 16,
                        }}
                      >
                        T {s.table_no}
                      </span>
                      <span style={{ color: C.sub, fontSize: 12 }}>
                        {s.people_count ? `${s.people_count}名` : ""}
                      </span>
                    </div>
                    <span
                      style={{
                        color: C.gold,
                        fontWeight: 900,
                        fontSize: 20,
                        fontFamily: "serif",
                      }}
                    >
                      {yen(s.amount)}
                    </span>
                  </div>

                  {/* 時刻・支払 */}
                  <div
                    style={{
                      display: "flex",
                      gap: 14,
                      marginBottom: its.length ? 10 : 0,
                      flexWrap: "wrap",
                    }}
                  >
                    {s.checkin_time && (
                      <span style={{ color: C.sub, fontSize: 12 }}>
                        来店 {fmtTime(s.checkin_time)}
                      </span>
                    )}
                    <span style={{ color: C.sub, fontSize: 12 }}>
                      会計 {fmtTime(s.sale_time)}
                    </span>
                    {s.checkin_time && s.sale_time && (() => {
                      const ci = new Date(s.checkin_time);
                      let co;
                      if (/^\d{1,2}:\d{2}$/.test(s.sale_time)) {
                        co = new Date(`${s.sale_date}T${s.sale_time.padStart(5, "0")}:00`);
                      } else {
                        co = new Date(s.sale_time);
                      }
                      const mins = Math.round((co - ci) / 60000);
                      if (mins > 0) {
                        const h = Math.floor(mins / 60);
                        const m = mins % 60;
                        return (
                          <span style={{ color: C.sub, fontSize: 12 }}>
                            滞在 {h > 0 ? `${h}時間${m}分` : `${m}分`}
                          </span>
                        );
                      }
                      return null;
                    })()}
                    <span
                      style={{
                        color:
                          s.pay_method === "現金" ? "#4aaa5a" : "#5a8aca",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {s.pay_method === "現金" ? "💴 現金" : "💳 ペイキャス"}
                    </span>
                  </div>

                  {/* メニュー明細 */}
                  {its.length > 0 && (
                    <div
                      style={{
                        borderTop: `1px solid ${C.line}`,
                        paddingTop: 8,
                      }}
                    >
                      {its.map((it, j) => (
                        <div
                          key={j}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "3px 0",
                            fontSize: 12,
                          }}
                        >
                          <span style={{ color: it.price < 0 ? "#4aaa5a" : C.cream }}>
                            {it.item_name}
                            {it.qty > 1 ? ` ×${it.qty}` : ""}
                          </span>
                          <span
                            style={{
                              color: it.price < 0 ? "#4aaa5a" : C.sub,
                              marginLeft: 8,
                            }}
                          >
                            {it.price < 0
                              ? `-¥${Math.abs(it.price * it.qty).toLocaleString()}`
                              : `¥${(it.price * it.qty).toLocaleString()}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
