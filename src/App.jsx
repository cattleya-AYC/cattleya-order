import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://zxdgiszrsmumjjxmvszb.supabase.co",
  "sb_publishable_LLIkeICkSI-IS-2xMKO9_A_I8MAo2IT"
);

const MENU = {
  ドリンク: [
    { id: 1, name: "ホットコーヒー", price: 500 },
    { id: 2, name: "アイスコーヒー", price: 550 },
    { id: 3, name: "紅茶（ホット）", price: 500 },
    { id: 4, name: "カフェラテ", price: 650 },
    { id: 5, name: "ジュース", price: 600 },
  ],
  フード: [
    { id: 11, name: "トースト", price: 400 },
    { id: 12, name: "サンドイッチ", price: 750 },
    { id: 13, name: "ケーキセット", price: 900 },
    { id: 14, name: "パンケーキ", price: 850 },
  ],
  アルコール: [
    { id: 21, name: "生ビール", price: 700 },
    { id: 22, name: "ワイン", price: 800 },
    { id: 23, name: "ハイボール", price: 650 },
  ],
};

const TABLES = Array.from({ length: 25 }, (_, i) => i + 1);

export default function App() {
  const [screen, setScreen] = useState("table");
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeCat, setActiveCat] = useState("ドリンク");
  const [cart, setCart] = useState([]);
  const [sent, setSent] = useState(false);

  const addItem = (item) => {
    setCart((prev) => {
      const ex = prev.find((c) => c.id === item.id);
      if (ex) return prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const sendOrder = async () => {
    for (const item of cart) {
      await supabase.from("orders").insert({
        table_no: selectedTable,
        item_name: item.name,
        price: item.price,
        qty: item.qty,
        status: "pending",
      });
    }
    setSent(true);
    setCart([]);
  };

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  if (screen === "table") return (
    <div style={{ padding: 16, background: "#0f0a05", minHeight: "100vh", color: "#f0e6d0" }}>
      <h1 style={{ color: "#c9952a", marginBottom: 16, fontFamily: "serif" }}>Lounge Cattleya</h1>
      <p style={{ color: "#8a7050", marginBottom: 12 }}>テーブルを選択</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8 }}>
        {TABLES.map((t) => (
          <button key={t} onClick={() => { setSelectedTable(t); setScreen("order"); setSent(false); }}
            style={{ padding: "12px 0", background: "#251a0a", border: "1px solid #3d2c14", borderRadius: 8, color: "#c9952a", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );

  if (sent) return (
    <div style={{ padding: 32, background: "#0f0a05", minHeight: "100vh", color: "#f0e6d0", textAlign: "center" }}>
      <div style={{ fontSize: 64 }}>✅</div>
      <h2 style={{ color: "#c9952a", fontFamily: "serif" }}>送信しました</h2>
      <p style={{ color: "#8a7050" }}>テーブル {selectedTable} の注文をキッチンに送りました</p>
      <button onClick={() => { setSent(false); setScreen("order"); }}
        style={{ marginTop: 16, padding: "14px 32px", background: "#c9952a", border: "none", borderRadius: 10, color: "#0f0a05", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
        追加注文
      </button>
      <br />
      <button onClick={() => { setScreen("table"); setSelectedTable(null); }}
        style={{ marginTop: 10, padding: "12px 24px", background: "transparent", border: "1px solid #3d2c14", borderRadius: 10, color: "#8a7050", cursor: "pointer" }}>
        別テーブルへ
      </button>
    </div>
  );

  return (
    <div style={{ background: "#0f0a05", minHeight: "100vh", color: "#f0e6d0", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", background: "#1c1208", borderBottom: "1px solid #3d2c14" }}>
        <span style={{ color: "#c9952a", fontFamily: "serif", fontWeight: 700 }}>Cattleya</span>
        <span style={{ color: "#8a7050", marginLeft: 8 }}>テーブル {selectedTable}</span>
      </div>
      <div style={{ display: "flex", borderBottom: "1px solid #3d2c14", background: "#1c1208" }}>
        {Object.keys(MENU).map((cat) => (
          <button key={cat} onClick={() => setActiveCat(cat)}
            style={{ flex: 1, padding: "12px 0", border: "none", background: "none", color: activeCat === cat ? "#c9952a" : "#8a7050", borderBottom: activeCat === cat ? "2px solid #c9952a" : "2px solid transparent", cursor: "pointer", fontSize: 13 }}>
            {cat}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        {MENU[activeCat].map((item) => {
          const qty = cart.find((c) => c.id === item.id)?.qty || 0;
          return (
            <div key={item.id} onClick={() => addItem(item)}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 14px", background: "#201508", border: `1px solid ${qty > 0 ? "#6a4d15" : "#352510"}`, borderRadius: 10, marginBottom: 6, cursor: "pointer" }}>
              <span>{item.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#8a7050", fontSize: 13 }}>¥{item.price.toLocaleString()}</span>
                {qty > 0 && <span style={{ background: "#c9952a", color: "#0f0a05", borderRadius: 10, padding: "2px 8px", fontSize: 12, fontWeight: 700 }}>×{qty}</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: "12px 16px", background: "#1c1208", borderTop: "1px solid #3d2c14" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ color: "#8a7050" }}>合計</span>
          <span style={{ color: "#c9952a", fontFamily: "serif", fontSize: 22, fontWeight: 700 }}>¥{total.toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setScreen("table")}
            style={{ padding: 14, background: "transparent", border: "1px solid #3d2c14", borderRadius: 10, color: "#8a7050", cursor: "pointer" }}>
            ← 戻る
          </button>
          <button onClick={sendOrder} disabled={cart.length === 0}
            style={{ flex: 1, padding: 14, background: cart.length > 0 ? "#c9952a" : "#3d2c14", border: "none", borderRadius: 10, color: cart.length > 0 ? "#0f0a05" : "#8a7050", fontWeight: 700, fontSize: 16, cursor: cart.length > 0 ? "pointer" : "not-allowed" }}>
            🍽 キッチンに送信
          </button>
        </div>
      </div>
    </div>
  );
}
