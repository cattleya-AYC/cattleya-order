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
  TOBACCO.forEach(t => { tobaccoByItem[t.name] = { count: 0, total: 0, price: t.price }; });
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
    setOrders(data || []);
  };

  const fetchTodaySales = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from("sales").select("*").eq("sale_date", today);
    setTodaySalesFromDB(data || []);
  };

  const fetchTodayTobacco = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from("tobacco_sales").select("*").eq("sale_date", today).order("created_at", { ascending: false });
    setTodayTobaccoFromDB(data || []);
  };

  const fetchMonthlyTobacco = async () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(year, now.getMonth() + 1, 0).toISOString().split('T')[0];
    const { data } = await supabase.from("tobacco_sales").select("*").gte("sale_date", startDate).lte("sale_date", endDate);
    setMonthlyTobaccoFromDB(data || []);
  };

  const tableOrders = (tableNo) =>
    orders.filter((o) => String(o.table_no) === String(tableNo) && o.status === "pending");

  const tableTotal = (tableNo) =>
    tableOrders(tableNo).reduce((s, o) => s + o.price * o.qty, 0);

  const tablePeople = (tableNo) => {
    const info = orders.find((o) => String(o.table_no) === String(tableNo) && o.status === "info");
    return info ? parseInt(info.item_name.replace("【人数：", "").replace("名】", "")) || 0 : 0;
  };

  const tablePeopleStr = (tableNo) => {
    const info = orders.find((o) => String(o.table_no) === String(tableNo) && o.status === "info");
    return info ? info.item_name.replace("【人数：", "").replace("名】", "") : "-";
  };

  const occupiedTables = TABLES.filter((t) => tableOrders(t).length > 0);
  const todaySales = todaySalesFromDB.reduce((s, h) => s + h.amount, 0);
  const todayTobaccoTotal = todayTobaccoFromDB.reduce((a, s) => a + s.price, 0);
  const todayCashFromDB = todaySalesFromDB.filter(s => s.pay_method === "現金").reduce((a, s) => a + s.amount, 0);

  const monthlyTobaccoByItem = {};
  TOBACCO.forEach(t => { monthlyTobaccoByItem[t.name] = { count: 0, total: 0 }; });
  monthlyTobaccoFromDB.forEach(s => {
    if (monthlyTobaccoByItem[s.item_name]) {
      monthlyTobaccoByItem[s.item_name].count += 1;
      monthlyTobaccoByItem[s.item_name].total += s.price;
    }
  });
  const monthlyTobaccoTotal = monthlyTobaccoFromDB.reduce((a, s) => a + s.price, 0);

  const selectedOrders = selected
    ? tableOrders(selected).filter(o => o.status === "pending" && !o.item_name.startsWith("【人数"))
    : [];
  const selectedTotal = selected ? tableTotal(selected) : 0;
  const selectedPeople = selected ? tablePeopleStr(selected) : "-";

  const change = receivedAmount ? parseInt(receivedAmount) - selectedTotal : null;
  const tobaccoChange = tobaccoReceived && tobaccoConfirming
    ? parseInt(tobaccoReceived) - tobaccoConfirming.price
    : null;

  const canCheckout = payMethod && receiptType && (
    payMethod === "ペイキャス" || (receivedAmount && change !== null && change >= 0)
  );
  const canTobaccoCheckout = tobaccoReceiptType && tobaccoReceived && tobaccoChange !== null && tobaccoChange >= 0;

  const checkout = async () => {
    const t = selected;
    const amount = tableTotal(t);
    const now = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    const nowMs = Date.now();
    if (lastCheckout && lastCheckout.table === t && lastCheckout.amount === amount && (nowMs - lastCheckout.timestamp) < 120000) {
      setConfirming(false); setPayMethod(null); setReceiptType(null); setReceivedAmount(""); return;
    }
    const chg = payMethod === "現金" ? change : null;
    const people = tablePeople(t);
    await supabase.from("orders").delete().eq("table_no", String(t));
    await supabase.from("sales").insert({ table_no: String(t), amount, pay_method: payMethod, receipt_type: receiptType, people_count: people, sale_time: now });
    await fetchTodaySales();
    const record = { table: t, amount, time: now, pay: payMethod, receipt: receiptType, timestamp: Date.now() };
    setHistory((prev) => [record, ...prev]);
    setLastCheckout(record);
    setCheckoutInfo({ table: t, amount, pay: payMethod, receipt: receiptType, change: chg, received: receivedAmount ? parseInt(receivedAmount) : null });
    setSelected(null); setConfirming(false); setPayMethod(null); setReceiptType(null); setReceivedAmount(""); setCheckoutDone(true);
  };

  const addDiscount = () => {
    supabase.from("orders").insert({ table_no: String(selected), item_name: "セット値引き", price: -150, qty: 1, status: "pending" }).then(() => fetchOrders());
  };

  const openTobaccoConfirm = (item) => { setTobaccoConfirming(item); setTobaccoReceiptType(null); setTobaccoReceived(""); };

  const completeTobaccoSale = async () => {
    const now = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    await supabase.from("tobacco_sales").insert({
      item_name: tobaccoConfirming.name,
      price: tobaccoConfirming.price,
      receipt_type: tobaccoReceiptType,
      sale_time: now,
    });
    await fetchTodayTobacco();
    await fetchMonthlyTobacco();
    setTobaccoConfirming(null); setTobaccoReceiptType(null); setTobaccoReceived(""); setMode("register");
  };

  const confirmCashCheck = () => {
    const staffName = showOtherInput ? cashCheckOther : cashCheckStaff;
    if (!staffName) return;
    const now = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    const systemCash = todayCashFromDB + 50000;
    setCashCheckLogs((prev) => [{ time: now, staff: staffName, systemCash, salesCash: todayCashFromDB }, ...prev]);
    setCashChecking(false); setCashCheckStaff(null); setCashCheckOther(""); setShowOtherInput(false);
  };

  const now = new Date();

  if (checkoutDone && checkoutInfo) return (
    <div style={{ background: "#0d0905", minHeight: "100vh", color: "#f0e6d0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
      <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 22, marginBottom: 8 }}>会計完了</div>
      <div style={{ color: "#8a7050", marginBottom: 24 }}>テーブル {checkoutInfo.table}</div>
      <div style={{ background: "#181008", borderRadius: 12, padding: 24, width: "100%", maxWidth: 360, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ color: "#8a7050" }}>お会計</span>
          <span style={{ color: "#c9952a", fontFamily: "serif", fontSize: 20, fontWeight: 700 }}>¥{checkoutInfo.amount.toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ color: "#8a7050" }}>支払い</span>
          <span style={{ color: "#f0e6d0" }}>{checkoutInfo.pay}</span>
        </div>
        {checkoutInfo.received && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ color: "#8a7050" }}>お預かり</span>
            <span style={{ color: "#f0e6d0" }}>¥{checkoutInfo.received.toLocaleString()}</span>
          </div>
        )}
        {checkoutInfo.change !== null && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "1px solid #3d2c14", marginTop: 8 }}>
            <span style={{ color: "#4aaa5a", fontSize: 16 }}>おつり</span>
            <span style={{ color: "#4aaa5a", fontFamily: "serif", fontSize: 28, fontWeight: 800 }}>¥{checkoutInfo.change.toLocaleString()}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ color: "#8a7050" }}>書類</span>
          <span style={{ color: "#f0e6d0" }}>{checkoutInfo.receipt}</span>
        </div>
      </div>
      <button onClick={() => { setCheckoutDone(false); setCheckoutInfo(null); }}
        style={{ width: "100%", maxWidth: 360, padding: 16, background: "#c9952a", border: "none", borderRadius: 10, color: "#0d0905", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>
        次の会計へ
      </button>
    </div>
  );

  if (mode === "daily") return <DailyReport supabase={supabase} onBack={() => setMode("register")} cashCheckLogs={cashCheckLogs} />;
  if (mode === "monthly") return <MonthlyReport supabase={supabase} onBack={() => setMode("register")} />;

  if (mode === "tobacco") return (
    <div style={{ background: "#0d0905", minHeight: "100vh", color: "#f0e6d0", padding: 16 }}>
      {tobaccoConfirming && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#1c1208", border: "1px solid #3d2c14", borderRadius: 12, padding: 24, width: "90%", maxWidth: 400, maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 18, marginBottom: 4 }}>タバコ販売（現金のみ）</div>
            <div style={{ color: "#f0e6d0", fontSize: 15, marginBottom: 4 }}>{tobaccoConfirming.name}</div>
            <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 28, fontWeight: 800, marginBottom: 16 }}>¥{tobaccoConfirming.price}</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ color: "#8a7050", fontSize: 12 }}>受取金額（現金）</div>
                <button onClick={() => setTobaccoReceived("")} style={{ padding: "4px 10px", background: "#3d1010", border: "1px solid #c95a5a", borderRadius: 6, color: "#c95a5a", fontSize: 11, cursor: "pointer" }}>訂正</button>
              </div>
              <div style={{ fontSize: 28, fontFamily: "serif", color: tobaccoReceived ? "#f0e6d0" : "#3d2c14", marginBottom: 4 }}>¥{tobaccoReceived || "0"}</div>
              {tobaccoChange !== null && tobaccoChange >= 0 && (
                <div style={{ background: "#1a3020", border: "1px solid #2a6a3a", borderRadius: 8, padding: "10px 14px", marginBottom: 4 }}>
                  <span style={{ color: "#8a7050", fontSize: 12 }}>おつり </span>
                  <span style={{ color: "#4aaa5a", fontSize: 24, fontWeight: 800, fontFamily: "serif" }}>¥{tobaccoChange.toLocaleString()}</span>
                </div>
              )}
              {tobaccoChange !== null && tobaccoChange < 0 && <div style={{ color: "#c95a5a", fontSize: 13 }}>金額が足りません</div>}
              <Keypad value={tobaccoReceived} onChange={setTobaccoReceived} />
            </div>
            <div style={{ color: "#8a7050", fontSize: 12, marginBottom: 8 }}>書類</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {["レシート", "領収書", "なし"].map((r) => (
                <button key={r} onClick={() => setTobaccoReceiptType(r)}
                  style={{ flex: 1, padding: 10, background: tobaccoReceiptType === r ? "#c9952a" : "transparent", border: `1px solid ${tobaccoReceiptType === r ? "#c9952a" : "#3d2c14"}`, borderRadius: 8, color: tobaccoReceiptType === r ? "#0d0905" : "#8a7050", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {r}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setTobaccoConfirming(null); setTobaccoReceiptType(null); setTobaccoReceived(""); }}
                style={{ flex: 1, padding: 14, background: "transparent", border: "1px solid #3d2c14", borderRadius: 10, color: "#8a7050", cursor: "pointer" }}>戻る</button>
              <button onClick={completeTobaccoSale} disabled={!canTobaccoCheckout}
                style={{ flex: 2, padding: 14, background: canTobaccoCheckout ? "#2a6a3a" : "#3d2c14", border: "none", borderRadius: 10, color: canTobaccoCheckout ? "#fff" : "#8a7050", fontWeight: 700, fontSize: 16, cursor: canTobaccoCheckout ? "pointer" : "not-allowed" }}>
                ✅ 販売完了
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 18 }}>タバコ単体販売</div>
        <button onClick={() => setMode("register")} style={{ padding: "6px 14px", background: "transparent", border: "1px solid #3d2c14", borderRadius: 8, color: "#8a7050", cursor: "pointer" }}>戻る</button>
      </div>

      {TOBACCO.map((item) => (
        <div key={item.id} style={{ background: "#181008", border: "1px solid #3d2c14", borderRadius: 10, padding: 16, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#f0e6d0", fontSize: 15 }}>{item.name}</div>
            <div style={{ color: "#8a7050", fontSize: 13, marginTop: 2 }}>¥{item.price}</div>
          </div>
          <button onClick={() => openTobaccoConfirm(item)} style={{ padding: "10px 20px", background: "#c9952a", border: "none", borderRadius: 8, color: "#0d0905", fontWeight: 700, cursor: "pointer" }}>販売</button>
        </div>
      ))}

      {todayTobaccoFromDB.length > 0 && (
        <div style={{ background: "#181008", border: "1px solid #6a4d15", borderRadius: 12, padding: 20, marginTop: 20 }}>
          <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 18, fontWeight: 700, marginBottom: 14 }}>🚬 本日タバコ販売</div>
          {todayTobaccoFromDB.map((h, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 15, color: "#f0e6d0", padding: "8px 0", borderBottom: "1px solid #3d2c1433" }}>
              <span>{h.sale_time} {h.item_name}</span>
              <span style={{ color: "#c9952a", fontWeight: 700 }}>¥{h.price}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, paddingTop: 14, borderTop: "1px solid #6a4d15" }}>
            <span style={{ color: "#8a7050", fontSize: 14 }}>本日合計</span>
            <span style={{ color: "#c9952a", fontFamily: "serif", fontSize: 28, fontWeight: 800 }}>¥{todayTobaccoTotal.toLocaleString()}</span>
          </div>
        </div>
      )}

      <div style={{ background: "#181008", border: "1px solid #3d2c14", borderRadius: 12, padding: 20, marginTop: 16 }}>
        <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
          📅 {now.getMonth() + 1}月 銘柄別累計
        </div>
        {TOBACCO.map((item) => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #3d2c1433" }}>
            <span style={{ color: "#f0e6d0", fontSize: 13 }}>{item.name}</span>
            <div style={{ textAlign: "right" }}>
              <span style={{ color: "#8a7050", fontSize: 11, marginRight: 8 }}>{monthlyTobaccoByItem[item.name]?.count || 0}本</span>
              <span style={{ color: "#c9952a", fontWeight: 700 }}>¥{(monthlyTobaccoByItem[item.name]?.total || 0).toLocaleString()}</span>
            </div>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid #6a4d15" }}>
          <span style={{ color: "#8a7050", fontSize: 13 }}>月累計合計</span>
          <span style={{ color: "#c9952a", fontFamily: "serif", fontSize: 22, fontWeight: 800 }}>¥{monthlyTobaccoTotal.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0d0905", color: "#f0e6d0", fontFamily: "'Noto Sans JP', sans-serif" }}>
      <div style={{ background: "#333", color: "#fff", padding: "4px 12px", fontSize: 11 }}>{debugMsg}</div>

      {cashChecking && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#1c1208", border: "1px solid #3d2c14", borderRadius: 12, padding: 24, width: "90%", maxWidth: 400 }}>
            <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 18, marginBottom: 16 }}>💰 レジ金額確認</div>
            <div style={{ background: "#251a0a", borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "#8a7050" }}>釣り銭</span>
                <span style={{ color: "#f0e6d0" }}>¥50,000</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "#8a7050" }}>現金売上</span>
                <span style={{ color: "#f0e6d0" }}>¥{todayCashFromDB.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #3d2c14", paddingTop: 8 }}>
                <span style={{ color: "#f0e6d0", fontWeight: 700 }}>レジ内合計</span>
                <span style={{ color: "#c9952a", fontFamily: "serif", fontSize: 22, fontWeight: 800 }}>¥{(todayCashFromDB + 50000).toLocaleString()}</span>
              </div>
            </div>
            <div style={{ color: "#8a7050", fontSize: 12, marginBottom: 10 }}>確認者</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginBottom: 10 }}>
              {STAFF.map((s) => (
                <button key={s} onClick={() => { setCashCheckStaff(s); setShowOtherInput(false); setCashCheckOther(""); }}
                  style={{ padding: 12, background: cashCheckStaff === s && !showOtherInput ? "#c9952a" : "transparent", border: `1px solid ${cashCheckStaff === s && !showOtherInput ? "#c9952a" : "#3d2c14"}`, borderRadius: 8, color: cashCheckStaff === s && !showOtherInput ? "#0d0905" : "#8a7050", fontWeight: 700, cursor: "pointer" }}>
                  {s}
                </button>
              ))}
              <button onClick={() => { setShowOtherInput(true); setCashCheckStaff(null); }}
                style={{ padding: 12, background: showOtherInput ? "#c9952a" : "transparent", border: `1px solid ${showOtherInput ? "#c9952a" : "#3d2c14"}`, borderRadius: 8, color: showOtherInput ? "#0d0905" : "#8a7050", fontWeight: 700, cursor: "pointer" }}>
                その他
              </button>
            </div>
            {showOtherInput && (
              <input value={cashCheckOther} onChange={(e) => setCashCheckOther(e.target.value)} placeholder="名前を入力"
                style={{ width: "100%", padding: "10px 12px", background: "#251a0a", border: "1px solid #3d2c14", borderRadius: 8, color: "#f0e6d0", fontSize: 14, marginBottom: 10, boxSizing: "border-box" }} />
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button onClick={() => { setCashChecking(false); setCashCheckStaff(null); setCashCheckOther(""); setShowOtherInput(false); }}
                style={{ flex: 1, padding: 14, background: "transparent", border: "1px solid #3d2c14", borderRadius: 10, color: "#8a7050", cursor: "pointer" }}>キャンセル</button>
              <button onClick={confirmCashCheck} disabled={!cashCheckStaff && !cashCheckOther}
                style={{ flex: 2, padding: 14, background: (cashCheckStaff || cashCheckOther) ? "#2a6a3a" : "#3d2c14", border: "none", borderRadius: 10, color: (cashCheckStaff || cashCheckOther) ? "#fff" : "#8a7050", fontWeight: 700, fontSize: 16, cursor: (cashCheckStaff || cashCheckOther) ? "pointer" : "not-allowed" }}>
                ✅ 確認完了
              </button>
            </div>
          </div>
        </div>
      )}

      {confirming && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
          <div style={{ background: "#1c1208", border: "1px solid #3d2c14", borderRadius: 12, padding: 24, width: "90%", maxWidth: 400, maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 20, marginBottom: 4 }}>テーブル {selected} 会計</div>
            <div style={{ color: "#8a7050", fontSize: 13, marginBottom: 12 }}>{selectedPeople}名</div>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ color: "#8a7050" }}>お会計合計</span>
              <span style={{ fontFamily: "serif", fontSize: 28, fontWeight: 800, color: "#c9952a" }}>¥{selectedTotal.toLocaleString()}</span>
            </div>
            <button onClick={addDiscount}
              style={{ width: "100%", padding: 10, background: "#1a3020", border: "1px solid #2a6a3a", borderRadius: 8, color: "#4aaa5a", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 14 }}>
              セット値引き -150円 を追加
            </button>
            <div style={{ color: "#8a7050", fontSize: 12, marginBottom: 8 }}>支払い方法</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {["現金", "ペイキャス"].map((p) => (
                <button key={p} onClick={() => { setPayMethod(p); setReceivedAmount(""); }}
                  style={{ flex: 1, padding: 12, background: payMethod === p ? "#c9952a" : "transparent", border: `1px solid ${payMethod === p ? "#c9952a" : "#3d2c14"}`, borderRadius: 8, color: payMethod === p ? "#0d0905" : "#8a7050", fontWeight: 700, cursor: "pointer" }}>
                  {p}
                </button>
              ))}
            </div>
            {payMethod === "現金" && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ color: "#8a7050", fontSize: 12 }}>受取金額</div>
                  <button onClick={() => setReceivedAmount("")} style={{ padding: "4px 10px", background: "#3d1010", border: "1px solid #c95a5a", borderRadius: 6, color: "#c95a5a", fontSize: 11, cursor: "pointer" }}>訂正</button>
                </div>
                <div style={{ fontSize: 28, fontFamily: "serif", color: receivedAmount ? "#f0e6d0" : "#3d2c14", marginBottom: 4 }}>¥{receivedAmount || "0"}</div>
                {change !== null && change >= 0 && (
                  <div style={{ background: "#1a3020", border: "1px solid #2a6a3a", borderRadius: 8, padding: "10px 14px", marginBottom: 4 }}>
                    <span style={{ color: "#8a7050", fontSize: 12 }}>おつり </span>
                    <span style={{ color: "#4aaa5a", fontSize: 24, fontWeight: 800, fontFamily: "serif" }}>¥{change.toLocaleString()}</span>
                  </div>
                )}
                {change !== null && change < 0 && <div style={{ color: "#c95a5a", fontSize: 13, marginBottom: 4 }}>金額が足りません</div>}
                <Keypad value={receivedAmount} onChange={setReceivedAmount} />
              </div>
            )}
            <div style={{ color: "#8a7050", fontSize: 12, marginBottom: 8 }}>書類</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {["レシート", "領収書", "なし"].map((r) => (
                <button key={r} onClick={() => setReceiptType(r)}
                  style={{ flex: 1, padding: 10, background: receiptType === r ? "#c9952a" : "transparent", border: `1px solid ${receiptType === r ? "#c9952a" : "#3d2c14"}`, borderRadius: 8, color: receiptType === r ? "#0d0905" : "#8a7050", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {r}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setConfirming(false); setPayMethod(null); setReceiptType(null); setReceivedAmount(""); }}
                style={{ flex: 1, padding: 14, background: "transparent", border: "1px solid #3d2c14", borderRadius: 10, color: "#8a7050", cursor: "pointer" }}>戻る</button>
              <button onClick={checkout} disabled={!canCheckout}
                style={{ flex: 2, padding: 14, background: canCheckout ? "#2a6a3a" : "#3d2c14", border: "none", borderRadius: 10, color: canCheckout ? "#fff" : "#8a7050", fontWeight: 700, fontSize: 16, cursor: canCheckout ? "pointer" : "not-allowed" }}>
                ✅ 会計完了
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ width: 180, background: "#181008", borderRight: "1px solid #3d2c14", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 10px", borderBottom: "1px solid #3d2c14" }}>
            <div style={{ fontFamily: "serif", fontSize: 12, color: "#c9952a", fontWeight: 700 }}>Lounge Cattleya</div>
            <div style={{ fontSize: 9, color: "#8a7050", marginTop: 2 }}>レジ・会計</div>
          </div>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #3d2c14" }}>
            <div style={{ fontSize: 9, color: "#8a7050" }}>使用中</div>
            <div style={{ fontFamily: "serif", fontSize: 20, color: "#c9952a", fontWeight: 700 }}>{occupiedTables.length}<span style={{ fontSize: 10, color: "#8a7050" }}> / 30</span></div>
          </div>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #3d2c14" }}>
            <div style={{ fontSize: 9, color: "#8a7050" }}>本日売上</div>
            <div style={{ fontFamily: "serif", fontSize: 14, color: "#c9952a", fontWeight: 700 }}>¥{todaySales.toLocaleString()}</div>
          </div>
          <div style={{ padding: "6px 8px", borderBottom: "1px solid #3d2c14", display: "flex", flexDirection: "column", gap: 4 }}>
            <button onClick={() => setMode("tobacco")} style={{ padding: "6px 0", background: "#251a0a", border: "1px solid #3d2c14", borderRadius: 6, color: "#c9952a", fontSize: 10, cursor: "pointer" }}>🚬 タバコ販売</button>
            <button onClick={() => setMode("daily")} style={{ padding: "6px 0", background: "#251a0a", border: "1px solid #3d2c14", borderRadius: 6, color: "#c9952a", fontSize: 10, cursor: "pointer" }}>📊 日計</button>
            <button onClick={() => setMode("monthly")} style={{ padding: "6px 0", background: "#251a0a", border: "1px solid #3d2c14", borderRadius: 6, color: "#c9952a", fontSize: 10, cursor: "pointer" }}>📅 月次</button>
            <button onClick={() => setCashChecking(true)} style={{ padding: "6px 0", background: "#1a2510", border: "1px solid #2a6a3a", borderRadius: 6, color: "#4aaa5a", fontSize: 10, cursor: "pointer" }}>💰 レジ確認</button>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "6px 8px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>
              {TABLES.map((t) => {
                const occ = tableOrders(t).length > 0;
                return (
                  <div key={t} onClick={() => occ && setSelected(t)}
                    style={{ padding: "6px 0", borderRadius: 5, border: `1px solid ${selected === t ? "#c9952a" : occ ? "#6a4d15" : "#3d2c14"}`, background: selected === t ? "#2a1c0a" : occ ? "#1a1008" : "#0d0905", color: selected === t ? "#c9952a" : occ ? "#8a6030" : "#3d2c14", textAlign: "center", fontSize: 11, fontWeight: 700, cursor: occ ? "pointer" : "default" }}>
                    {t}
                  </div>
                );
              })}
            </div>
          </div>
          {history.length > 0 && (
            <div style={{ padding: "6px 10px", borderTop: "1px solid #3d2c14", maxHeight: 120, overflow: "auto" }}>
              <div style={{ fontSize: 9, color: "#8a7050", marginBottom: 4 }}>会計済み</div>
              {history.map((h, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#8a7050", padding: "2px 0" }}>
                  <span>T{h.table} {h.time}</span>
                  <span style={{ color: "#c9952a" }}>¥{h.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

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
    </div>
  );
}
