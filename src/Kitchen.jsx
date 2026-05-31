import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://zxdgiszrsmumjjxmvszb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZGdpc3pyc211bWpqeG12c3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2ODM2MTksImV4cCI6MjA5NTI1OTYxOX0.vNndS7JEzIUsa007EPO2zRoYhUr-z01LM32BKIhMSz4"
);

function speak(text) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ja-JP";
    utter.rate = 0.9;
    utter.pitch = 1.1;
    utter.volume = 1.0;
    synth.speak(utter);
  } catch (e) {}
}

// 和語数詞（ひとつ、ふたつ...）
function jpCount(n) {
  const words = ["","ひとつ","ふたつ","みっつ","よっつ","いつつ","むっつ","ななつ","やっつ","ここのつ","とお"];
  return n <= 10 ? words[n] : `${n}個`;
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "今";
  return `${diff}分前`;
}

export default function Kitchen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [, setTick] = useState(0);
  const prevIds = useRef(new Set());

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    const list = (data || []).filter(o => o.item_name && !o.item_name.startsWith("【人数"));

    // 新規注文があれば音
    const curIds = new Set(list.map(o => o.id));
    let isNew = false;
    curIds.forEach(id => { if (!prevIds.current.has(id)) isNew = true; });
    if (isNew && prevIds.current.size > 0 && soundOn) {
      // 新しく追加されたテーブルごとに読み上げ
      const newItems = list.filter(o => !prevIds.current.has(o.id));
      const byTable = {};
      newItems.forEach(o => {
        if (!byTable[o.table_no]) byTable[o.table_no] = [];
        byTable[o.table_no].push(o.item_name);
      });
      Object.entries(byTable).forEach(([table, items], i) => {
        const itemText = Object.entries(
          newItems.filter(o => o.table_no === table).reduce((acc, o) => {
            acc[o.item_name] = (acc[o.item_name] || 0) + (o.qty || 1);
            return acc;
          }, {})
        ).map(([name, qty]) => `${name} ${jpCount(qty)}`).join("、");
        const msg = `ご注文が入りました。${itemText}、テーブル${table}番です`;
        setTimeout(() => speak(msg), i * 3000);
      });
    }
    prevIds.current = curIds;

    setOrders(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    const iv = setInterval(fetchOrders, 4000);
    return () => clearInterval(iv);
  }, [soundOn]);

  // 経過時間の表示更新
  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  // テーブルごとにまとめる（古い順）
  const byTable = {};
  orders.forEach(o => {
    if (!byTable[o.table_no]) byTable[o.table_no] = [];
    byTable[o.table_no].push(o);
  });
  const tables = Object.keys(byTable).sort((a, b) => {
    const ta = byTable[a][0]?.created_at || "";
    const tb = byTable[b][0]?.created_at || "";
    return ta.localeCompare(tb);
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0d0f12", color: "#fff", fontFamily: "'Hiragino Kaku Gothic ProN', sans-serif", padding: 12 }}>

      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, borderBottom: "2px solid #2a3a2a", paddingBottom: 10 }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: "#4aaa5a" }}>🍳 厨房モニター</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16, color: "#888" }}>{tables.length}テーブル 調理中</span>
          {!soundOn ? (
            <div style={{ textAlign: "center" }}>
              <button onClick={() => { setSoundOn(true); speak("音声通知をオンにしました"); }}
                style={{ padding: "14px 24px", background: "#c9952a", border: "none", borderRadius: 10, color: "#0d0905", fontWeight: 900, fontSize: 18, cursor: "pointer", animation: "pulse 1.5s infinite" }}>
                🔔 最初に必ずタップ！
              </button>
              <div style={{ color: "#c9952a", fontSize: 11, marginTop: 4 }}>タップで音声ONになります</div>
            </div>
          ) : (
            <span style={{ padding: "10px 18px", background: "#1a2a1a", border: "1px solid #4aaa5a", borderRadius: 8, color: "#4aaa5a", fontSize: 15 }}>
              🔔 音声ON
            </span>
          )}
        </div>
      </div>

      {/* 注文カード */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#666", padding: 60, fontSize: 20 }}>読み込み中…</div>
      ) : tables.length === 0 ? (
        <div style={{ textAlign: "center", padding: 80 }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
          <div style={{ color: "#555", fontSize: 22 }}>調理待ちの注文はありません</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {tables.map(table => {
            const items = byTable[table];
            const oldest = items[0]?.created_at;
            const mins = oldest ? Math.floor((Date.now() - new Date(oldest).getTime()) / 60000) : 0;
            const urgent = mins >= 10;
            return (
              <div key={table} style={{ background: "#1a1d22", border: `2.5px solid ${urgent ? "#c95a5a" : "#2a4a2a"}`, borderRadius: 14, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#aaa" }}>テーブル {table}</span>
                  <span style={{ fontSize: 15, color: urgent ? "#c95a5a" : "#888" }}>{timeAgo(oldest)}</span>
                </div>
                {items.map(o => (
                  <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 44, padding: "10px 0", borderBottom: "1px solid #2a2d33" }}>
                    <span style={{ flex: 1 }}>{o.item_name}</span>
                    <span style={{ color: "#c9952a", fontWeight: 900, marginLeft: 12, fontSize: 44 }}>×{o.qty}</span>
                  </div>
                ))}
                {urgent && (
                  <div style={{ marginTop: 10, color: "#c95a5a", fontSize: 14, textAlign: "center" }}>⚠️ {mins}分経過</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
