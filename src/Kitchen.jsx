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
    setTimeout(() => {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "ja-JP";
      utter.rate = 0.9;
      utter.pitch = 1.1;
      utter.volume = 1.0;
      synth.speak(utter);
    }, 100);
  } catch (e) {}
}

// iOSのspeechSynthesisが止まる対策
function keepSynthAlive() {
  const synth = window.speechSynthesis;
  if (!synth) return;
  if (synth.paused) { synth.resume(); return; }
  if (synth.speaking) return;
  const dummy = new SpeechSynthesisUtterance("\u3000");
  dummy.volume = 0;
  dummy.lang = "ja-JP";
  synth.speak(dummy);
  setTimeout(() => { if (!synth.speaking) synth.cancel(); }, 500);
}

// 和語数詞（ひとつ、ふたつ...）
function jpCount(n) {
  const words = ["","ひとつ","ふたつ","みっつ","よっつ","いつつ","むっつ","ななつ","やっつ","ここのつ","とお"];
  return n <= 10 ? words[n] : `${n}個`;
}

function jstDate(offsetDays = 0) {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

// 指定日より前で、最後に保存された残数(remain)を取得する（1件だけ、再帰なし）
async function getCarryover(beforeDate, itemName) {
  try {
    const { data } = await supabase
      .from("cake_stock")
      .select("remain,date")
      .eq("item_name", itemName)
      .lt("date", beforeDate)
      .not("remain", "is", null)
      .order("date", { ascending: false })
      .limit(1);
    return data?.[0]?.remain || 0;
  } catch (e) {
    return 0;
  }
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
  const [soundDead, setSoundDead] = useState(false);
  const [, setTick] = useState(0);
  const prevIds = useRef(new Set());
  const lastSpokeRef = useRef(Date.now()); // 最後に音が鳴った時刻
  const [coffeeJellyRemain, setCoffeeJellyRemain] = useState(null);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    const list = (data || []).filter(o => o.item_name && !o.item_name.startsWith("【人数") && !o.item_name.includes("値引き") && (o.price === null || o.price >= 0));

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
        const counts = newItems.filter(o => o.table_no === table).reduce((acc, o) => {
          acc[o.item_name] = (acc[o.item_name] || 0) + (o.qty || 1);
          return acc;
        }, {});
        const itemText = Object.entries(counts).map(([name, qty]) => `${name} ${qty}点`).join("、");
        const msg = `注文が入りました。${itemText}`;
        setTimeout(() => { speak(msg); lastSpokeRef.current = Date.now(); }, i * 3000);
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

  const fetchCoffeeJellyStock = async () => {
    try {
      const TODAY_JST = jstDate(0);
      const YESTERDAY_JST = jstDate(-1);

      const carryOver = await getCarryover(TODAY_JST, "コーヒーゼリー");

      const [{ data: tStock }, { data: tSales }] = await Promise.all([
        supabase.from("cake_stock").select("thawed").eq("item_name", "コーヒーゼリー").eq("date", TODAY_JST),
        supabase.from("order_items").select("qty").eq("item_name", "コーヒーゼリー").eq("sale_date", TODAY_JST),
      ]);

      const tThawed = tStock?.[0]?.thawed || 0;
      const tSold = (tSales || []).reduce((sum, r) => sum + (r.qty || 1), 0);

      setCoffeeJellyRemain(carryOver + tThawed - tSold);
    } catch (e) {
      // 取得失敗時は表示しない
    }
  };

  useEffect(() => {
    fetchCoffeeJellyStock();
    const iv = setInterval(fetchCoffeeJellyStock, 30000);
    return () => clearInterval(iv);
  }, []);

  // soundONのとき5秒ごとにiOS音声エンジンをリフレッシュ
  useEffect(() => {
    if (!soundOn) return;
    const keepAlive = setInterval(keepSynthAlive, 5000);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        const synth = window.speechSynthesis;
        if (synth) {
          synth.cancel();
          setTimeout(() => {
            const wake = new SpeechSynthesisUtterance("\u3000");
            wake.volume = 0;
            wake.lang = "ja-JP";
            synth.speak(wake);
            setTimeout(() => synth.cancel(), 500);
          }, 300);
        }
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    const onPageShow = () => {
      const synth = window.speechSynthesis;
      if (synth && soundOn) {
        synth.cancel();
        setTimeout(() => {
          const wake = new SpeechSynthesisUtterance("\u3000");
          wake.volume = 0;
          wake.lang = "ja-JP";
          synth.speak(wake);
          setTimeout(() => synth.cancel(), 500);
        }, 500);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      clearInterval(keepAlive);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [soundOn]);

  // 30秒ごとに「最後に音が鳴ってから10分以上経過しているか」チェック
  useEffect(() => {
    if (!soundOn) { setSoundDead(false); return; }
    const check = setInterval(() => {
      const elapsed = Date.now() - lastSpokeRef.current;
      if (elapsed > 10 * 60 * 1000) {
        setSoundDead(true);
      } else {
        setSoundDead(false);
      }
    }, 30000);
    return () => clearInterval(check);
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

  // 朝9時以降かどうか
  const nowHour = new Date().getHours();
  const isMorning = nowHour >= 9;

  const showJellyBanner = coffeeJellyRemain !== null && coffeeJellyRemain <= 5;

  return (
    <div style={{ minHeight: "100vh", background: "#0d0f12", color: "#fff", fontFamily: "'Hiragino Kaku Gothic ProN', sans-serif", padding: 12, paddingBottom: showJellyBanner ? 90 : 12 }}>

      {/* 音声が止まったとき全画面強制タップ */}
      {soundOn && soundDead && (
        <div style={{ position: "fixed", inset: 0, background: "#000000ee", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 24 }}>
          <div style={{ color: "#ff8844", fontSize: 28, fontWeight: 900, marginBottom: 24, textAlign: "center" }}>
            ⚠️ 音声が止まっています！
          </div>
          <button onClick={() => {
            const synth = window.speechSynthesis;
            if (synth) synth.cancel();
            lastSpokeRef.current = Date.now();
            setSoundDead(false);
            setTimeout(() => speak("音声を再起動しました"), 300);
          }} style={{
            width: "100%", maxWidth: 500, padding: "56px 0",
            background: "#c95a2a", border: "6px solid #ff8844",
            borderRadius: 24, color: "#fff",
            fontSize: 36, fontWeight: 900, cursor: "pointer",
            animation: "big-pulse 1.2s infinite", lineHeight: 1.4
          }}>
            🔔<br/>ここをタップ！
          </button>
        </div>
      )}
      <style>{`
        @keyframes pulse-orange {
          0%   { box-shadow: 0 0 0 0 rgba(201,149,42,0.9); transform: scale(1); }
          50%  { box-shadow: 0 0 0 24px rgba(201,149,42,0); transform: scale(1.04); }
          100% { box-shadow: 0 0 0 0 rgba(201,149,42,0); transform: scale(1); }
        }
        @keyframes pulse-green {
          0%   { box-shadow: 0 0 0 0 rgba(74,170,90,0.8); transform: scale(1); }
          50%  { box-shadow: 0 0 0 20px rgba(74,170,90,0); transform: scale(1.03); }
          100% { box-shadow: 0 0 0 0 rgba(74,170,90,0); transform: scale(1); }
        }
        @keyframes big-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(201,149,42,1); transform: scale(1); }
          50%  { box-shadow: 0 0 0 40px rgba(201,149,42,0); transform: scale(1.06); }
          100% { box-shadow: 0 0 0 0 rgba(201,149,42,0); transform: scale(1); }
        }
      `}</style>

      {/* ヘッダー */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, borderBottom: "2px solid #2a3a2a", paddingBottom: 10 }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: "#4aaa5a" }}>🍳 厨房モニター</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 16, color: "#888" }}>{tables.length}テーブル 調理中</span>
          {!soundOn ? (
            <div style={{ textAlign: "center" }}>
              <button onClick={() => { setSoundOn(true); setSoundDead(false); lastSpokeRef.current = Date.now(); speak("音声をオンにしました"); }}
                style={{ padding: "20px 32px", background: "#c9952a", border: "4px solid #ffcc44", borderRadius: 14, color: "#0d0905", fontWeight: 900, fontSize: 22, cursor: "pointer", animation: "pulse-orange 1.2s infinite" }}>
                🔔 必ずタップ！
              </button>
              <div style={{ color: "#ffcc44", fontSize: 13, marginTop: 6, fontWeight: 700 }}>音声がOFFです！</div>
            </div>
          ) : (
            <button onClick={() => {
              const synth = window.speechSynthesis;
              if (synth) synth.cancel();
              lastSpokeRef.current = Date.now();
              setSoundDead(false);
              setTimeout(() => { speak("音声を再起動しました"); }, 300);
            }} style={{ padding: "16px 24px", background: "#1a3a1a", border: "3px solid #4aaa5a", borderRadius: 12, color: "#4aaa5a", fontSize: 18, fontWeight: 900, cursor: "pointer", animation: "pulse-green 2s infinite" }}>
              🔔 音声ON<br/><span style={{ fontSize: 12, fontWeight: 400 }}>止まったらタップ</span>
            </button>
          )}
        </div>
      </div>

      {/* 注文カード */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#666", padding: 60, fontSize: 20 }}>読み込み中…</div>
      ) : tables.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh" }}>
          <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
          <div style={{ color: "#555", fontSize: 22, marginBottom: 40 }}>調理待ちの注文はありません</div>

          {isMorning && !soundOn && (
            <div style={{ width: "100%", maxWidth: 500, textAlign: "center" }}>
              <div style={{ color: "#ffcc44", fontSize: 20, fontWeight: 900, marginBottom: 20 }}>
                ⚠️ 音声がOFFになっています！
              </div>
              <button onClick={() => { setSoundOn(true); speak("音声をオンにしました"); }}
                style={{
                  width: "100%", padding: "48px 0",
                  background: "#c9952a", border: "6px solid #ffcc44",
                  borderRadius: 24, color: "#0d0905",
                  fontSize: 42, fontWeight: 900, cursor: "pointer",
                  animation: "big-pulse 1.2s infinite",
                  lineHeight: 1.3
                }}>
                🔔<br/>ここを押してください！
              </button>
              <div style={{ color: "#888", fontSize: 16, marginTop: 16 }}>
                押すと音声がONになります
              </div>
            </div>
          )}

          {soundOn && (
            <div style={{ color: "#4aaa5a", fontSize: 18, fontWeight: 700 }}>
              🔔 音声ON・注文を待っています
            </div>
          )}
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
                  <span style={{ background: "#cc2222", color: "#fff", fontFamily: "serif", fontWeight: 900, fontSize: 32, borderRadius: 8, padding: "4px 14px", border: "3px solid #ff6666" }}>{table}</span>
                  <span style={{ fontSize: 15, color: urgent ? "#c95a5a" : "#888" }}>{timeAgo(oldest)}</span>
                </div>
                {items.map(o => (
                  <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 44, padding: "10px 0", borderBottom: "1px solid #2a2d33" }}>
                    <span style={{ flex: 1 }}>{o.item_name.startsWith("モーニング変更追加料金") ? "モーニング（飲み物注文済み）" : o.item_name}</span>
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

      {showJellyBanner && (
        <div style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 500,
          background: "linear-gradient(90deg, #e08a1a, #f0b23a)",
          color: "#1a1200", padding: "16px 20px",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
          boxShadow: "0 -4px 16px rgba(0,0,0,0.4)"
        }}>
          <span style={{ fontSize: 34 }}>🍮</span>
          <span style={{ fontSize: 26, fontWeight: 900 }}>
            コーヒーゼリー、残り{Math.max(0, coffeeJellyRemain)}個になりました
          </span>
        </div>
      )}
    </div>
  );
}
