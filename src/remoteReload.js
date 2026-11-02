// 遠隔更新：印刷アプリの「📱 アプリを最新にする」ボタンで、注文アプリ・厨房アプリを読み直す
// announcements テーブルの id=3 の updated_at が変わったら「更新の合図」とみなす
// （id=1 はホール用お知らせ、id=2 は厨房メッセージ）
import { useEffect, useRef } from "react";

const RELOAD_ID = 3;

// canReload: 今読み直してよいか（入力中などは false を返す）
// appName: "order" / "kitchen"（読み直したあとの表示に使う）
export function useRemoteReload(supabase, canReload, appName) {
  const baselineRef = useRef(undefined); // 開いたときの合図の値
  const pendingRef = useRef(false);      // 更新の合図が来ているか
  const canReloadRef = useRef(canReload);
  canReloadRef.current = canReload;

  useEffect(() => {
    let alive = true;

    const tryReload = () => {
      if (!pendingRef.current) return;
      if (document.visibilityState !== "visible") return;
      let ok = true;
      try { ok = canReloadRef.current ? canReloadRef.current() : true; } catch (e) { ok = true; }
      if (!ok) return;
      try { sessionStorage.setItem("remote_reloaded_" + appName, "1"); } catch (e) {}
      window.location.reload();
    };

    const check = async () => {
      try {
        const { data, error } = await supabase
          .from("announcements").select("updated_at").eq("id", RELOAD_ID).limit(1);
        if (!alive || error) return;
        const v = String(data?.[0]?.updated_at || "");
        if (baselineRef.current === undefined) { baselineRef.current = v; return; }
        if (v !== baselineRef.current) { pendingRef.current = true; tryReload(); }
      } catch (e) {}
    };

    check();

    const channel = supabase.channel("remote_reload_" + appName)
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, (payload) => {
        if (payload.new?.id === RELOAD_ID) check();
      })
      .subscribe();

    const ivCheck = setInterval(check, 30000);   // 30秒ごとに合図を確認
    const ivTry = setInterval(tryReload, 5000);  // 入力が終わったら5秒以内に読み直す
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("pageshow", onVisible);

    return () => {
      alive = false;
      clearInterval(ivCheck);
      clearInterval(ivTry);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("pageshow", onVisible);
      supabase.removeChannel(channel);
    };
  }, []);
}

// 遠隔更新で読み直した直後かどうか（1回だけ true を返す）
export function takeRemoteReloaded(appName) {
  try {
    const k = "remote_reloaded_" + appName;
    const v = sessionStorage.getItem(k) === "1";
    if (v) sessionStorage.removeItem(k);
    return v;
  } catch (e) { return false; }
}
