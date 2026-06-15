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

function calcDuration(checkin, saleTime, saleDate) {
  if (!checkin || !saleTime) return null;
  const ci = new Date(checkin);
  let co;
  if (/^\d{1,2}:\d{2}$/.test(saleTime)) {
    co = new Date(`${saleDate}T${saleTime.padStart(5, "0")}:00`);
  } else {
    co = new Date(saleTime);
  }
  const mins = Math.round((co - ci) / 60000);
  if (mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}時間${m}分` : `${m}分`;
}

export default function HistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("today");

  const todayStr = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const from = new Date();
      from.setDate(from.getDate() - 30);
      const fromStr = from.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
      const { data: s } = await supabase
        .from("sales")
        .select("*")
        .gte("sale_date", fromStr)
        .order("sale_date", { ascending: false });
      setSales(s || []);
      setLoading(false);
    })();
  }, []);

  const days = Array.from(
    new Set(sales.map((s) => s.sale_date).filter(Boolean))
  ).sort().reverse();

  const targetDate = selectedDay === "today" ? todayStr : selectedDay;

  const filtered = sales
    .filter((s) => s.sale_date === targetDate)
    .sort((a, b) => (b.sale_time || "").localeCompare(a.sale_time || ""));

  const totalAmount = filtered.reduce((a, s) => a + s.amount, 0);
  const totalPeople = filtered.reduce((a, s) => a + (s.people_count || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: C.ink, color: C.cream, fontFamily: "'Noto Sans JP', sans-serif", paddingBottom: 40 }}>
      {/* ヘッダー */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: C.panel, borderBottom: `1px solid ${C.line}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontFamily: "serif", color: C.gold, fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>📋 取引履歴</div>
        <div style={{ color: C.sub, fontSize: 12 }}>ラウンジ カトレア</div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {/* 日付タブ */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14, overflowX: "auto" }}>
          <button onClick={() => setSelectedDay("today")}
            style={{ padding: "8px 14px", background: selectedDay === "today" ? C.gold : "transparent", border: `1px solid ${selectedDay === "today" ? C.gold : C.line}`, borderRadius: 8, color: selectedDay === "today" ? C.ink : C.cream, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
            今日
          </button>
          {days.filter((d) => d !== todayStr).slice(0, 14).map((d) => {
            const [, m, day] = d.split("-");
            return (
              <button key={d} onClick={() => setSelectedDay(d)}
                style={{ padding: "8px 14px", background: selectedDay === d ? C.gold : "transparent", border: `1px solid ${selectedDay === d ? C.gold : C.line}`, borderRadius: 8, color: selectedDay === d ? C.ink : C.cream, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                {Number(m)}/{Number(day)}
              </button>
            );
          })}
        </div>

        {/* 日次サマリー */}
        {!loading && filtered.length > 0 && (
          <div style={{ background: C.panel, border: `1px solid ${C.gold}`, borderRadius: 10, padding: "12px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div>
              <div style={{ color: C.sub, fontSize: 11 }}>売上合計</div>
              <div style={{ color: C.gold, fontSize: 24, fontWeight: 900, fontFamily: "serif" }}>{yen(totalAmount)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: C.sub, fontSize: 12 }}>{filtered.length}組　{totalPeople}名</div>
              <div style={{ color: C.sub, fontSize: 12, marginTop: 4 }}>
                客単価 {yen(totalPeople ? Math.round(totalAmount / totalPeople) : 0)}
              </div>
            </div>
          </div>
        )}

        {/* 取引一覧 */}
        {loading ? (
          <div style={{ color: C.sub, textAlign: "center", padding: 60 }}>読み込み中…</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: C.sub, textAlign: "center", padding: 60 }}>この日の取引データはありません</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((s, i) => {
              const duration = calcDuration(s.checkin_time, s.sale_time, s.sale_date);
              return (
                <div key={s.id || i} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px" }}>
                  {/* ヘッダー */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                      <span style={{ color: C.cream, fontWeight: 700, fontSize: 17 }}>T {s.table_no}</span>
                      {s.people_count > 0 && (
                        <span style={{ color: C.sub, fontSize: 13 }}>{s.people_count}名</span>
                      )}
                    </div>
                    <span style={{ color: C.gold, fontWeight: 900, fontSize: 22, fontFamily: "serif" }}>{yen(s.amount)}</span>
                  </div>

                  {/* 時刻・支払 */}
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    {s.checkin_time && (
                      <span style={{ color: C.sub, fontSize: 12 }}>来店 {fmtTime(s.checkin_time)}</span>
                    )}
                    <span style={{ color: C.sub, fontSize: 12 }}>会計 {fmtTime(s.sale_time)}</span>
                    {duration && (
                      <span style={{ color: C.sub, fontSize: 12 }}>滞在 {duration}</span>
                    )}
                    <span style={{ color: s.pay_method === "現金" ? "#4aaa5a" : "#5a8aca", fontSize: 12, fontWeight: 700 }}>
                      {s.pay_method === "現金" ? "💴 現金" : "💳 ペイキャス"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
