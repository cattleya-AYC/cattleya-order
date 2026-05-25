import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://zxdgiszrsmumjjxmvszb.supabase.co",
  "sb_publishable_LLIkeICkSI-IS-2xMKO9_A_I8MAo2IT"
);

const MENU = {
  コーヒー: [
    { id: 1, name: "コーヒー（HOT）", price: 650 },
    { id: 2, name: "アイスコーヒー", price: 650 },
    { id: 3, name: "アメリカン", price: 650 },
    { id: 4, name: "カフェ・オ・レ（HOT）", price: 750 },
    { id: 5, name: "アイスオ・レ", price: 750 },
    { id: 6, name: "ウィンナーコーヒー（HOT）", price: 750 },
    { id: 7, name: "アイスウィンナー", price: 750 },
  ],
  ストレート: [
    { id: 9, name: "トアルコ・トラジャ", price: 800 },
    { id: 10, name: "ブラジル", price: 700 },
    { id: 11, name: "マンデリン", price: 700 },
    { id: 12, name: "モカマタリ", price: 800 },
    { id: 13, name: "コロンビアスプレモ", price: 700 },
    { id: 14, name: "グアテマラ", price: 700 },
    { id: 15, name: "キリマンジャロ", price: 700 },
  ],
  紅茶: [
    { id: 21, name: "ホットレモンティ", price: 650 },
    { id: 22, name: "アイスレモンティ", price: 650 },
    { id: 23, name: "ホットミルクティ", price: 650 },
    { id: 24, name: "アイスミルクティ", price: 650 },
    { id: 25, name: "ホットウーロン茶", price: 650 },
    { id: 26, name: "アイスウーロン茶", price: 650 },
    { id: 27, name: "こんぶ茶（HOT）", price: 650 },
    { id: 28, name: "梅こん茶（HOT）", price: 650 },
  ],
  ジュース: [
    { id: 31, name: "ホットミルク", price: 650 },
    { id: 32, name: "アイスミルク", price: 650 },
    { id: 33, name: "ホットココア", price: 800 },
    { id: 34, name: "アイスココア", price: 800 },
    { id: 35, name: "トマトジュース", price: 700 },
    { id: 36, name: "リンゴジュース", price: 700 },
    { id: 37, name: "オレンジジュース", price: 700 },
    { id: 38, name: "バナナジュース", price: 750 },
    { id: 39, name: "レモンジュース", price: 800 },
    { id: 40, name: "レモンスカッシュ", price: 800 },
    { id: 41, name: "コカ・コーラ", price: 650 },
    { id: 42, name: "ジンジャーエール", price: 650 },
    { id: 43, name: "ソーダ水", price: 650 },
    { id: 44, name: "カルピス", price: 650 },
    { id: 45, name: "野菜ジュース", price: 750 },
    { id: 46, name: "グアバドリンク", price: 800 },
    { id: 47, name: "マンゴードリンク", price: 800 },
    { id: 48, name: "コーヒーフロート", price: 750 },
    { id: 49, name: "ソーダフロート", price: 750 },
  ],
  フード: [
    { id: 51, name: "トースト", price: 600 },
    { id: 52, name: "ピザトースト", price: 850 },
    { id: 53, name: "ミックスサンド", price: 850 },
    { id: 54, name: "ハムサンド", price: 850 },
    { id: 55, name: "野菜サンド", price: 850 },
    { id: 56, name: "玉子サンド", price: 850 },
    { id: 57, name: "ミックストーストサンド", price: 950 },
    { id: 58, name: "ハムトーストサンド", price: 950 },
    { id: 59, name: "たまごトーストサンド", price: 950 },
    { id: 60, name: "セット割（-200円）", price: -200 },
  ],
  スイーツ: [
    { id: 61, name: "ミルククレープ", price: 500 },
    { id: 62, name: "リンゴタルト", price: 600 },
    { id: 63, name: "北海道チーズケーキ", price: 500 },
    { id: 64, name: "渋皮栗モンブラン", price: 500 },
    { id: 65, name: "チョコレートケーキ", price: 500 },
    { id: 66, name: "マロンケーキ", price: 500 },
    { id: 67, name: "紅茶シフォン", price: 600 },
    { id: 68, name: "コーヒーゼリー", price: 750 },
    { id: 69, name: "バニラアイスクリーム", price: 750 },
  ],
  おかわり: [
    { id: 91, name: "コーヒー おかわり（HOT）", price: 300 },
    { id: 92, name: "コーヒー おかわり（ICE）", price: 300 },
    { id: 93, name: "レモンティ おかわり（HOT）", price: 300 },
    { id: 94, name: "レモンティ おかわり（ICE）", price: 300 },
    { id: 95, name: "ミルクティ おかわり（HOT）", price: 300 },
    { id: 96, name: "ミルクティ おかわり（ICE）", price: 300 },
    { id: 97, name: "ウーロン茶 おかわり（HOT）", price: 300 },
    { id: 98, name: "ウーロン茶 おかわり（ICE）", price: 300 },
  ],
  アルコール: [
    { id: 81, name: "オールド水割り", price: 750 },
    { id: 82, name: "バドワイザー", price: 800 },
  ],
};

const CAKES = ["ミルククレープ","リンゴタルト","北海道チーズケーキ","渋皮栗モンブラン","チョコレートケーキ","マロンケーキ","紅茶シフォン"];
const CAKE_DRINKS = ["コーヒー（HOT）","アイスコーヒー","ホットレモンティ","アイスレモンティ","ホットミルクティ","アイスミルクティ"];

const TABLES = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,"A","B","C","D","E","F","G","H","I","J","K","L","M","N","O"];

export default function App() {
  const [screen, setScreen] = useState("table");
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeCat, setActiveCat] = useState("コーヒー");
  const [cart, setCart] = useState([]);
  const [sent, setSent] = useState(false);
  const [cakeModal, setCakeModal] = useState(false);
  const [selectedCake, setSelectedCake] = useState(null);

  const addItem = (item) => {
    if (item.name === "ケーキセット") { setCakeModal(true); return; }
    setCart((prev) => {
      const ex = prev.find((c) => c.id === item.id);
      if (ex) return prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeItem = (id) => setCart((prev) => prev.filter((c) => c.id !== id));

  const addCakeSet = (drink) => {
    const name = `ケーキセット（${selectedCake}＋${drink}）`;
    setCart((prev) => [...prev, { id: Date.now(), name, price: 1000, qty: 1 }]);
    setCakeModal(false);
    setSelectedCake(null);
  };

  const sendOrder = async () => {
    for (const item of cart) {
      await supabase.from("orders").insert({
        table_no: String
