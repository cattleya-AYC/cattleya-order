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

// =========================================================
// 音声読み上げ
// =========================================================
function speakAmount(amount) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(
      `ありがとうございます。${amount.toLocaleString()}円になります。`
    );
    utter.lang = "ja-JP";
    utter.rate = 0.9;
    utter.pitch = 1.1;
    utter.volume = 1.0;
    synth.speak(utter);
  } catch (e) {}
}

// =========================================================
// 通し番号
// =========================================================
function getNextCouponNo() {
  try {
    const key = "cattleya_coupon_no";
    const n = parseInt(localStorage.getItem(key) || "10000") + 1;
    localStorage.setItem(key, String(n));
    return String(n);
  } catch (e) {
    return "10001";
  }
}

function buildCouponHTML() {
  const no = getNextCouponNo();
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`;
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><style>
  html,body{margin:0;padding:0;}
  body{font-family:'Hiragino Mincho ProN',serif;width:384px;padding:6px 8px;box-sizing:border-box;color:#000;text-align:center;}
  .date{font-size:20px;font-weight:700;text-align:right;margin-bottom:4px;}
  .img{width:100%;height:auto;display:block;margin:0 auto 4px;}
  .hr{border:none;border-top:1px dashed #000;margin:6px 0;}
  .no{font-size:28px;font-weight:900;margin:6px 0;letter-spacing:6px;}
  </style></head><body>
    <div class="date">発行日：${dateStr}</div>
    <img class="img" src="${COUPON_IMG}"/>
    <hr class="hr"/>
    <div class="no">No. A${no}</div>
    <hr class="hr"/>
  </body></html>`;
}

function getNextReceiptNo() {
  try {
    const key = "cattleya_receipt_no";
    const n = parseInt(localStorage.getItem(key) || "10031210") + 1;
    localStorage.setItem(key, String(n));
    return String(n).padStart(9, "0");
  } catch (e) {
    return String(Date.now()).slice(-9);
  }
}

// =========================================================
// PassPRNT 用レシートHTML生成（mPOP 約48mm印字 / mm基準）
// =========================================================
const RECEIPT_LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYAAAACMAQAAAABdCUPdAAAFk0lEQVR42u2YTYgkZx3Gf9VVO1WrY6YCghOI00UMuJeFBnNYMGQqK6gHDx486+BB9qC4rAEVYuZdAmYDYnIMJLCDCDkIIiioB3dqVmT3IMyKnye31CG7hxBrZvNRPft2PR7qq6u7Zmf7kJPzwkxXd9XzPv+v9/0/9TpisTHgBHAC+D8B3Dwe4EwvIJ2yizFcHy3GIPf9YCGG4pFsMadttmCUxqSLAQ4WzcNeESyYuCJfDBDki5aGFy0IWDSsBAsAXgUg7H0m6QM8tx92TDPsNw6FfYCz4SWaRO87DgQlYBxMnusDBP7Ffpu9Q9Z6nV71TR7OhGkPcDfPb80DdOEL6VLSeLeicpVMQmAjXpoHFK+DQ+NECAZg9QAIL5+bB9iifHoqETvBTugNgKAvrC+PzXS4E8ZRtGlxPbi+RN7j9BKQEVWYHaehyofP9mX6h+UX06YoCgEMrF7n1jzgtAFWA7ZmknCBW0szJTaYrrq4+nFdzeIOHNPn9EsGsIniBhgDISEJ58sQdwEZQKhiXN9L6wvDU+opvhgHivD5L15pKzYBmIwIimgeEJFGwDg5bG4MEwvUf/PFN/wJwdWDq7crU3aqn+/GkMfzgA8Mn41dq2htOrARbEE3DXi1b+4tBm/HzlSB54ARJJ0oIUnak3THfveKdEOSVLiS0k3ljlQ4mh6lScsGHoWX4fEO8ZUBHM60QUlSti7Z4tufku5JkqwvKdG7+FLm9jCspODGK2/DqXJ9BECCxyqEy31hvQAkRVjbko+AF/HYYDyzWVWAp+s4loWTxSAPMHhEPT4o07aKi5LyFUnakWSHKnzJdoNU+cByDPwJ8H8D8HlgbwPnezBYoo9B/rYe8SXpjqRCkm5XdzZ7Gfi+uT0KqErNqR3qGxUwW7/GuiNpXw8eNcMyRcIkAP8h+4ON8XB+C545BlExpWvBYyuyQxXrD2fSm1/Pn7iE+1OcFHbM8QwrSfqZy9K+dFVK/GMZNBquxZ+Aj8VFBhxS/zuKwb6wnn/wxrZ0o/ClxJFknF6GCpBbZXpjW/qPfi8ZVxJdQDrsmDR+j30ODTxGV8bFAGPHcaKsk4eDv5GyBbjNtmEAtBP2J27vJufL1baxBMZrJOFRmQ5CjdQKsokTzz2ZdwBfTv99lsKMq2nt0WKuAnzSRD+PYzxzZPhn+rTFhySzjQbKjmH4nMZ//aoX50zihyrv4puHq984o4/fS9zdJ6ddPApg7+Z40WDyJFTK0j4Y4Ixe/dn2WbMapFe/0mRa5uji27en//va5WsTGb5TChNXBlcSK5IyqgtJZU4HdsTG6d+JmB+1c03qi49qqoNLku6kuX/AM1a6r5YBv5k4W6NbrW8SumaqMdTqvZZZYdF1+s5rjP5yqe7gOZtV+cUA/ywTGXXyEN3/RULb8pv+3qhQ22X4VbI0zvyWoRPGTQN4tRApAS43fm06W1grmA5JwNyvZytt/RKANdf6k5tOW1nvSzc/Pc7XbLXeHbGiBBgKP8WXjP+vmZ3v73/0/jE/dwRsleaFs0I34F7rQ5m7TkV9pCsdiHG+9c7X2rlDwHrl/hdOPzhoBP3uLy/OrCo3iWvDTDCnvYt3J3V2mg3gXFcKdgH3X3i8EYPeW+Vn2Y0c0wc4Y5OB06TYVpVjqkcmrRyoAYcH8VGv78udBes1+pTCdHP74KZ46qn4D81mFEDc9ukR3G2/1QDnLT1R0z1NMi1ukw6j175Z/bkuUbf7Tj+jCuoOU9jh7itNX0JK3fLKl5SzOdt24QcbbeySqb5wDvCmTGwYHtXusGlobs2QsKmOsmwAekm7jQiwfg2wpUR8sQcg/biVRq+o3KLqcUPzPkDRXl6c2aLO9B9THC0xwl7A6UVPHd7/UM6Xpg9z0mhBwMmx3QngBHACOAH0jv8BaGjWDnzIexUAAAAASUVORK5CYII=";
const COUPON_IMG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYAAAAE/AQAAAABnICmyAAAPSUlEQVR42u2bf4wc5XnHP+/s+HZsnb1rQsNCDu+EpCZKQrJNG9UpjnecVCVCVHHTP0IbJK6EFv5qnYBamtjsa5uA26JyIa0KEbVXLUpVRVQWilpoA54zLjkkwm0AtdACHttH7ygEz9mHPbuenad/zP6Y2R93e22TNJXnjzvf7H7neZ73fZ7v82NeK2F1l8EFwKiA/CoBEqwSEL21SkDzf81odxjASt8MaToAkh8CaKTvNccwHBzY6PQDTACi9EPGAHbAY4NWT0Tk5OPSc7kZ+d45mZf+ywAwzdQzgjr2R7ADCv4QG7x0FNUtnT1CwWs6wwDWp3TynhVofKhlPG/YskapBc8qMKGK1kMAbiZ9MwAQuNEZAgjwem4WFmg4NIZJyJP+xAeXuqY+qi/NwRQXIc8PB6TX7yXEZhyuGw5IWSdVIpcpVIkhrvENmU3uflPkvAy7jMFSzeUDyPdXGXG/8iPnpWC1vPS+IB2B9RUAGmAx3oomwIK9LKBejYCpo9AG5xeWA4g1txFkX4vNdJt1Ftu7f7QH0Mg8MRbS2BroDiDetpbLN7f1AOoPbdGWG0waPTRnxXrVTekBGJNjf03+9GQmEURWW4woi3SwGHIxyoeTGDsB1EoMa0TAP2qe7v+eNWSVArDh3nZMSG/gV3oArwPrj0gBlgA4XUt+rMjpHpVOABF2CTbFDJ8mYO1LDwcdFJHgL7dWROoiZzzIiIQ5af2QWQmz6YjzAZMlDSY0+5yoRJg23tgCGK4fUx0wZrapD6jCotPj++fmj0n0q2ubImFFAlSUEwkpxyoVRfx8JaUS58TLSC57UkTKEpCNAbEhUVkkoIc1QjZ9XOvCVpUHzFw7zQH5OJNl+uJBfTsvzenKG4Dxe/GXxmP/CR1gomcZzohEP//01RmRg0WRKBfmRMINlCUsil8RCYpplcwxUA82mlthR5edlD4I4A+i+4yGK6sfciHvAPm4sokd6vgg74tyIuHDORGReZGwGBZFwpxflLAoGelXyVB3QGZXaZBrC0Bg967SDUC17dOhHXbpqTGIkk02AKUy4HuF7nNsILAGBlDWbCWg52cgcLABlAvU8oDv9ALGDMR2IPjXQz0Pc+yBEtRrRGM1+MG3AF9346eJA3i6zzXy8IEA+f0nnTRpLCk9mFvXEMplRM+8rsE73tXZHwOYHpDPyuucnM3jVwBH8nbPZuztBxhHDH8ham6ZAO6yEoVfCRCzHxA5gVZf/s+sB2KZiR1yBtKZSHD4sdcm3KyISFiMaBNGqOI7PXnahPrh85uNavwkW6l0qRja/RJONM+89touEREJKqI6lFQUEfEHVAKvR4SLRzRAXSfycBXghQH7cDT0n2xx+hg81EneThzd/Spdcmr+gdmDRRntQqR8bP6iU8cOjggwEMee94PR6xMJj8l9H77l1OzIEkKPqc8RjF5rKC2XR24+GBlQdyJnejK0R7bhtARffPD1MydbOhafWXxo/hmvcvrOcEPmPvfktkqvDadZmPrwVVY7begXjJumXryEJntKMzs2551+G/Be/Ifn9ibvuIZor2IoE1lT6QO8wrR94EG329VoJi9ttAqAUPV2WgbrRL+inrrRSgBKr2fhfBxF0ifBbPzxzA+ff7QTmZHl2qAL+zRECumnmTf3F/jaS+0bt/5s8wne/wZr77jRe+zhfzt3tpYGKKl96cyajS9c9nRm1I2b3V9+6/1vvrqKMrSuG4cbh/TIALnCeuedzzurkDAX2Sezd40OiGbMc7v9gjMywJziho/nS6NKMMEO//yTWUYHCOeNAy8Xfji6DY4EBzWrWCUtuzMDCGsoICT7u1GN0VdJkb3q77X1Kmq5y073QCZRT4ndeyUAHwTuX1ETJyVh499i2stboVOAI39K3DIqd8K4dKo1ELKVBgdyPUbbsMeDABsMEH2vEl0mJzUDsn8TIqkuwcCEO81qa8j0hy5cDFzh1t/rwJb6pXlyqf7QoAAIhokFmTlXOBv3AHmoHKUE73GTzWwMNZy4Ahq7iNzvvIzSno1BZr1ZnIGg2t+LqlZvJU+zuH3aQIH6Z4DjFpRuSKb3jnILGLDmYogjIy+fYAxwUAffpxNDtHS3W1yC6WfjdVeMU8pVMVRJdze6C6ih4NUJss99mV3xXp0/M7O4GcWvD+un49yeM9hnQOY5/PUW2/Ph2Q3JIYORyvsAUQFLQ1NpIHfQZ50/UILTkmAYC80QUHcDLNpLoJO9n9EpzxHIeESRGWvQ8YZxj8TsJr1KTQve1SCKWoX0xIbJeKcHGh1BZgJso70AW894YKhxMzmKMZLTPXKicXQW8Aswvd4EiPaSyPtGegwVwqmdGIftZD98OYQ9c74OxkDZ98XtegMgUubaAcOc+PJgc2FXZsOmzD18SdvKZ5zcvGwonwGVrJc6w0AYK2wZ32CqkDIOHuOMfzGi7Cef2wOg1OVAh/HuH5UB4yIXGtRabTXgstT9Y5ANy/JSebmB1KDL6+bpC7P7UQFNpZRSzuiAsH/++JOzId7perd//lGqpP5nNhxXQ8r3uB2LzUn1Oqg4zoFyzDLZnnhICauTKHG9fpXKIhImAQuEVBlxyAxQzWXcBSjGUrK9ZNzXz4guYTeASSXiQoGK+INWye4Qs0tBOmMvuk1jGrB4AsRueaOJjssDK2bUzABATSCygSADRjvvmMM3brvnxK7uA6q9nEYyaaYAYuS9eMU8E9B+2mecPkAEEGjAtQYsXtivkmn5cXbSgzbH7gOEEHAcEPKAHfbWb12A7r1jJ19ATca/Jrof+4kC52jnm/nl4mG6bre0SgiT4YCmwwkIMNuinBUibqnj/pLv8JTVklZte3wCUOsMnyN7+ZySiIfailVx0uiyT4BFaIYOEAyv3FueqNxmS/Eg+Zk71OgxMq3F7x9oSmrA3gIUQMsQOotSpsQAbxKc+NXDiT7AUnfIm/IlOzaoV21RsYfsMVOlNJDHNcIgf9dI3LotDnUVYVurIGOPSq284iuhDvuGFMVTYTEoi/jEd8riKwmLIiEVyfYVJz6bNoX2zNEhSugBNKM8HKc5og0tlq1k3Z69TrFMXwbyI8t2+9u94SnreNgNnXCUHGcE9LxVHRIPXc7I9+1Ei2W2JACLuvuSBfwOX+thKtXa6UyshPMHwyPO6TSo+UEL2idBOg+LViwojASTJ5OcB/jGMEAU/8i3XoIsW3b0PCTQHUdspaEVAP7w9RwAsBOOFnTy1lBAiANtzrBDQOeHA8zWNh0lD3nIRyDYwwFWS/G27pZAlPDuMA0wKIGvAAvL91tlQ6g0+DJIgsIBz2if6LAhg8tCagXdlEraBdeECMzAcwA9gzcOeLGWC90giRusnETkRIKyRBkdN3V3UBRpdWRBtwuKAV5GAsoiQUVEx28F4m96fYBYpUJTz+DES+uMtd7CZZdhvrCvCpWAyrBRvIiIblWlI83uRUT8RGs3EkD0iALkx934zXCkaf9Zuzj2XaARphk2DXD596b7rWBpbqYBOx+oKA13yzISJuEOHxzDgq8/cj9vY3FZVF3Ohr2GZOLkX/q0Bvmc2PjLGx0Ahsa7snkrF8k+NXPu9AirpKVUyBR4O3T5xOK1KwHqNYXywQfDJnN+aSVA1icProTRRWjZfqm1PMAiPjykmeLtiDfWZLzlAHdGqgmRBVoskE9mqsu6xgz7a8Bb9+JPf8pQmF95z8PBoBKudX3zpkamei3+ejebfVkkbGRe+eiWph0MHoSIiJwTETl3Lj6Yc/Crb4vIbefnl3HvhcIq3XthxH76wuTkpxEw3X5lkB8R4CbDf1Uqhf9dG0Q53bOZi0brjcAKRifrafnFelrCOJazOdi2q3Oz0i4hgTMNol++p0elgoHaMdft43SCr82g34Zw4awlg/oqAMsk09tP5yl9JxVUUeIbeb9fQtY7fV28aUuNBrt7Sr4FCHv68436CnwiF/7jzTd365CwmYeyNONDptP6DQi8qqOrLYCNS16POfDUunVNxkB5QBSTVu2jcX9sO44jDgbgcjE+EeB4utE80Dq+qjiO5QP8AcDhWvNhIz7KA0vOb2BosMlLsIQfz2eOHpLf9KguYmoguv3EQ38yiQECFl9zozugSbTz3vGWSpQOyV/sgFzsn9EO5zs72wcP1k99BCxo0FzjwpzYMe8aWU9YjLdlzcPqutCLAfq9hdxUWIMlGpy5qS3BnwRwTkXxzgeu23aNySf9wwFzcM7edW/uQMvRTctPNMc0A/lAGAN8Fw/fA/7q7CIOuAZo8Le1WopQ++Au2N9do3vc2/mZ4loNVuDNVFETPwfAscwf1U/D7bfr601AuuO8VgV0uJ0KdsdpIor/OiaVVr3UiencaEcXuuE3EmtcyA8/pYDMg1d/dunvTr77ys6vs48cO//504+cfPc1H/q1ytWfPfvICwdu+cI1H7zvxQNvfvO3v3DNhZ3+fwGYa1e1zRaVFBzXJ0z+Bwmjv4q1ga878e8Jpgt7xqZNPaTQbSJrA4DyIVdX2Xtn1p7wLjlcPm8OlLAX6/T5RzkOZPa5wLf12KHesVQSUOGloJERIFzUnvuq/NPh0yW8iEV7IEDQ1v2mpg5Nh6o7F1lsd7BJJWozNfX8rvaRxtkflGdL4sw0vQggnMFebpUiFh1CIq5vDZMbE8P3wQnEMZcukabiHZmkZnzfnbOXNgwBxIMgzYKFMvS/oIGP7ZzwHrOaeogEzbqwSQ1Cos9EZA46CpvJsYw7EKCAyY0NqmBsr5SM3fySNtGkz+glJewDc8NDTRdMbTjclfkqPk4VmBkM2AWwUwB2KK2eYpwF4TOJQVhfQvHzfUNEjajkwdULvPRjA7iJ0aC3MqCGd9/FtYWWv/kzxsyQybqISCAi85FRPD87e828+JuKd5Krz/aeb+22AFvXAERT6+H7+8ePXhU9Wrr2nmVU+iThHKCWcLi7tuRmPaHB1FCAQMaOahgF4Oh+dvmEary3KEpH3F03n6Iut2Jy4hWoa0N+gc1DARGo/QHmngcIcXdaZI9cs+fZnv/k1bOs1/vvqhlP3MzTjIUhhd96/vKP8enlALZtoTJLfIUnCwKsNc7y+FBA/M8qh8fR7JkJ8XmLdb1vCNJGm4gDNxMQ1ZQRcJTblnENpRAz0jHfhD5QLYIOGOoa8xJl6/K9aKy4b/bZ7efEr2zblsk9NTtwMNgdnZyKbjk4Pzt9Jq6Kb5s9OfsTHQxeAFwA/F8G/BerVGWJXkW3egAAAABJRU5ErkJggg==";

function buildInvoiceHTML(info) {
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  const receiptNo = info.receiptNo || "000000000";
  const taxAmount = Math.round(info.amount / 11);
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><style>
  html,body{ margin:0; padding:0; }
  body{ font-family:'Hiragino Mincho ProN','Yu Mincho',serif; width:384px; margin:0; padding:0; box-sizing:border-box; color:#000; text-align:center; }
  .no{ text-align:right; font-size:22px; margin:6px 4px 0; }
  .ititle{ font-size:40px; font-weight:900; letter-spacing:7px; margin:8px 0 14px; }
  .logo{ width:100%; height:auto; display:block; margin:6px 0 34px; }
  .atena{ display:flex; align-items:baseline; justify-content:space-between; margin:14px 42px 2px 6px; gap:6px; border-bottom:2px solid #000; padding-bottom:2px; }
  .aspace{ flex:1; }
  .asama{ font-size:32px; white-space:nowrap; }
  .kingaku{ display:flex; align-items:flex-end; justify-content:space-between; margin:22px 6px 2px; gap:18px; }
  .klabel{ font-size:34px; font-weight:900; white-space:nowrap; }
  .kval{ flex:1; border-bottom:2px solid #000; font-size:34px; font-weight:900; text-align:center; padding-bottom:2px; }
  .ryos{ font-size:24px; font-weight:700; margin:10px 0 4px; line-height:1.7; }
  .tax{ font-size:24px; font-weight:700; margin:6px 0 16px; }
  .dt{ font-size:24px; font-weight:bold; margin:10px 0 6px; }
  .addr{ width:100%; height:auto; display:block; margin:6px 0 6px; }
  .inkan{ text-align:right; font-size:24px; margin:6px 30px 12px; }
  </style></head><body>
    <div class="no">伝票番号 No.${receiptNo}</div>
    <div class="ititle">領\u3000収\u3000書</div>
    <img class="logo" src="${RECEIPT_LOGO}"/>
    <div class="atena"><div class="aspace"></div><div class="asama">様</div></div>
    <div class="kingaku"><div class="klabel">金額</div><div class="kval">&#165;${info.amount.toLocaleString()}</div></div>
    <div class="ryos">但し　　　　　　　　　　　　<br>として上記正に領収いたしました</div>
    <div class="tax">（うち、消費税　&#165;${taxAmount.toLocaleString()}）</div>
    <br>
    <div class="dt">${dateStr}</div>
    <br><br>
    <img class="addr" src="${RECEIPT_ADDR}"/>
    <div class="inkan">印</div>
  </body></html>`;
}
const RECEIPT_ADDR = "data:image/png;base64,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";

function buildReceiptHTML(info) {
  if (info.receipt === "領収書") return buildInvoiceHTML(info);
  const isInvoice = info.receipt === "領収書";
  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日\u3000${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  const receiptNo = info.receiptNo || "000000000";
  const taxAmount = Math.round(info.amount / 11);
  const items = info.items || [];

  const itemRows = items.map(o => {
    const isDiscount = o.price < 0;
    const subtotal = isDiscount
      ? `&#8722;${Math.abs(o.price * o.qty).toLocaleString()}`
      : (o.price * o.qty).toLocaleString();
    return `<tr>
      <td style="text-align:left;padding:0.6mm 0;width:70%">${o.item_name}&nbsp;&nbsp;&#215;${o.qty}</td>
      <td style="text-align:right;padding:0.6mm 0;width:30%">${subtotal}</td>
    </tr>`;
  }).join("");

  const payRow = (info.pay === "現金" && info.received)
    ? `<tr><td style="text-align:left;padding:0.4mm 0">現金お預かり</td><td style="text-align:right">${(info.received).toLocaleString()}</td></tr>
       <tr><td style="text-align:left;padding:0.4mm 0">お\u3000釣\u3000り</td><td style="text-align:right">${(info.change||0).toLocaleString()}</td></tr>`
    : `<tr><td style="text-align:left;padding:0.4mm 0">ペイキャス</td><td style="text-align:right">\u2014</td></tr>`;

  return `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<style>
  html,body{ margin:0; padding:0; }
  body{ font-family:'Hiragino Mincho ProN','Yu Mincho',serif; width:384px; margin:0; padding:0; box-sizing:border-box; color:#000; text-align:center; font-size:22px; }
  .no{ text-align:right; font-size:19px; margin-bottom:4px; }
  .inv-title{ font-size:38px; font-weight:900; letter-spacing:12px; margin-bottom:6px; }
  .logo{ width:100%; height:auto; display:block; margin:4px 0 8px; }
  .addr{ width:100%; height:auto; display:block; margin:4px 0 10px; }
  .dt{ font-size:19px; font-weight:bold; margin:8px 0; }
  .atena{ text-align:right; font-size:48px; margin:8px 24px 4px; }
  .dline{ border:none; border-top:2px dotted #000; margin:8px 0 12px; }
  .sline{ border:none; border-top:4px solid #000; margin:12px 0; }
  table{ width:100%; border-collapse:collapse; }
  .items td{ font-size:26px; font-weight:700; padding:5px 0; }
  .total td{ font-size:38px; font-weight:900; padding:4px 0; }
  .tax{ font-size:22px; font-weight:700; color:#000; margin:5px 0 8px; }
  .pay td{ font-size:24px; font-weight:700; padding:5px 0; }
  .foot{ font-size:22px; font-weight:bold; margin-top:16px; }
</style></head><body>
  <div class="no">No.${receiptNo}</div>
  ${isInvoice ? '<div class="inv-title">領\u3000収\u3000書</div>' : ''}
  <img class="logo" src="${RECEIPT_LOGO}"/>
  <img class="addr" src="${RECEIPT_ADDR}"/>
  <div class="dt">${dateStr}</div>
  ${isInvoice ? '<div class="atena">\u6a19</div>' : ''}
  <hr class="dline"/>
  <table class="items">${itemRows}</table>
  <hr class="sline"/>
  <table class="total"><tr><td style="text-align:left">合\u3000計</td><td style="text-align:right">&#165;${info.amount.toLocaleString()}</td></tr></table>
  <div class="tax">\uff08内消費税10%対象\u3000${taxAmount.toLocaleString()}\uff09</div>
  <table class="pay">${payRow}</table>
  <div class="foot">ありがとうございました</div>
</body></html>`;
}

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

function PLUReport({ supabase, onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => { fetchItems(); }, [selectedMonth]);

  const fetchItems = async () => {
    setLoading(true);
    const [year, month] = selectedMonth.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    const { data } = await supabase
      .from("order_items")
      .select("*")
      .gte("sale_date", startDate)
      .lte("sale_date", endDate);
    setItems(data || []);
    setLoading(false);
  };

  // メニュー別集計
  const byItem = {};
  items.forEach(item => {
    if (item.price < 0) return; // 値引きは除外
    if (!byItem[item.item_name]) {
      byItem[item.item_name] = { qty: 0, total: 0, price: item.price };
    }
    byItem[item.item_name].qty += item.qty;
    byItem[item.item_name].total += item.price * item.qty;
  });

  // 売上順にソート
  const sorted = Object.entries(byItem).sort((a, b) => b[1].total - a[1].total);
  const grandTotal = sorted.reduce((a, [, v]) => a + v.total, 0);
  const grandQty = sorted.reduce((a, [, v]) => a + v.qty, 0);

  // カテゴリー分類
  const categories = {
    "コーヒー": ["コーヒー（HOT）", "アイスコーヒー", "アメリカン", "カフェ・オ・レ（HOT）", "アイスオ・レ", "ウィンナーコーヒー（HOT）", "アイスウィンナー"],
    "ストレート": ["トラジャ", "マンデリン", "モカ", "グァテマラ", "キリマンジェロ"],
    "紅茶": ["レモンティ（HOT）", "アイスレモンティ", "ミルクティ（HOT）", "アイスミルクティ", "ウーロン茶（HOT）", "アイスウーロン茶", "こんぶ茶（HOT）", "梅こん茶（HOT）"],
    "ジュース": ["ミルク（HOT）", "アイスミルク", "ココア（HOT）", "アイスココア", "トマトジュース", "リンゴジュース", "オレンジジュース", "バナナジュース", "レモンジュース", "レモンスカッシュ", "コカ・コーラ", "ジンジャーエール", "ソーダ水", "カルピス", "野菜ジュース", "グアバドリンク", "マンゴードリンク", "コーヒーフロート", "ソーダフロート"],
    "フード": ["トースト（バター＆ジャム）", "ピザトースト", "ミックスサンド", "ハムサンド", "野菜サンド", "玉子サンド", "トーストサンド（ミックス）", "トーストサンド（ハム）", "トーストサンド（たまご）"],
    "スイーツ": ["ミルクレープ", "ガトーショコラ", "フォンダンショコラ", "チーズケーキ", "紅茶のシフォン", "栗のモンブラン", "バニラアイスクリーム", "コーヒーゼリー"],
    "モーニング": ["モーニング（コーヒーHOT）", "モーニング（コーヒーICE）", "モーニング（紅茶HOT）", "モーニング（紅茶ICE）"],
    "おかわり": ["コーヒー おかわり（HOT）", "コーヒー おかわり（ICE）", "レモンティ おかわり（HOT）", "レモンティ おかわり（ICE）", "ミルクティ おかわり（HOT）", "ミルクティ おかわり（ICE）", "ウーロン茶 おかわり（HOT）", "ウーロン茶 おかわり（ICE）"],
    "アルコール": ["オールド（水割り）", "バドワイザー"],
    "その他": [],
  };

  const getCategory = (name) => {
    for (const [cat, items] of Object.entries(categories)) {
      if (items.includes(name)) return cat;
    }
    return "その他";
  };

  const byCategory = {};
  sorted.forEach(([name, data]) => {
    const cat = getCategory(name);
    if (!byCategory[cat]) byCategory[cat] = { items: [], total: 0, qty: 0 };
    byCategory[cat].items.push([name, data]);
    byCategory[cat].total += data.total;
    byCategory[cat].qty += data.qty;
  });

  return (
    <div style={{ background: "#0d0905", minHeight: "100vh", color: "#f0e6d0", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 18 }}>📋 PLU集計</div>
        <button onClick={onBack} style={{ padding: "6px 14px", background: "transparent", border: "1px solid #3d2c14", borderRadius: 8, color: "#8a7050", cursor: "pointer" }}>戻る</button>
      </div>

      <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
        style={{ width: "100%", padding: "10px 12px", background: "#251a0a", border: "1px solid #3d2c14", borderRadius: 8, color: "#f0e6d0", fontSize: 14, marginBottom: 16, boxSizing: "border-box" }} />

      {loading ? <div style={{ textAlign: "center", color: "#8a7050", paddingTop: 40 }}>読み込み中...</div> : (
        <>
          <div style={{ background: "#181008", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ color: "#8a7050", fontSize: 12 }}>総売上（値引除く）</span>
              <span style={{ color: "#c9952a", fontFamily: "serif", fontSize: 18, fontWeight: 700 }}>¥{grandTotal.toLocaleString()}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#8a7050", fontSize: 12 }}>総販売数</span>
              <span style={{ color: "#c9952a" }}>{grandQty}点</span>
            </div>
          </div>

          {Object.entries(byCategory).filter(([, d]) => d.items.length > 0).map(([cat, catData]) => (
            <div key={cat} style={{ background: "#181008", borderRadius: 10, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 14 }}>{cat}</div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ color: "#8a7050", fontSize: 11, marginRight: 8 }}>{catData.qty}点</span>
                  <span style={{ color: "#c9952a", fontSize: 13, fontWeight: 700 }}>¥{catData.total.toLocaleString()}</span>
                </div>
              </div>
              {catData.items.map(([name, data]) => (
                <div key={name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #3d2c1433" }}>
                  <span style={{ color: "#f0e6d0", fontSize: 12 }}>{name}</span>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ color: "#8a7050", fontSize: 11, marginRight: 8 }}>{data.qty}点</span>
                    <span style={{ color: "#c9952a", fontSize: 12 }}>¥{data.total.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {sorted.length === 0 && (
            <div style={{ textAlign: "center", color: "#3d2c14", paddingTop: 40, fontSize: 14 }}>データなし</div>
          )}
        </>
      )}
    </div>
  );
}

function DailyReport({ supabase, onBack, cashCheckLogs }) {
  const [sales, setSales] = useState([]);
  const [tobaccoSales, setTobaccoSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastPrintTime, setLastPrintTime] = useState(() => localStorage.getItem("cattleya_last_summary") || null);

  useEffect(() => { fetchAll(); }, []);

  const today = new Date().toISOString().split("T")[0];
  const drawerLogs = JSON.parse(localStorage.getItem(`cattleya_drawer_${today}`) || "[]");

  const fetchAll = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
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
  const todayCashCount = sales.filter(s => s.pay_method === "現金").length;
  const todayPayCount = sales.filter(s => s.pay_method === "ペイキャス").length;
  const todayReceiptCount = sales.filter(s => s.receipt_type === "領収書").length;
  const todayTax = Math.round(todayTotal / 11);
  const tobaccoTotal = tobaccoSales.reduce((a, s) => a + s.price, 0);

  // 時間帯別（件数＋金額）
  const groups = {};
  sales.forEach(s => {
    const raw = s.sale_time || "";
    const hour = raw.includes(":") ? raw.split(":")[0] : "不明";
    if (!groups[hour]) groups[hour] = { count: 0, amount: 0 };
    groups[hour].count += 1;
    groups[hour].amount += s.amount;
  });

  // PDF印刷
  const printPDF = () => {
    const today = new Date().toLocaleDateString("ja-JP");
    const hourRows = Object.entries(groups).sort().map(([h, g]) =>
      `<tr><td>${h}:00〜${Number(h)+1}:00</td><td style="text-align:right">${g.count}件</td><td style="text-align:right">¥${g.amount.toLocaleString()}</td></tr>`
    ).join("");
    const drawerRows = drawerLogs.map(t => `<tr><td>${t}</td><td>ドロアを開けました</td></tr>`).join("");
    const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<style>
  body{font-family:'Hiragino Mincho ProN',serif;background:#fff;color:#000;padding:20px;font-size:13px;}
  h2{text-align:center;font-size:18px;margin-bottom:4px;}
  .sub{text-align:center;font-size:12px;color:#555;margin-bottom:16px;}
  table{width:100%;border-collapse:collapse;margin-bottom:16px;}
  th{background:#f0f0f0;padding:6px;text-align:left;font-size:12px;border:1px solid #ccc;}
  td{padding:6px;border:1px solid #eee;font-size:13px;}
  .total{font-size:16px;font-weight:900;}
  .section{font-weight:700;margin:12px 0 4px;font-size:13px;border-bottom:1px solid #ccc;padding-bottom:4px;}
</style></head><body>
  <h2>ラウンジ カトレア　日計レポート</h2>
  <div class="sub">${today}　集計時刻: ${new Date().toLocaleTimeString("ja-JP", {hour:"2-digit",minute:"2-digit"})}</div>

  <div class="section">売上集計</div>
  <table>
    <tr><td>純売上（タバコ除く）</td><td class="total" style="text-align:right">¥${todayTotal.toLocaleString()}</td></tr>
    <tr><td>　内消費税10%</td><td style="text-align:right">¥${todayTax.toLocaleString()}</td></tr>
    <tr><td>現金合計（${todayCashCount}件）</td><td style="text-align:right">¥${todayCash.toLocaleString()}</td></tr>
    <tr><td>ペイキャス合計（${todayPayCount}件）</td><td style="text-align:right">¥${todayPay.toLocaleString()}</td></tr>
    <tr><td>領収書発行</td><td style="text-align:right">${todayReceiptCount}件</td></tr>
    <tr><td>来客組数</td><td style="text-align:right">${todayCount}組</td></tr>
    <tr><td>来客人数</td><td style="text-align:right">${todayPeople}名</td></tr>
    <tr><td>タバコ売上</td><td style="text-align:right">¥${tobaccoTotal.toLocaleString()}</td></tr>
  </table>

  <div class="section">時間帯別売上</div>
  <table>
    <tr><th>時間帯</th><th style="text-align:right">件数</th><th style="text-align:right">売上</th></tr>
    ${hourRows || "<tr><td colspan='3' style='color:#999'>データなし</td></tr>"}
  </table>

  ${drawerLogs.length > 0 ? `
  <div class="section">ドロア開閉履歴</div>
  <table>
    <tr><th>時刻</th><th>内容</th></tr>
    ${drawerRows}
  </table>` : ""}
</body></html>`;

    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 400);
  };

  // mPOP 集計レシート印刷
  const printSummary = () => {
    const now = new Date();
    const timeStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    const summaryNo = parseInt(localStorage.getItem("cattleya_summary_no") || "0") + 1;
    localStorage.setItem("cattleya_summary_no", String(summaryNo));
    localStorage.setItem("cattleya_last_summary", timeStr);
    setLastPrintTime(timeStr);

    const hourRows = Object.entries(groups).sort().map(([h, g]) =>
      `<tr><td>${h}:00〜${Number(h)+1}:00</td><td style="text-align:right">${g.count}件</td><td style="text-align:right">¥${g.amount.toLocaleString()}</td></tr>`
    ).join("");

    const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><style>
      body{font-family:'Hiragino Mincho ProN',serif;width:384px;margin:0;padding:4px 6px;font-size:28px;font-weight:700;color:#000;}
      .title{text-align:center;font-size:28px;font-weight:900;margin:4px 0 2px;}
      .sub{text-align:center;font-size:28px;font-weight:700;margin-bottom:8px;}
      .hr{border:none;border-top:1px solid #000;margin:6px 0;}
      table{width:100%;border-collapse:collapse;font-size:28px;}
      td{padding:6px 2px;font-size:28px;font-weight:700;}
      .total{font-size:28px;font-weight:900;}
      .lbl{color:#000;font-size:28px;font-weight:700;}
    </style></head><body>
      <div class="title">ラウンジ カトレア</div>
      <div class="sub">日計集計レシート</div>
      <div class="lbl" style="text-align:right">精算 No.${String(summaryNo).padStart(6,"0")}</div>
      <div class="lbl" style="text-align:right">${timeStr}</div>
      <hr class="hr"/>
      <div style="margin:4px 0;font-size:18px">時間帯別</div>
      <table>${hourRows}</table>
      <hr class="hr"/>
      <table>
        <tr class="total"><td>総売上</td><td style="text-align:right">¥${todayTotal.toLocaleString()}</td></tr>
        <tr><td class="lbl">現金（${todayCashCount}件）</td><td style="text-align:right;font-size:28px;font-weight:700">¥${todayCash.toLocaleString()}</td></tr>
        <tr><td class="lbl">ペイキャス（${todayPayCount}件）</td><td style="text-align:right;font-size:28px;font-weight:700">¥${todayPay.toLocaleString()}</td></tr>
        <tr><td class="lbl">内消費税10%</td><td style="text-align:right;font-size:28px;font-weight:700">¥${todayTax.toLocaleString()}</td></tr>
        <tr><td class="lbl">領収書発行</td><td style="text-align:right;font-size:28px;font-weight:700">${todayReceiptCount}件</td></tr>
        <tr><td class="lbl">来客組数</td><td style="text-align:right;font-size:28px;font-weight:700">${todayCount}組</td></tr>
        <tr><td class="lbl">来客人数</td><td style="text-align:right;font-size:28px;font-weight:700">${todayPeople}名</td></tr>
        <tr><td class="lbl">🚬 タバコ</td><td style="text-align:right;font-size:28px;font-weight:700">¥${tobaccoTotal.toLocaleString()}</td></tr>
      </table>
      <hr class="hr"/>
      <div style="text-align:center;font-size:28px;font-weight:700;color:#000">ありがとうございました</div>
    </body></html>`;

    const url = "starpassprnt://v1/print/nopreview?back=" + encodeURIComponent(window.location.href) + "&html=" + encodeURIComponent(html);
    window.location.href = url;
  };

  return (
    <div style={{ background: "#0d0905", minHeight: "100vh", color: "#f0e6d0", padding: 16 }}>
      {/* ヘッダー */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 18 }}>📊 日計</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={printSummary} style={{ padding: "6px 12px", background: "#c9952a", border: "none", borderRadius: 8, color: "#0d0905", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>🖨 集計印刷（レシート）</button>
          <button onClick={printPDF} style={{ padding: "6px 12px", background: "#1a2510", border: "1px solid #2a6a3a", borderRadius: 8, color: "#4aaa5a", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>🖨 PDF印刷</button>
          <button onClick={fetchAll} style={{ padding: "6px 12px", background: "transparent", border: "1px solid #3d2c14", borderRadius: 8, color: "#8a7050", cursor: "pointer", fontSize: 11 }}>更新</button>
          <button onClick={onBack} style={{ padding: "6px 12px", background: "transparent", border: "1px solid #3d2c14", borderRadius: 8, color: "#8a7050", cursor: "pointer" }}>戻る</button>
        </div>
      </div>
      {lastPrintTime && <div style={{ color: "#8a7050", fontSize: 11, marginBottom: 8 }}>最終集計印刷: {lastPrintTime}</div>}

      {loading ? <div style={{ textAlign: "center", color: "#8a7050", paddingTop: 40 }}>読み込み中...</div> : (
        <>
          {/* メイン集計 */}
          <div style={{ background: "#181008", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 14, marginBottom: 10 }}>{new Date().toLocaleDateString("ja-JP")} 本日集計</div>
            {[
              ["現金合計", `¥${todayCash.toLocaleString()}（${todayCashCount}件）`],
              ["ペイキャス合計", `¥${todayPay.toLocaleString()}（${todayPayCount}件）`],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "#8a7050" }}>{label}</span>
                <span style={{ color: "#c9952a", fontFamily: "serif" }}>{val}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, borderTop: "1px solid #3d2c14", paddingTop: 8 }}>
              <span style={{ color: "#f0e6d0", fontWeight: 700 }}>純売上（タバコ除く）</span>
              <span style={{ color: "#c9952a", fontFamily: "serif", fontSize: 20, fontWeight: 700 }}>¥{todayTotal.toLocaleString()}</span>
            </div>
            {[
              ["内消費税10%", `¥${todayTax.toLocaleString()}`],
              ["領収書発行", `${todayReceiptCount}件`],
              ["来客組数", `${todayCount}組`],
              ["来客人数", `${todayPeople}名`],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#8a7050" }}>{label}</span>
                <span style={{ color: "#c9952a", fontFamily: "serif" }}>{val}</span>
              </div>
            ))}
          </div>

          {/* 時間帯別 */}
          <div style={{ background: "#181008", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ color: "#8a7050", fontSize: 12, marginBottom: 8 }}>時間帯別売上</div>
            {Object.keys(groups).length === 0
              ? <div style={{ color: "#3d2c14", fontSize: 13 }}>データなし</div>
              : Object.entries(groups).sort().map(([hour, g]) => (
                <div key={hour} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #3d2c1433" }}>
                  <span style={{ color: "#8a7050" }}>{hour}:00〜{Number(hour)+1}:00</span>
                  <span style={{ color: "#8a7050", fontSize: 12 }}>{g.count}件</span>
                  <span style={{ color: "#c9952a" }}>¥{g.amount.toLocaleString()}</span>
                </div>
              ))}
          </div>

          {/* タバコ */}
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

          {/* レジ確認履歴 */}
          {cashCheckLogs.length > 0 && (
            <div style={{ background: "#181008", borderRadius: 10, padding: 16 }}>
              <div style={{ color: "#8a7050", fontSize: 12, marginBottom: 8 }}>💰 レジ確認履歴</div>
              {cashCheckLogs.map((log, i) => {
                const resultLabel = log.result === "same" ? { text: "✅ 同じ", color: "#4aaa5a" } : log.result === "short" ? { text: "⚠️ 不足", color: "#c95a5a" } : { text: "💡 多い", color: "#5a8aca" };
                return (
                  <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid #3d2c1433" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ color: "#f0e6d0", fontWeight: 700 }}>{log.time}　{log.staff}</span>
                      <span style={{ color: resultLabel.color, fontWeight: 700 }}>{resultLabel.text}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "#8a7050" }}>あるべき金額</span>
                      <span style={{ color: "#c9952a" }}>¥{log.systemCash.toLocaleString()}</span>
                    </div>
                    {log.diff !== 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 2 }}>
                        <span style={{ color: "#8a7050" }}>差額</span>
                        <span style={{ color: log.diff < 0 ? "#c95a5a" : "#5a8aca", fontWeight: 700 }}>
                          {log.diff > 0 ? "+" : ""}¥{log.diff.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {/* ドロア開閉履歴 */}
          {drawerLogs.length > 0 && (
            <div style={{ background: "#181008", borderRadius: 10, padding: 16, marginTop: 12 }}>
              <div style={{ color: "#3a9a8a", fontSize: 12, marginBottom: 8 }}>🔓 ドロア開閉履歴</div>
              {drawerLogs.map((log, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1a4a3a33", fontSize: 13 }}>
                  <span style={{ color: "#3a9a8a" }}>{log.sale_time}</span>
                  <span style={{ color: "#8a7050" }}>ドロアを開けました</span>
                </div>
              ))}
              <div style={{ textAlign: "right", color: "#3a9a8a", fontSize: 12, marginTop: 6 }}>計 {drawerLogs.length}回</div>
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
    if (!byDate[d]) byDate[d] = { cash: 0, pay: 0, total: 0, count: 0, people: 0, firstHalf: 0 };
    byDate[d].total += s.amount;
    byDate[d].count += 1;
    byDate[d].people += s.people_count || 0;
    if (s.pay_method === "現金") byDate[d].cash += s.amount;
    else byDate[d].pay += s.amount;
    if (s.sale_time && s.sale_time < "15:00") byDate[d].firstHalf += s.amount;
  });
  const totalFirstHalf = Object.values(byDate).reduce((a, d) => a + d.firstHalf, 0);

  const totalCash = sales.filter(s => s.pay_method === "現金").reduce((a, s) => a + s.amount, 0);
  const totalPay = sales.filter(s => s.pay_method === "ペイキャス").reduce((a, s) => a + s.amount, 0);
  const totalAmount = sales.reduce((a, s) => a + s.amount, 0);
  const totalCount = sales.length;
  const totalPeople = sales.reduce((a, s) => a + (s.people_count || 0), 0);
  const firstHalfPay = sales.filter(s => s.pay_method === "ペイキャス" && parseInt(s.sale_date.split('-')[2]) <= 15).reduce((a, s) => a + s.amount, 0);
  const secondHalfPay = sales.filter(s => s.pay_method === "ペイキャス" && parseInt(s.sale_date.split('-')[2]) > 15).reduce((a, s) => a + s.amount, 0);
  const tobaccoTotal = tobaccoSales.reduce((a, s) => a + s.price, 0);
  const tobaccoByItem = {};
  TOBACCO.forEach(t => { tobaccoByItem[t.name] = { count: 0, total: 0 }; });
  tobaccoSales.forEach(s => {
    if (tobaccoByItem[s.item_name]) {
      tobaccoByItem[s.item_name].count += 1;
      tobaccoByItem[s.item_name].total += s.price;
    }
  });

  const printMonthly = () => {
    const [y, m] = selectedMonth.split('-');
    const rows = Object.entries(byDate).sort().map(([date, d]) => {
      const day = Number(date.split('-')[2]);
      return `<tr>
        <td>${day}日</td>
        <td>¥${d.firstHalf.toLocaleString()}</td>
        <td>¥${d.total.toLocaleString()}</td>
        <td>¥${d.pay.toLocaleString()}</td>
        <td>¥${d.cash.toLocaleString()}</td>
        <td>${d.count}</td>
      </tr>`;
    }).join('');
    const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"/>
      <title>月次日計 ${y}年${Number(m)}月</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: 'Noto Sans JP', sans-serif; font-size: 11px; color: #111; }
        h2 { font-size: 16px; text-align: center; margin-bottom: 4px; }
        p { text-align: center; color: #555; font-size: 10px; margin: 0 0 12px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #222; color: #fff; padding: 7px 8px; font-size: 10px; text-align: right; }
        th:first-child { text-align: left; }
        td { padding: 6px 8px; border-bottom: 1px solid #ddd; text-align: right; font-size: 11px; }
        td:first-child { text-align: left; }
        tr:last-child td { border-bottom: none; }
        .total-row td { background: #f5f5f5; font-weight: 700; border-top: 2px solid #999; }
      </style></head><body>
      <h2>Lounge Cattleya　${y}年${Number(m)}月　月次日計</h2>
      <p>出力日: ${new Date().toLocaleString('ja-JP')}</p>
      <table>
        <thead><tr>
          <th>日付</th><th>〜15時</th><th>1日分</th><th>ペイキャス</th><th>現金</th><th>件数</th>
        </tr></thead>
        <tbody>${rows}
          <tr class="total-row">
            <td>合計</td>
            <td>¥${totalFirstHalf.toLocaleString()}</td>
            <td>¥${totalAmount.toLocaleString()}</td>
            <td>¥${totalPay.toLocaleString()}</td>
            <td>¥${totalCash.toLocaleString()}</td>
            <td>${totalCount}</td>
          </tr>
        </tbody>
      </table>
      </body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.onafterprint = () => w.close();
    w.print();
  };

  return (
    <div style={{ background: "#0d0905", minHeight: "100vh", color: "#f0e6d0", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 18 }}>📅 月次レポート</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={printMonthly} style={{ padding: "6px 14px", background: "#c9952a", border: "none", borderRadius: 8, color: "#0d0905", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>🖨 日計印刷</button>
          <button onClick={onBack} style={{ padding: "6px 14px", background: "transparent", border: "1px solid #3d2c14", borderRadius: 8, color: "#8a7050", cursor: "pointer" }}>戻る</button>
        </div>
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
                  <span style={{ color: "#8a7050", fontSize: 11, marginRight: 8 }}>{tobaccoByItem[t.name]?.count || 0}個</span>
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
  const [checkingOut, setCheckingOut] = useState(false);
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponType, setCouponType] = useState(null);   // 'A' | 'B'
  const [couponNo, setCouponNo] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [cashCheckResult, setCashCheckResult] = useState(null); // "same" | "short" | "over"
  const [cashCheckDiff, setCashCheckDiff] = useState("");
  const [previewHtml, setPreviewHtml] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
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
    orders.filter((o) => String(o.table_no) === String(tableNo) && (o.status === "pending" || o.status === "served"));

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
    ? tableOrders(selected).filter(o => (o.status === "pending" || o.status === "served") && !o.item_name.startsWith("【人数"))
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
    if (checkingOut) return; // 二重送信防止
    setCheckingOut(true);
    const t = selected;
    const couponDisc = couponApplied ? couponDiscount : 0;
    const amount = tableTotal(t) - couponDisc;
    const now = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    const nowMs = Date.now();
    if (lastCheckout && lastCheckout.table === t && lastCheckout.amount === amount && (nowMs - lastCheckout.timestamp) < 120000) {
      setConfirming(false); setPayMethod(null); setReceiptType(null); setReceivedAmount(""); return;
    }
    const chg = payMethod === "現金" ? change : null;
    const people = tablePeople(t);

    const tableOrderItems = tableOrders(t).filter(o => (o.status === "pending" || o.status === "served") && !o.item_name.startsWith("【人数"));
    for (const item of tableOrderItems) {
      await supabase.from("order_items").insert({
        table_no: String(t),
        item_name: item.item_name,
        price: item.price,
        qty: item.qty,
        sale_time: now,
      });
    }

    await supabase.from("orders").delete().eq("table_no", String(t));
    await supabase.from("sales").insert({ table_no: String(t), amount, pay_method: payMethod, receipt_type: receiptType, people_count: people, sale_time: now });
    await fetchTodaySales();
    const record = { table: t, amount, time: now, pay: payMethod, receipt: receiptType, timestamp: Date.now() };
    setHistory((prev) => [record, ...prev]);
    setLastCheckout(record);
    setCheckoutInfo({ table: t, amount, pay: payMethod, receipt: receiptType, change: chg, received: receivedAmount ? parseInt(receivedAmount) : null, items: tableOrderItems });
    setSelected(null); setConfirming(false); setPayMethod(null); setReceiptType(null); setReceivedAmount(""); setCheckoutDone(true); setCheckingOut(false);
    speakAmount(amount);
    // クーポン使用記録
    if (couponApplied && couponType && couponNo) {
      await supabase.from("coupons").insert({
        coupon_no: `${couponType}${couponNo}`,
        coupon_type: couponType,
        used_at: new Date().toISOString(),
        is_used: true,
        amount_before: tableTotal(t) + couponDiscount,
        discount_amount: couponDiscount,
      });
      setCouponApplied(false); setCouponDiscount(0); setCouponType(null); setCouponNo("");
    }

    // PassPRNT 自動印刷（レシート or 領収書 のときだけ）
    if (receiptType !== "なし") {
      const receiptNo = getNextReceiptNo();
      const html = buildReceiptHTML({ table: t, amount, pay: payMethod, receipt: receiptType, change: chg, received: receivedAmount ? parseInt(receivedAmount) : null, items: tableOrderItems, receiptNo });
      // 1000円以上は レシート＋クーポンを1つのHTMLにまとめて1回で印刷
      const now2 = new Date();
      const issuePeriod = now2 >= new Date(`${now2.getFullYear()}-06-01`);
      let printHtml = html;
      if (amount >= 1000 && issuePeriod) {
        // クーポンを区切り線のあとに結合（1回のPassPRNTで連続印刷）
        const couponBody = buildCouponHTML().replace(/^[\s\S]*?<body[^>]*>/, "").replace(/<\/body>[\s\S]*$/, "");
        printHtml = html.replace("</body></html>", `<div style="margin-top:8px;border-top:1px dashed #000;padding-top:6px">${couponBody}</div></body></html>`);
      }
      // ペイキャスはドロアを開けない（cashdrawer=false）
      const drawerParam = payMethod === "ペイキャス" ? "&cashdrawer=false" : "";
      const passprntUrl = "starpassprnt://v1/print/nopreview?back=" + encodeURIComponent(window.location.href) + drawerParam + "&html=" + encodeURIComponent(printHtml);
      setTimeout(() => { window.location.href = passprntUrl; }, 1200);
    }
  };

  const showPreview = (type) => {
    const sampleItems = [
      { item_name: "アイスコーヒー", price: 670, qty: 1 },
      { item_name: "シフォンケーキ", price: 650, qty: 2 },
      { item_name: "アイスミルクティ", price: 670, qty: 1 },
    ];
    const total = sampleItems.reduce((a, o) => a + o.price * o.qty, 0);
    const html = buildReceiptHTML({
      table: 3, amount: total, pay: "現金", receipt: type,
      change: 360, received: 3000, items: sampleItems, receiptNo: "010031211",
    });
    setPreviewHtml(html);
  };

  const openDrawer = () => {
    // 時刻をlocalStorageに記録
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const timeStr = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
    const key = `cattleya_drawer_${today}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    existing.push(timeStr);
    localStorage.setItem(key, JSON.stringify(existing));
    // mPOP ドロアオープン（最小レシートでPassPRNTを動かす）
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:2px;width:384px;font-size:1px;color:white;">.</body></html>`;
    const url = "starpassprnt://v1/print/nopreview?back=" + encodeURIComponent(window.location.href) + "&html=" + encodeURIComponent(html);
    window.location.href = url;
  };

  // クーポン有効期間チェック（7月1日〜7月31日）
  const isCouponPeriod = () => {
    const now = new Date();
    const y = now.getFullYear();
    const start = new Date(`${y}-07-01`);
    const end   = new Date(`${y}-07-31T23:59:59`);
    return now >= start && now <= end;
  };

  const applyCoupon = async () => {
    setCouponError("");
    if (!couponType) { setCouponError("AまたはBを選んでください"); return; }
    const no = couponNo.trim();
    if (!no || !/^\d{5}$/.test(no)) { setCouponError("5桁の数字を入力してください"); return; }
    if (!isCouponPeriod()) { setCouponError("クーポンの利用期間外です（7月1日〜31日）"); return; }
    const fullNo = `${couponType}${no}`;
    // Supabaseで重複チェック
    const { data } = await supabase.from("coupons").select("*").eq("coupon_no", fullNo).eq("is_used", true);
    if (data && data.length > 0) { setCouponError("このクーポンはすでに使用済みです"); return; }
    // 割引計算（5%、1の位切り捨て）
    const base = selectedTotal;
    if (base < 1000) { setCouponError("1,000円未満はクーポンをご利用いただけません"); return; }
    const disc = Math.floor(base * 0.05 / 10) * 10;
    setCouponDiscount(disc);
    setCouponApplied(true);
    setShowCoupon(false);
    setCouponError("");
  };

  const removeCoupon = () => {
    setCouponApplied(false);
    setCouponDiscount(0);
    setCouponType(null);
    setCouponNo("");
  };

  const addDiscount = () => {
    supabase.from("orders").insert({ table_no: String(selected), item_name: "セット値引き", price: -150, qty: 1, status: "pending" }).then(() => fetchOrders());
  };

  const openTobaccoConfirm = (item) => { setTobaccoConfirming(item); setTobaccoReceiptType(null); setTobaccoReceived(""); };

  const completeTobaccoSale = async () => {
    const now = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    await supabase.from("tobacco_sales").insert({ item_name: tobaccoConfirming.name, price: tobaccoConfirming.price, receipt_type: tobaccoReceiptType, sale_time: now });
    await fetchTodayTobacco();
    await fetchMonthlyTobacco();
    setTobaccoConfirming(null); setTobaccoReceiptType(null); setTobaccoReceived(""); setMode("register");
  };

  const confirmCashCheck = () => {
    const staffName = showOtherInput ? cashCheckOther : cashCheckStaff;
    if (!staffName || !cashCheckResult) return;
    const now = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    const systemCash = todayCashFromDB + 50000;
    const diff = cashCheckResult === "same" ? 0 : parseInt(cashCheckDiff || "0");
    const diffSigned = cashCheckResult === "short" ? -diff : cashCheckResult === "over" ? diff : 0;
    setCashCheckLogs((prev) => [{ time: now, staff: staffName, systemCash, salesCash: todayCashFromDB, result: cashCheckResult, diff: diffSigned }, ...prev]);
    setCashChecking(false); setCashCheckStaff(null); setCashCheckOther(""); setShowOtherInput(false);
    setCashCheckResult(null); setCashCheckDiff("");
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
  if (mode === "plu") return <PLUReport supabase={supabase} onBack={() => setMode("register")} />;

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 15, fontWeight: 700 }}>
            📅 {now.getMonth() + 1}月 銘柄別累計
          </div>
          <button onClick={() => {
            const rows = TOBACCO.map(item => `<tr>
              <td>${item.name}</td>
              <td>${monthlyTobaccoByItem[item.name]?.count || 0}個</td>
              <td>¥${(monthlyTobaccoByItem[item.name]?.total || 0).toLocaleString()}</td>
            </tr>`).join('');
            const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"/>
              <title>タバコ月集計 ${now.getFullYear()}年${now.getMonth()+1}月</title>
              <style>
                @page { size: A4 portrait; margin: 20mm; }
                body { font-family: sans-serif; font-size: 12px; color: #111; }
                h2 { font-size: 16px; text-align: center; margin-bottom: 4px; }
                p { text-align: center; color: #555; font-size: 10px; margin: 0 0 16px; }
                table { width: 100%; border-collapse: collapse; }
                th { background: #222; color: #fff; padding: 8px; text-align: left; }
                td { padding: 8px; border-bottom: 1px solid #ddd; }
                td:not(:first-child) { text-align: right; }
                .total td { font-weight: 700; border-top: 2px solid #999; background: #f5f5f5; }
              </style></head><body>
              <h2>Lounge Cattleya　${now.getFullYear()}年${now.getMonth()+1}月　タバコ月集計</h2>
              <p>出力日: ${new Date().toLocaleString('ja-JP')}</p>
              <table>
                <thead><tr><th>銘柄</th><th>個数</th><th>金額</th></tr></thead>
                <tbody>${rows}
                  <tr class="total">
                    <td>合計</td>
                    <td>${monthlyTobaccoFromDB.length}個</td>
                    <td>¥${monthlyTobaccoTotal.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table></body></html>`;
            const w = window.open('', '_blank');
            w.document.write(html);
            w.document.close();
            w.onafterprint = () => w.close();
            w.print();
          }} style={{ padding: "6px 12px", background: "#c9952a", border: "none", borderRadius: 8, color: "#0d0905", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>🖨 印刷</button>
        </div>
        {TOBACCO.map((item) => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #3d2c1433" }}>
            <span style={{ color: "#f0e6d0", fontSize: 13 }}>{item.name}</span>
            <div style={{ textAlign: "right" }}>
              <span style={{ color: "#8a7050", fontSize: 11, marginRight: 8 }}>{monthlyTobaccoByItem[item.name]?.count || 0}個</span>
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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#0d0905", color: "#f0e6d0", fontFamily: "'Noto Sans JP', sans-serif" }}>
      <div style={{ background: "#333", color: "#fff", padding: "4px 12px", fontSize: 11 }}>{debugMsg}</div>

      {showAdmin && (
        <div onClick={() => setShowAdmin(false)} style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 280, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#1a120a", border: "1px solid #3d2c14", borderRadius: 14, padding: 20, width: 300, maxWidth: "90%" }}>
            <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 18, textAlign: "center", marginBottom: 16 }}>⚙️ 管理メニュー</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => { setShowAdmin(false); setMode("daily"); }} style={{ padding: "14px 0", background: "#251a0a", border: "1px solid #3d2c14", borderRadius: 10, color: "#c9952a", fontSize: 15, cursor: "pointer" }}>📊 日計</button>
              <button onClick={() => { setShowAdmin(false); setMode("monthly"); }} style={{ padding: "14px 0", background: "#251a0a", border: "1px solid #3d2c14", borderRadius: 10, color: "#c9952a", fontSize: 15, cursor: "pointer" }}>📅 月次</button>
              <button onClick={() => { setShowAdmin(false); setMode("plu"); }} style={{ padding: "14px 0", background: "#251a0a", border: "1px solid #3d2c14", borderRadius: 10, color: "#c9952a", fontSize: 15, cursor: "pointer" }}>📋 PLU集計</button>
              <button onClick={() => { setShowAdmin(false); showPreview("レシート"); }} style={{ padding: "14px 0", background: "#251a0a", border: "1px solid #3d2c14", borderRadius: 10, color: "#c9952a", fontSize: 15, cursor: "pointer" }}>🧾 レシート見本</button>
              <button onClick={() => { setShowAdmin(false); showPreview("領収書"); }} style={{ padding: "14px 0", background: "#251a0a", border: "1px solid #3d2c14", borderRadius: 10, color: "#c9952a", fontSize: 15, cursor: "pointer" }}>🧾 領収書見本</button>
            </div>
            <button onClick={() => setShowAdmin(false)} style={{ marginTop: 16, width: "100%", padding: "12px 0", background: "transparent", border: "1px solid #3d2c14", borderRadius: 10, color: "#8a7050", fontSize: 14, cursor: "pointer" }}>閉じる</button>
          </div>
        </div>
      )}

      {previewHtml && (
        <div onClick={() => setPreviewHtml(null)} style={{ position: "fixed", inset: 0, background: "#000000dd", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16 }}>
          <div style={{ color: "#c9952a", fontFamily: "serif", marginBottom: 8, fontSize: 14 }}>レシートプレビュー（実寸48mm幅）</div>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 4, width: 384, maxHeight: "75vh", overflow: "auto", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
            <iframe title="preview" srcDoc={previewHtml} style={{ width: 384, height: 640, border: "none", display: "block" }} />
          </div>
          <button onClick={() => setPreviewHtml(null)} style={{ marginTop: 14, padding: "12px 28px", background: "#c9952a", border: "none", borderRadius: 10, color: "#0d0905", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>閉じる</button>
        </div>
      )}

      {showCoupon && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 250, padding: 20 }}>
          <div style={{ background: "#1a1a2a", border: "1px solid #5a5ac9", borderRadius: 14, padding: 22, width: "100%", maxWidth: 380 }}>
            <div style={{ color: "#9a9af0", fontSize: 18, fontWeight: 900, marginBottom: 16 }}>🎟 クーポン割引</div>
            <div style={{ color: "#8a8ab0", fontSize: 13, marginBottom: 12 }}>クーポンの種類を選んでください</div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              {["A", "B"].map(t => (
                <button key={t} onClick={() => setCouponType(t)}
                  style={{ flex: 1, padding: "14px 0", background: couponType === t ? "#5a5ac9" : "transparent", border: `2px solid ${couponType === t ? "#9a9af0" : "#3a3a6a"}`, borderRadius: 10, color: couponType === t ? "#fff" : "#8a8ab0", fontWeight: 900, fontSize: 20, cursor: "pointer" }}>
                  {t}クーポン
                </button>
              ))}
            </div>
            <div style={{ color: "#8a8ab0", fontSize: 13, marginBottom: 8 }}>5桁の番号を入力</div>
            <input type="number" value={couponNo} onChange={e => { if (e.target.value.length <= 5) setCouponNo(e.target.value); }}
              placeholder="例：10001"
              style={{ width: "100%", padding: "14px", background: "#0d0d1a", border: "1px solid #5a5ac9", borderRadius: 8, color: "#f0f0ff", fontSize: 22, fontWeight: 700, boxSizing: "border-box", marginBottom: 8, textAlign: "center" }} />
            {couponError && <div style={{ color: "#c95a5a", fontSize: 13, marginBottom: 8 }}>{couponError}</div>}
            <div style={{ color: "#6a6a9a", fontSize: 12, marginBottom: 14 }}>
              5%割引（1の位切り捨て）・1,000円以上のみ・7/1〜7/31
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => { setShowCoupon(false); setCouponError(""); }}
                style={{ flex: 1, padding: 14, background: "transparent", border: "1px solid #3a3a6a", borderRadius: 10, color: "#8a8ab0", cursor: "pointer" }}>キャンセル</button>
              <button onClick={applyCoupon}
                style={{ flex: 2, padding: 14, background: "#5a5ac9", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
                ✅ 適用する
              </button>
            </div>
          </div>
        </div>
      )}

      {cashChecking && (
        <div style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16, overflowY: "auto" }}>
          <div style={{ background: "#1c1208", border: "1px solid #3d2c14", borderRadius: 12, padding: 20, width: "100%", maxWidth: 400 }}>
            <div style={{ fontFamily: "serif", color: "#c9952a", fontSize: 18, marginBottom: 14 }}>💰 レジ金額確認</div>

            {/* レジ内金額 */}
            <div style={{ background: "#251a0a", borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#8a7050" }}>釣り銭（固定）</span>
                <span style={{ color: "#f0e6d0" }}>¥50,000</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: "#8a7050" }}>本日の現金売上</span>
                <span style={{ color: "#f0e6d0" }}>¥{todayCashFromDB.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #3d2c14", paddingTop: 10 }}>
                <span style={{ color: "#f0e6d0", fontWeight: 700, fontSize: 16 }}>レジ内あるべき金額</span>
                <span style={{ color: "#c9952a", fontFamily: "serif", fontSize: 24, fontWeight: 900 }}>¥{(todayCashFromDB + 50000).toLocaleString()}</span>
              </div>
            </div>

            {/* 照合結果 */}
            <div style={{ color: "#f0e6d0", fontSize: 14, marginBottom: 8, fontWeight: 700 }}>実際のレジ内金額と一致していますか？</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
              {[["same","✅ 同じ","#2a6a3a","#4aaa5a"],["short","⚠️ 不足","#6a2a2a","#c95a5a"],["over","💡 多い","#2a4a6a","#5a8aca"]].map(([key, label, bg, color]) => (
                <button key={key} onClick={() => { setCashCheckResult(key); if (key === "same") setCashCheckDiff(""); }}
                  style={{ padding: "12px 4px", background: cashCheckResult === key ? bg : "transparent", border: `2px solid ${cashCheckResult === key ? color : "#3d2c14"}`, borderRadius: 10, color: cashCheckResult === key ? "#fff" : "#8a7050", fontWeight: 900, fontSize: 15, cursor: "pointer" }}>
                  {label}
                </button>
              ))}
            </div>

            {/* 差額入力 */}
            {(cashCheckResult === "short" || cashCheckResult === "over") && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: "#8a7050", fontSize: 13, marginBottom: 6 }}>差額（円）を入力してください</div>
                <input type="number" value={cashCheckDiff} onChange={(e) => setCashCheckDiff(e.target.value)}
                  placeholder="例：500"
                  style={{ width: "100%", padding: "12px", background: "#251a0a", border: "1px solid #c9952a", borderRadius: 8, color: "#f0e6d0", fontSize: 18, fontWeight: 700, boxSizing: "border-box" }} />
              </div>
            )}

            {/* 確認者 */}
            <div style={{ color: "#8a7050", fontSize: 12, marginBottom: 8 }}>確認者</div>
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

            {/* ボタン */}
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button onClick={() => { setCashChecking(false); setCashCheckStaff(null); setCashCheckOther(""); setShowOtherInput(false); setCashCheckResult(null); setCashCheckDiff(""); }}
                style={{ flex: 1, padding: 14, background: "transparent", border: "1px solid #3d2c14", borderRadius: 10, color: "#8a7050", cursor: "pointer" }}>キャンセル</button>
              <button onClick={confirmCashCheck}
                disabled={(!cashCheckStaff && !cashCheckOther) || !cashCheckResult || ((cashCheckResult === "short" || cashCheckResult === "over") && !cashCheckDiff)}
                style={{ flex: 2, padding: 14, background: ((cashCheckStaff || cashCheckOther) && cashCheckResult) ? "#2a6a3a" : "#3d2c14", border: "none", borderRadius: 10, color: ((cashCheckStaff || cashCheckOther) && cashCheckResult) ? "#fff" : "#8a7050", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
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
              style={{ width: "100%", padding: 10, background: "#1a3020", border: "1px solid #2a6a3a", borderRadius: 8, color: "#4aaa5a", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 8 }}>
              セット値引き -150円 を追加
            </button>
            {!couponApplied ? (
              isCouponPeriod() && selectedTotal >= 1000 ? (
                <button onClick={() => setShowCoupon(true)}
                  style={{ width: "100%", padding: 10, background: "#1a1a30", border: "1px solid #5a5ac9", borderRadius: 8, color: "#9a9af0", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 14 }}>
                  🎟 クーポン割引を適用する
                </button>
              ) : null
            ) : (
              <div style={{ background: "#1a1a30", border: "1px solid #5a5ac9", borderRadius: 8, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#9a9af0", fontSize: 14 }}>🎟 クーポン割引 -{couponDiscount.toLocaleString()}円 ({couponType}{couponNo})</span>
                <button onClick={removeCoupon} style={{ padding: "4px 10px", background: "transparent", border: "1px solid #c95a5a", borderRadius: 6, color: "#c95a5a", fontSize: 11, cursor: "pointer" }}>取消</button>
              </div>
            )}
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
              <button onClick={checkout} disabled={!canCheckout || checkingOut}
                style={{ flex: 2, padding: 14, background: canCheckout ? "#2a6a3a" : "#3d2c14", border: "none", borderRadius: 10, color: canCheckout ? "#fff" : "#8a7050", fontWeight: 700, fontSize: 16, cursor: canCheckout ? "pointer" : "not-allowed" }}>
                {checkingOut ? "処理中…" : "✅ 会計完了"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flex: 1, overflow: "auto" }}>

        {/* ===== 左サイドバー（コンパクト） ===== */}
        <div style={{ width: 130, minWidth: 130, background: "#181008", borderRight: "1px solid #3d2c14", display: "flex", flexDirection: "column" }}>

          {/* ヘッダー＋使用中テーブル数 */}
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #3d2c14" }}>
            <div style={{ fontFamily: "serif", fontSize: 11, color: "#c9952a", fontWeight: 700 }}>Lounge Cattleya</div>
            <div style={{ fontSize: 9, color: "#8a7050", marginTop: 1 }}>使用中 {occupiedTables.length} / 30</div>
          </div>

          {/* 操作ボタン（大きめ） */}
          <div style={{ padding: "8px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
            <button onClick={() => setMode("tobacco")}
              style={{ padding: "12px 4px", background: "#251a0a", border: "1px solid #3d2c14", borderRadius: 8, color: "#c9952a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              🚬 タバコ
            </button>
            <button onClick={() => setCashChecking(true)}
              style={{ padding: "12px 4px", background: "#1a2510", border: "1px solid #2a6a3a", borderRadius: 8, color: "#4aaa5a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              💰 レジ確認
            </button>
            <button onClick={openDrawer}
              style={{ padding: "12px 4px", background: "#0a1a18", border: "1px solid #1a4a3a", borderRadius: 8, color: "#3a9a8a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              🔓 ドロア
            </button>
            <button onClick={() => setShowAdmin(true)}
              style={{ padding: "12px 4px", background: "#10182a", border: "1px solid #2a3a6a", borderRadius: 8, color: "#5a8aca", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              ⚙️ 管理
            </button>
          </div>

          {/* 会計済み履歴 */}
          {history.length > 0 && (
            <div style={{ padding: "6px 8px", borderTop: "1px solid #3d2c14", flex: 1, overflow: "auto" }}>
              <div style={{ fontSize: 9, color: "#8a7050", marginBottom: 4 }}>会計済み</div>
              {history.map((h, i) => (
                <div key={i} style={{ fontSize: 10, color: "#8a7050", padding: "2px 0" }}>
                  <div>T{h.table} {h.time}</div>
                  <div style={{ color: "#c9952a" }}>¥{h.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== 右メインエリア ===== */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", minWidth: 0 }}>

          {/* テーブル未選択：テーブル一覧を大きく表示 */}
          {!selected ? (
            <div style={{ padding: 14, overflow: "auto" }}>
              <div style={{ fontSize: 12, color: "#8a7050", marginBottom: 10 }}>🧾 テーブルを選択してください</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(58px, 1fr))", gap: 8 }}>
                {TABLES.map((t) => {
                  const occ = tableOrders(t).length > 0;
                  return (
                    <div key={t} onClick={() => occ && setSelected(t)}
                      style={{ padding: "14px 4px", borderRadius: 8, border: `2px solid ${occ ? "#c9952a" : "#3d2c14"}`, background: occ ? "#2a1c0a" : "#0d0905", color: occ ? "#c9952a" : "#3d2c14", textAlign: "center", fontSize: 16, fontWeight: 900, cursor: occ ? "pointer" : "default" }}>
                      {t}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {/* テーブル選択済み：注文詳細 */}
              <div style={{ padding: "12px 16px", background: "#181008", borderBottom: "1px solid #3d2c14", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontFamily: "serif", fontSize: 20, color: "#c9952a", fontWeight: 700 }}>テーブル {selected}</span>
                  <span style={{ color: "#8a7050", marginLeft: 10, fontSize: 13 }}>{selectedPeople}名</span>
                </div>
                <button onClick={() => setSelected(null)}
                  style={{ padding: "6px 12px", background: "transparent", border: "1px solid #3d2c14", borderRadius: 6, color: "#8a7050", fontSize: 12, cursor: "pointer" }}>
                  ← 一覧へ
                </button>
              </div>

              <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                {selectedOrders.length === 0 ? (
                  <div style={{ textAlign: "center", color: "#3d2c14", paddingTop: 40, fontSize: 14 }}>注文がありません</div>
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
                <div style={{ padding: "14px 16px", background: "#181008", borderTop: "1px solid #3d2c14" }}>
                  <button onClick={() => setConfirming(true)}
                    style={{ width: "100%", padding: 16, background: "#c9952a", border: "none", borderRadius: 10, color: "#0d0905", fontSize: 18, fontWeight: 700, cursor: "pointer" }}>
                    💴 会計する
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
