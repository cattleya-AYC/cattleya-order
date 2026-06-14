import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://zxdgiszrsmumjjxmvszb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZGdpc3pyc211bWpqeG12c3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2ODM2MTksImV4cCI6MjA5NTI1OTYxOX0.vNndS7JEzIUsa007EPO2zRoYhUr-z01LM32BKIhMSz4"
);

const MENU = {
  コーヒー: [
    { id: 1, name: "コーヒー（HOT）", price: 650 },
    { id: 2, name: "アイスコーヒー", price: 670 },
    { id: 3, name: "アメリカン", price: 650 },
    { id: 4, name: "カフェ・オ・レ（HOT）", price: 770 },
    { id: 5, name: "アイスオ・レ", price: 780 },
    { id: 6, name: "ウィンナーコーヒー（HOT）", price: 770 },
    { id: 7, name: "アイスウィンナー", price: 790 },
  ],
  ストレート: [
    { id: 9, name: "トラジャ", price: 900 },
    { id: 10, name: "マンデリン", price: 770 },
    { id: 11, name: "モカ", price: 850 },
    { id: 12, name: "グァテマラ", price: 770 },
    { id: 13, name: "キリマンジェロ", price: 770 },
  ],
  紅茶: [
    { id: 21, name: "レモンティ（HOT）", price: 650 },
    { id: 22, name: "アイスレモンティ", price: 670 },
    { id: 23, name: "ミルクティ（HOT）", price: 650 },
    { id: 24, name: "アイスミルクティ", price: 670 },
    { id: 25, name: "ウーロン茶（HOT）", price: 650 },
    { id: 26, name: "アイスウーロン茶", price: 650 },
    { id: 27, name: "こんぶ茶（HOT）", price: 650 },
    { id: 28, name: "梅こん茶（HOT）", price: 650 },
  ],
  ジュース: [
    { id: 31, name: "ミルク（HOT）", price: 650 },
    { id: 32, name: "アイスミルク", price: 650 },
    { id: 33, name: "ココア（HOT）", price: 800 },
    { id: 34, name: "アイスココア", price: 800 },
    { id: 35, name: "トマトジュース", price: 720 },
    { id: 36, name: "リンゴジュース", price: 720 },
    { id: 37, name: "オレンジジュース", price: 720 },
    { id: 38, name: "バナナジュース", price: 770 },
    { id: 39, name: "レモンジュース", price: 770 },
    { id: 40, name: "レモンスカッシュ", price: 790 },
    { id: 41, name: "コカ・コーラ", price: 650 },
    { id: 42, name: "ジンジャーエール", price: 650 },
    { id: 43, name: "ソーダ水", price: 650 },
    { id: 44, name: "カルピス", price: 670 },
    { id: 45, name: "野菜ジュース", price: 770 },
    { id: 46, name: "グアバドリンク", price: 790 },
    { id: 47, name: "マンゴードリンク", price: 790 },
    { id: 48, name: "コーヒーフロート", price: 790 },
    { id: 49, name: "ソーダフロート", price: 790 },
  ],
  フード: [
    { id: 51, name: "トースト（バター＆ジャム）", price: 650 },
    { id: 52, name: "ピザトースト", price: 870 },
    { id: 53, name: "ミックスサンド", price: 890 },
    { id: 54, name: "ハムサンド", price: 890 },
    { id: 55, name: "野菜サンド", price: 890 },
    { id: 56, name: "玉子サンド", price: 870 },
    { id: 57, name: "トーストサンド（ミックス）", price: 970 },
    { id: 58, name: "トーストサンド（ハム）", price: 970 },
    { id: 59, name: "トーストサンド（たまご）", price: 970 },
  ],
  スイーツ: [
    { id: 61, name: "ミルクレープ", price: 550 },
    { id: 62, name: "ガトーショコラ", price: 550 },
    { id: 63, name: "フォンダンショコラ", price: 590 },
    { id: 64, name: "チーズケーキ", price: 590 },
    { id: 65, name: "紅茶のシフォン", price: 630 },
    { id: 66, name: "栗のモンブラン", price: 630 },
    { id: 67, name: "バニラアイスクリーム", price: 770 },
    { id: 68, name: "コーヒーゼリー", price: 770 },
  ],
    モーニング: [
    { id: 71, name: "モーニング（コーヒーHOT）", price: 890 },
    { id: 72, name: "モーニング（コーヒーICE）", price: 890 },
    { id: 73, name: "モーニング（紅茶HOT）", price: 890 },
    { id: 74, name: "モーニング（紅茶ICE）", price: 890 },
  ],

  おかわり: [
    { id: 91, name: "コーヒー おかわり（HOT）", price: 300 },
    { id: 92, name: "コーヒー おかわり（ICE）", price: 300 },
    { id: 99, name: "アメリカン おかわり（HOT）", price: 300 },
    { id: 93, name: "レモンティ おかわり（HOT）", price: 300 },
    { id: 94, name: "レモンティ おかわり（ICE）", price: 300 },
    { id: 95, name: "ミルクティ おかわり（HOT）", price: 300 },
    { id: 96, name: "ミルクティ おかわり（ICE）", price: 300 },
    { id: 97, name: "ウーロン茶 おかわり（HOT）", price: 300 },
    { id: 98, name: "ウーロン茶 おかわり（ICE）", price: 300 },
  ],
  アルコール: [
    { id: 81, name: "オールド（水割り）", price: 790 },
    { id: 82, name: "バドワイザー", price: 800 },
  ],
};

const TABLES = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,"A","B","C","D","E","F","G","H","I","J","K","L","M","N","O"];
const PEOPLE = [1,2,3,4,5,6,7,8,9,10];

export default function App() {
  const [screen, setScreen] = useState("table");
  const [selectedTable, setSelectedTable] = useState(null);
  const [people, setPeople] = useState(null);
  const [activeCat, setActiveCat] = useState("コーヒー");
  const [cart, setCart] = useState([]);
  const [sent, setSent] = useState(false);
  const [changingPeople, setChangingPeople] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [showUnserved, setShowUnserved] = useState(false);
  const [takeout, setTakeout] = useState(false);
  const [unservedOrders, setUnservedOrders] = useState([]);
  const [unservedTable, setUnservedTable] = useState(null);

  const addItem = (item) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.id === item.id);
      if (ex) return prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const decreaseItem = (id) => {
    setCart((prev) =>
      prev.map((c) => c.id === id ? { ...c, qty: c.qty - 1 } : c).filter((c) => c.qty > 0)
    );
  };

  const fetchUnserved = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true });
    setUnservedOrders((data || []).filter(o => !o.item_name.startsWith("【人数")));
  };

  // 30秒ごとに未提供リストを自動更新（10分超チェック用）
  useEffect(() => {
    const iv = setInterval(() => { fetchUnserved(); }, 30000);
    return () => clearInterval(iv);
  }, []);

  const markServed = async (id) => {
    await supabase.from("orders").update({ status: "served" }).eq("id", id);
    fetchUnserved();
  };

  const sendOrder = async () => {
    if (sending) return; // 二重送信防止
    setSending(true);
    try {
      for (const item of cart) {
        await supabase.from("orders").insert({
          table_no: String(selectedTable),
          item_name: item.name,
          price: item.price,
          qty: item.qty,
          status: "pending",
          takeout: takeout,
        });
      }
      await supabase.from("orders").insert({
        table_no: String(selectedTable),
        item_name: `【人数：${people}名】${takeout ? "【持ち帰り】" : ""}`,
        price: 0,
        qty: 1,
        status: "info",
        takeout: takeout,
      });
      setConfirming(false);
      setSent(true);
      setCart([]);
      fetchUnserved();
    } catch (e) {
      alert("送信エラーが発生しました。もう一度お試しください。");
    } finally {
      setSending(false);
    }
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // 10分以上未提供のオーダーがあるか
  const now = new Date();
  const hasOverdue = unservedOrders.some(o => {
    if (!o.created_at) return false;
    return (now - new Date(o.created_at)) > 10 * 60 * 1000;
  });

  if (screen === "table") return (
    <div style={{ padding: 16, background: "#0f0a05", minHeight: "100vh", color: "#f0e6d0" }}>
      <style>{`
        @keyframes pulse-red {
          0%   { box-shadow: 0 0 0 0 rgba(220,50,50,0.7); background: #2a0a0a; }
          50%  { box-shadow: 0 0 0 14px rgba(220,50,50,0); background: #4a1010; }
          100% { box-shadow: 0 0 0 0 rgba(220,50,50,0); background: #2a0a0a; }
        }
        .pulse-btn { animation: pulse-red 1.2s infinite; }
      `}</style>
      <h1 style={{ color: "#c9952a", marginBottom: 16, fontFamily: "serif" }}>Lounge Cattleya</h1>
      <p style={{ color: "#8a7050", marginBottom: 12 }}>テーブルを選択</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
        {TABLES.map((t) => (
          <button key={t} onClick={() => { setSelectedTable(t); setScreen("people"); setPeople(null); setCart([]); setActiveCat("コーヒー"); setConfirming(false); setTakeout(false); }}
            style={{ padding: "12px 0", background: "#251a0a", border: "1px solid #3d2c14", borderRadius: 8, color: "#c9952a", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>
            {t}
          </button>
        ))}
      </div>

      {/* 未提供ボタン */}
      {(() => {
        const hasUnserved = unservedOrders.length > 0;
        return (
          <button
            className={hasOverdue ? "pulse-btn" : ""}
            onClick={() => { fetchUnserved(); setUnservedTable(null); setShowUnserved(true); }}
            style={{
              marginTop: 16, width: "100%", padding: "28px 0",
              background: hasUnserved ? "#2a0a0a" : "#0a1a10",
              border: `3px solid ${hasOverdue ? "#ff3333" : hasUnserved ? "#c95a5a" : "#2a6a3a"}`,
              borderRadius: 12,
              color: hasOverdue ? "#ff6666" : hasUnserved ? "#ff6b6b" : "#4aaa5a",
              fontSize: 22, fontWeight: 900, cursor: "pointer"
            }}>
            {hasOverdue ? `🔴 ⚠️ 未提供あり（${unservedOrders.length}品）10分超！` : hasUnserved ? `🔴 未提供あり（${unservedOrders.length}品）` : "🔵 未提供商品を確認"}
          </button>
        );
      })()}

      {/* 持ち帰りボタン */}
      <button onClick={() => {
        setSelectedTable("持ち帰り");
        setPeople(1);
        setCart([]);
        setActiveCat("コーヒー");
        setConfirming(false);
        setTakeout(true);
        setScreen("order");
      }} style={{
        marginTop: 12, width: "100%", padding: "22px 0",
        background: "#0a1a2a",
        border: "3px solid #2a6aaa",
        borderRadius: 12,
        color: "#5aaaff",
        fontSize: 22, fontWeight: 900, cursor: "pointer"
      }}>
        🛍 持ち帰り（税8%）
      </button>

      {/* 未提供パネル */}
      {showUnserved && (() => {
        const byTable = {};
        unservedOrders.forEach(o => {
          if (!byTable[o.table_no]) byTable[o.table_no] = [];
          byTable[o.table_no].push(o);
        });
        const tables = Object.keys(byTable);
        return (
          <div onClick={() => { setShowUnserved(false); setUnservedTable(null); }}
            style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div onClick={e => e.stopPropagation()}
              style={{ background: "#0f0a05", border: "2px solid #2a3a6a", borderRadius: 14, width: "100%", maxWidth: 400, maxHeight: "80vh", overflow: "auto", padding: 16 }}>
              <div style={{ color: "#5a8aca", fontWeight: 900, fontSize: 18, marginBottom: 14 }}>📦 未提供の注文</div>

              {tables.length === 0 ? (
                <div style={{ color: "#666", textAlign: "center", padding: 30 }}>未提供の注文はありません</div>
              ) : unservedTable === null ? (
                /* テーブル一覧 */
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {tables.map(t => (
                    <button key={t} onClick={() => setUnservedTable(t)}
                      style={{ padding: "14px 16px", background: "#1a1d22", border: "1px solid #2a3a6a", borderRadius: 10, color: "#fff", fontSize: 18, fontWeight: 700, textAlign: "left", cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
                      <span>テーブル {t}</span>
                      <span style={{ color: "#5a8aca", fontSize: 14 }}>{byTable[t].length}品 →</span>
                    </button>
                  ))}
                </div>
              ) : (
                /* 品目一覧 */
                <div>
                  <button onClick={() => setUnservedTable(null)} style={{ background: "transparent", border: "none", color: "#5a8aca", fontSize: 14, cursor: "pointer", marginBottom: 10 }}>← 戻る</button>
                  <div style={{ color: "#fff", fontWeight: 900, fontSize: 20, marginBottom: 12 }}>テーブル {unservedTable}</div>
                  {byTable[unservedTable] ? byTable[unservedTable].map(o => (
                    <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #2a2d33" }}>
                      <span style={{ color: "#f0e6d0", fontSize: 16 }}>{o.item_name} ×{o.qty}</span>
                      <button onClick={() => markServed(o.id)}
                        style={{ padding: "8px 14px", background: "#4aaa5a", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                        出した ✓
                      </button>
                    </div>
                  )) : null}
                </div>
              )}

              <button onClick={() => { setShowUnserved(false); setUnservedTable(null); }}
                style={{ marginTop: 16, width: "100%", padding: "12px 0", background: "transparent", border: "1px solid #3d2c14", borderRadius: 10, color: "#8a7050", fontSize: 14, cursor: "pointer" }}>閉じる</button>
            </div>
          </div>
        );
      })()}
    </div>
  );

  if (screen === "people") return (
    <div style={{ padding: 24, background: "#0f0a05", minHeight: "100vh", color: "#f0e6d0" }}>
      <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 18, marginBottom: 4 }}>Lounge Cattleya</div>
      <div style={{ color: "#8a7050", marginBottom: 24 }}>テーブル {selectedTable}</div>
      <div style={{ fontFamily: "serif", color: "#f0e6d0", fontSize: 20, marginBottom: 16 }}>人数を選択してください</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 24 }}>
        {PEOPLE.map((n) => (
          <button key={n} onClick={() => setPeople(n)}
            style={{ padding: "16px 0", background: people === n ? "#c9952a" : "#251a0a", border: `1px solid ${people === n ? "#c9952a" : "#3d2c14"}`, borderRadius: 10, color: people === n ? "#0f0a05" : "#c9952a", fontSize: 20, fontWeight: 700, cursor: "pointer" }}>
            {n}
          </button>
        ))}
      </div>
      {people && <div style={{ textAlign: "center", marginBottom: 16, color: "#8a7050" }}>{people}名 が選択されています</div>}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setScreen("table")}
          style={{ flex: 1, padding: 14, background: "transparent", border: "1px solid #3d2c14", borderRadius: 10, color: "#8a7050", fontSize: 15, cursor: "pointer" }}>
          ← 戻る
        </button>
        <button onClick={() => setScreen("order")} disabled={!people}
          style={{ flex: 2, padding: 14, background: people ? "#c9952a" : "#3d2c14", border: "none", borderRadius: 10, color: people ? "#0f0a05" : "#8a7050", fontSize: 16, fontWeight: 700, cursor: people ? "pointer" : "not-allowed" }}>
          注文入力へ →
        </button>
      </div>
    </div>
  );

  if (sent) return (
    <div style={{ padding: 24, background: "#0f0a05", minHeight: "100vh", color: "#f0e6d0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 72, marginBottom: 8 }}>✅</div>
      <div style={{ color: "#c9952a", fontFamily: "serif", fontSize: 28, fontWeight: 900, marginBottom: 6 }}>キッチンに送りました</div>
      <div style={{ color: "#8a7050", fontSize: 18, marginBottom: 32 }}>テーブル {selectedTable}・{people}名</div>

      <div style={{ background: "#1a120a", border: "1px solid #3d2c14", borderRadius: 14, padding: "20px 24px", marginBottom: 36, textAlign: "left", width: "100%", maxWidth: 360 }}>
        <div style={{ color: "#c9952a", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>📋 ウェイトレスへ</div>
        <div style={{ color: "#f0e6d0", fontSize: 17, lineHeight: 2 }}>
          <div>① テーブルカードを厨房カウンターに準備してください。</div>
          <div>② 商品と一緒に、テーブルに持って行ってください。</div>
          <div>③ テーブルにサーブしたら、未提供の注文確認から<strong style={{ color: "#c9952a" }}>「出した」</strong>ボタンを押してください。</div>
        </div>
      </div>

      <button onClick={() => { setSent(false); setScreen("table"); setSelectedTable(null); setPeople(null); setActiveCat("コーヒー"); }}
        style={{ width: "100%", maxWidth: 360, padding: "22px 0", background: "#c9952a", border: "none", borderRadius: 14, color: "#0f0a05", fontWeight: 900, fontSize: 24, cursor: "pointer" }}>
        オーダー画面に戻る
      </button>
    </div>
  );

  const FOOD_SWEET_ITEMS = [
    "トースト", "ピザトースト", "ミックスサンド", "ハムサンド", "野菜サンド",
    "玉子サンド", "トーストサンド",
    "ミルクレープ", "ガトーショコラ", "フォンダンショコラ", "チーズケーキ",
    "紅茶のシフォン", "栗のモンブラン", "バニラアイスクリーム", "コーヒーゼリー"
  ];

  const ConfirmModal = () => {
    const foodCount = cart.filter(item => FOOD_SWEET_ITEMS.some(f => item.name.includes(f))).reduce((a, i) => a + i.qty, 0);
    const drinkCount = cart.filter(item => !FOOD_SWEET_ITEMS.some(f => item.name.includes(f)) && !item.name.includes("モーニング") && !item.name.includes("おかわり") && item.price > 0).reduce((a, i) => a + i.qty, 0);
    const autoSetCount = foodCount > 0 && drinkCount > 0 ? Math.min(foodCount, drinkCount) : 0;
    const autoDiscount = autoSetCount * 150;
    const displayTotal = total - autoDiscount;

    return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "#1c1208", border: "1px solid #3d2c14", borderRadius: 12, padding: 24, width: "90%", maxWidth: 400, maxHeight: "80vh", overflow: "auto" }}>
        <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 18, marginBottom: 4 }}>注文確認</div>
        <div style={{ color: "#8a7050", fontSize: 13, marginBottom: 12 }}>テーブル {selectedTable}・{people}名</div>
        <button onClick={() => setTakeout(t => !t)} style={{ width: "100%", padding: "10px 0", marginBottom: 12, background: takeout ? "#1a3a1a" : "#1c1208", border: `2px solid ${takeout ? "#4aaa5a" : "#3d2c14"}`, borderRadius: 8, color: takeout ? "#4aaa5a" : "#8a7050", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
          {takeout ? "🛍 持ち帰り（税8%）✓" : "🛍 持ち帰りにする（税8%）"}
        </button>
        <div style={{ background: "#2a1a0a", border: "2px solid #c9952a", borderRadius: 10, padding: "12px 14px", marginBottom: 14, textAlign: "center" }}>
          <div style={{ color: "#fff", fontWeight: 900, fontSize: 18 }}>⚠️ 必ずお客様に復唱して確認してください</div>
        </div>
        <div style={{ borderTop: "1px solid #3d2c14", paddingTop: 12, marginBottom: 12 }}>
          {cart.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #3d2c1433", fontSize: 14 }}>
              <span style={{ color: "#f0e6d0" }}>{item.name} ×{item.qty}</span>
              <span style={{ color: "#c9952a", fontFamily: "serif" }}>¥{(item.price * item.qty).toLocaleString()}</span>
            </div>
          ))}
          {autoDiscount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #3d2c1433", fontSize: 14 }}>
              <span style={{ color: "#4aaa5a" }}>🍽 セット割引（自動・{autoSetCount}セット）</span>
              <span style={{ color: "#4aaa5a", fontFamily: "serif" }}>-¥{autoDiscount.toLocaleString()}</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingTop: 8 }}>
          <span style={{ color: "#8a7050", fontSize: 14 }}>合計</span>
          <span style={{ fontFamily: "serif", fontSize: 26, fontWeight: 700, color: "#c9952a" }}>¥{displayTotal.toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setConfirming(false)}
            style={{ flex: 1, padding: 14, background: "transparent", border: "1px solid #3d2c14", borderRadius: 10, color: "#8a7050", fontSize: 14, cursor: "pointer" }}>
            ← 修正する
          </button>
          <button onClick={sendOrder} disabled={sending}
            style={{ flex: 2, padding: 14, background: sending ? "#8a7050" : "#c9952a", border: "none", borderRadius: 10, color: "#0f0a05", fontSize: 16, fontWeight: 700, cursor: sending ? "not-allowed" : "pointer" }}>
            {sending ? "送信中…" : "🍽 送信する"}
          </button>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div style={{ background: "#0f0a05", minHeight: "100vh", color: "#f0e6d0", display: "flex", flexDirection: "column" }}>
      {confirming && <ConfirmModal />}

      <div style={{ padding: "10px 16px", background: "#1c1208", borderBottom: "1px solid #3d2c14", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ color: "#c9952a", fontFamily: "serif", fontWeight: 700 }}>T{selectedTable}</span>
          <span style={{ color: "#8a7050", marginLeft: 8, fontSize: 13 }}>{people}名</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setChangingPeople(true)}
            style={{ padding: "4px 10px", background: "transparent", border: "1px solid #3d2c14", borderRadius: 6, color: "#8a7050", fontSize: 11, cursor: "pointer" }}>
            人数変更
          </button>
          {cartCount > 0 && (
            <span style={{ background: "#c9952a", color: "#0f0a05", borderRadius: 12, padding: "2px 10px", fontSize: 13, fontWeight: 700 }}>
              {cartCount}品
            </span>
          )}
        </div>
      </div>

      {changingPeople && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#1c1208", border: "1px solid #3d2c14", borderRadius: 12, padding: 24, width: "85%" }}>
            <div style={{ color: "#c9952a", fontFamily: "serif", fontSize: 16, marginBottom: 16 }}>人数を変更</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, marginBottom: 16 }}>
              {PEOPLE.map((n) => (
                <button key={n} onClick={() => { setPeople(n); setChangingPeople(false); }}
                  style={{ padding: "14px 0", background: people === n ? "#c9952a" : "#251a0a", border: `1px solid ${people === n ? "#c9952a" : "#3d2c14"}`, borderRadius: 8, color: people === n ? "#0f0a05" : "#c9952a", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>
                  {n}
                </button>
              ))}
            </div>
            <button onClick={() => setChangingPeople(false)}
              style={{ width: "100%", padding: 12, background: "transparent", border: "1px solid #3d2c14", borderRadius: 8, color: "#8a7050", cursor: "pointer" }}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", borderBottom: "1px solid #3d2c14", background: "#1c1208", overflowX: "auto" }}>
        {Object.keys(MENU).map((cat) => (
          <button key={cat} onClick={() => setActiveCat(cat)}
            style={{ padding: "12px 14px", border: "none", background: "none", color: activeCat === cat ? "#c9952a" : "#8a7050", borderBottom: activeCat === cat ? "2px solid #c9952a" : "2px solid transparent", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap", flexShrink: 0 }}>
            {cat}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        {MENU[activeCat].map((item) => {
          const qty = cart.find((c) => c.id === item.id)?.qty || 0;
          const isDiscount = item.price < 0;
          return (
            <div key={item.id}
              style={{ display: "flex", alignItems: "center", padding: "11px 14px", background: isDiscount ? "#0a1508" : "#201508", border: `1px solid ${qty > 0 ? "#6a4d15" : isDiscount ? "#1a4020" : "#352510"}`, borderRadius: 10, marginBottom: 6 }}>
              <div style={{ flex: 1, cursor: "pointer" }} onClick={() => addItem(item)}>
                <div style={{ color: isDiscount ? "#4aaa5a" : "#f0e6d0", fontSize: 14 }}>{item.name}</div>
                <div style={{ color: isDiscount ? "#4aaa5a" : "#8a7050", fontSize: 12, marginTop: 2 }}>
                  {isDiscount ? `-¥${Math.abs(item.price)}` : `¥${item.price.toLocaleString()}`}
                </div>
              </div>
              {qty > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={() => decreaseItem(item.id)}
                    style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid #6a4d15", background: "#1a1008", color: "#c9952a", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    −
                  </button>
                  <span style={{ color: "#c9952a", fontWeight: 700, minWidth: 20, textAlign: "center" }}>{qty}</span>
                  <button onClick={() => addItem(item)}
                    style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid #6a4d15", background: "#c9952a", color: "#0f0a05", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    ＋
                  </button>
                </div>
              ) : (
                <button onClick={() => addItem(item)}
                  style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid #3d2c14", background: "#251a0a", color: "#8a7050", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ＋
                </button>
              )}
            </div>
          );
        })}
      </div>

      {cart.length > 0 && (
        <div style={{ padding: "8px 12px", background: "#1a1008", borderTop: "1px solid #3d2c14", maxHeight: 120, overflowY: "auto" }}>
          {cart.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#8a7050", padding: "2px 0" }}>
              <span>{item.name} ×{item.qty}</span>
              <span>¥{(item.price * item.qty).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: "12px 16px", background: "#1c1208", borderTop: "1px solid #3d2c14" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "#8a7050" }}>合計</span>
          <span style={{ color: "#c9952a", fontFamily: "serif", fontSize: 22, fontWeight: 700 }}>¥{total.toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setScreen("people")}
            style={{ padding: 14, background: "transparent", border: "1px solid #3d2c14", borderRadius: 10, color: "#8a7050", cursor: "pointer" }}>
            ← 戻る
          </button>
          <button onClick={() => setConfirming(true)} disabled={cart.length === 0}
            style={{ flex: 1, padding: 14, background: cart.length > 0 ? "#c9952a" : "#3d2c14", border: "none", borderRadius: 10, color: cart.length > 0 ? "#0f0a05" : "#8a7050", fontWeight: 700, fontSize: 16, cursor: cart.length > 0 ? "pointer" : "not-allowed" }}>
            注文確認 →
          </button>
        </div>
      </div>
    </div>
  );
}
