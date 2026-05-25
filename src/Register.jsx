import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://zxdgiszrsmumjjxmvszb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZGdpc3pyc211bWpqeG12c3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2ODM2MTksImV4cCI6MjA5NTI1OTYxOX0.vNndS7JEzIUsa007EPO2zRoYhUr-z01LM32BKIhMSz4"
);

const TABLES = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,"A","B","C","D","E","F","G","H","I","J","K","L","M","N","O"];

export default function Register() {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchOrders();
    const subscription = supabase
      .channel("orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => supabase.removeChannel(subscription);
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      
      .order("created_at", { ascending: true });
    setOrders(data || []);
  };

  const tableOrders = (tableNo) =>
    orders.filter((o) => o.table_no === String(tableNo) && o.status === "pending");

  const tableTotal = (tableNo) =>
    tableOrders(tableNo).reduce((s, o) => s + o.price * o.qty, 0);

  const tablePeople = (tableNo) => {
    const info = orders.find((o) => o.table_no === String(tableNo) && o.status === "info");
    return info ? info.item_name.replace("【人数：", "").replace("名】", "") : "-";
  };

  const occupiedTables = TABLES.filter((t) => tableOrders(t).length > 0);
  const todaySales = history.reduce((s, h) => s + h.amount, 0);

  const checkout = async () => {
    const t = selected;
    const amount = tableTotal(t);
    const now = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    await supabase.from("orders").delete().eq("table_no", String(t));
    setHistory((prev) => [{ table: t, amount, time: now }, ...prev]);
    setSelected(null);
    setConfirming(false);
  };

  const selectedOrders = selected ? tableOrders(selected).filter(o => o.status === "pending" && !o.item_name.startsWith("【人数")) : [];
  const selectedTotal = selected ? tableTotal(selected) : 0;
  const selectedPeople = selected ? tablePeople(selected) : "-";

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0d0905", color: "#f0e6d0", fontFamily: "'Noto Sans JP', sans-serif" }}>

      {/* 会計確認モーダル */}
      {confirming && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#1c1208", border: "1px solid #3d2c14", borderRadius: 12, padding: 28, width: "90%", maxWidth: 400 }}>
            <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 20, marginBottom: 4 }}>テーブル {selected} 会計</div>
            <div style={{ color: "#8a7050", fontSize: 13, marginBottom: 16 }}>{selectedPeople}名</div>
            <div style={{ borderTop: "1px solid #3d2c14", paddingTop: 12, marginBottom: 12 }}>
              {selectedOrders.map((o, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, borderBottom: "1px solid #3d2c1433" }}>
                  <span style={{ color: o.price < 0 ? "#4aaa5a" : "#f0e6d0" }}>{o.item_name} ×{o.qty}</span>
                  <span style={{ color: o.price < 0 ? "#4aaa5a" : "#c9952a" }}>
                    {o.price < 0 ? `-¥${Math.abs(o.price * o.qty).toLocaleString()}` : `¥${(o.price * o.qty).toLocaleString()}`}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ color: "#8a7050" }}>お会計合計</span>
              <span style={{ fontFamily: "serif", fontSize: 32, fontWeight: 800, color: "#c9952a" }}>¥{selectedTotal.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirming(false)}
                style={{ flex: 1, padding: 14, background: "transparent", border: "1px solid #3d2c14", borderRadius: 10, color: "#8a7050", cursor: "pointer" }}>
                戻る
              </button>
              <button onClick={checkout}
                style={{ flex: 2, padding: 14, background: "#2a6a3a", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
                ✅ 会計完了・リセット
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 左：テーブルマップ */}
      <div style={{ width: 200, background: "#181008", borderRight: "1px solid #3d2c14", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 14px", borderBottom: "1px solid #3d2c14" }}>
          <div style={{ fontFamily: "serif", fontSize: 14, color: "#c9952a", fontWeight: 700 }}>Lounge Cattleya</div>
          <div style={{ fontSize: 10, color: "#8a7050", marginTop: 2 }}>レジ・会計</div>
        </div>
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #3d2c14" }}>
          <div style={{ fontSize: 10, color: "#8a7050" }}>使用中</div>
          <div style={{ fontFamily: "serif", fontSize: 24, color: "#c9952a", fontWeight: 700 }}>{occupiedTables.length}<span style={{ fontSize: 11, color: "#8a7050" }}> / 30</span></div>
        </div>
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #3d2c14" }}>
          <div style={{ fontSize: 10, color: "#8a7050" }}>本日売上</div>
          <div style={{ fontFamily: "serif", fontSize: 16, color: "#c9952a", fontWeight: 700 }}>¥{todaySales.toLocaleString()}</div>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "8px 10px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5 }}>
            {TABLES.map((t) => {
              const occ = tableOrders(t).length > 0;
              return (
                <div key={t} onClick={() => occ && setSelected(t)}
                  style={{ padding: "8px 0", borderRadius: 6, border: `1px solid ${selected === t ? "#c9952a" : occ ? "#6a4d15" : "#3d2c14"}`, background: selected === t ? "#2a1c0a" : occ ? "#1a1008" : "#0d0905", color: selected === t ? "#c9952a" : occ ? "#8a6030" : "#3d2c14", textAlign: "center", fontSize: 13, fontWeight: 700, cursor: occ ? "pointer" : "default" }}>
                  {t}
                </div>
              );
            })}
          </div>
        </div>

        {/* 会計履歴 */}
        {history.length > 0 && (
          <div style={{ padding: "8px 12px", borderTop: "1px solid #3d2c14", maxHeight: 150, overflow: "auto" }}>
            <div style={{ fontSize: 10, color: "#8a7050", marginBottom: 6 }}>会計済み</div>
            {history.map((h, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#8a7050", padding: "3px 0" }}>
                <span>T{h.table} {h.time}</span>
                <span style={{ color: "#c9952a" }}>¥{h.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 右：注文詳細 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", background: "#181008", borderBottom: "1px solid #3d2c14" }}>
          {selected ? (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontFamily: "serif", fontSize: 22, color: "#c9952a", fontWeight: 700 }}>テーブル {selected}</span>
                <span style={{ color: "#8a7050", marginLeft: 12, fontSize: 14 }}>{selectedPeople}名</span>
              </div>
              <span style={{ background: "#2a1c0a", border: "1px solid #6a4d15", borderRadius: 6, padding: "4px 12px", color: "#c9952a", fontSize: 12 }}>使用中</span>
            </div>
          ) : (
            <span style={{ color: "#8a7050" }}>左のテーブルを選択してください</span>
          )}
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {!selected ? (
            <div style={{ textAlign: "center", color: "#3d2c14", paddingTop: 60, fontSize: 14 }}>🧾 テーブルを選択してください</div>
          ) : selectedOrders.length === 0 ? (
            <div style={{ textAlign: "center", color: "#3d2c14", paddingTop: 60, fontSize: 14 }}>注文がありません</div>
          ) : (
            <>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 11, color: "#8a7050", borderBottom: "1px solid #3d2c14" }}>商品名</th>
                    <th style={{ textAlign: "center", padding: "8px 12px", fontSize: 11, color: "#8a7050", borderBottom: "1px solid #3d2c14" }}>数量</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 11, color: "#8a7050", borderBottom: "1px solid #3d2c14" }}>金額</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrders.map((o, i) => (
                    <tr key={i}>
                      <td style={{ padding: "11px 12px", fontSize: 14, color: o.price < 0 ? "#4aaa5a" : "#f0e6d0", borderBottom: "1px solid #3d2c1433" }}>{o.item_name}</td>
                      <td style={{ padding: "11px 12px", textAlign: "center", color: "#8a7050", borderBottom: "1px solid #3d2c1433" }}>×{o.qty}</td>
                      <td style={{ padding: "11px 12px", textAlign: "right", fontFamily: "serif", fontSize: 15, color: o.price < 0 ? "#4aaa5a" : "#c9952a", borderBottom: "1px solid #3d2c1433" }}>
                        {o.price < 0 ? `-¥${Math.abs(o.price * o.qty).toLocaleString()}` : `¥${(o.price * o.qty).toLocaleString()}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, padding: "14px 12px", background: "#1a1008", borderRadius: 8 }}>
                <span style={{ color: "#8a7050" }}>お会計合計</span>
                <span style={{ fontFamily: "serif", fontSize: 28, fontWeight: 800, color: "#c9952a" }}>¥{selectedTotal.toLocaleString()}</span>
              </div>
            </>
          )}
        </div>

        {selected && selectedOrders.length > 0 && (
          <div style={{ padding: "14px 20px", background: "#181008", borderTop: "1px solid #3d2c14" }}>
            <button onClick={() => setConfirming(true)}
              style={{ width: "100%", padding: 16, background: "#c9952a", border: "none", borderRadius: 10, color: "#0d0905", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>
              💴 会計する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
