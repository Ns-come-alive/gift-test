const MENU_DATA = {
  categories: [
    { id: "table", name: "卓番号", emoji: "🪑" },
    { id: "system", name: "システム", emoji: "🎀" },
    { id: "shot", name: "ショット", emoji: "🥃" },
    { id: "castdrink", name: "キャストドリンク", emoji: "🍹" },
    { id: "bottle", name: "ボトル", emoji: "🍾" },
    { id: "champagne", name: "シャンパン", emoji: "🥂" },
    { id: "original", name: "オリジナル", emoji: "💎" },
    { id: "wine", name: "ワイン", emoji: "🍷" },
    { id: "food", name: "フード", emoji: "🍫" },
    { id: "other", name: "その他", emoji: "📝" },
    { id: "gacha", name: "ガチャ＆ダーツ", emoji: "🎯" },
    { id: "all", name: "すべて", emoji: "✨" },
  ],
  tables: [
    { num: "C1", label: "C1", type: "counter" },
    { num: "C2", label: "C2", type: "counter" },
    { num: "C3", label: "C3", type: "counter" },
    { num: "C4", label: "C4", type: "counter" },
    { num: "C5", label: "C5", type: "counter" },
    { num: "C6", label: "C6", type: "counter" },
    { num: "C7", label: "C7", type: "counter" },
    { num: "C8", label: "C8", type: "counter" },
    { num: "C9", label: "C9", type: "counter" },
    { num: "C10", label: "C10", type: "counter" },
    { num: "B1", label: "B1", type: "box" },
    { num: "B2", label: "B2", type: "box" },
    { num: "B3", label: "B3", type: "box" },
  ],
  items: [
    // ===== システム =====
    { id: 1, name: "60分セット (21-23時)", price: 3000, category: "system", emoji: "🕘" },
    { id: 2, name: "60分セット (23時-Last)", price: 3500, category: "system", emoji: "🌙" },
    { id: 3, name: "シングルチャージ", price: 1000, category: "system", emoji: "👤" },
    { id: 4, name: "30分延長", price: 2000, category: "system", emoji: "⏱️" },
    { id: 5, name: "60分延長", price: 3500, category: "system", emoji: "⏱️" },
    { id: 6, name: "推し指名", price: 2000, category: "system", emoji: "👑" },
    { id: 7, name: "場内指名", price: 1000, category: "system", emoji: "💫" },
    { id: 8, name: "同伴", price: 2000, category: "system", emoji: "🤝" },
    { id: 9, name: "新規特別プラン", price: 1000, category: "system", emoji: "🌟", isTaxFree: true },
    { id: 110, name: "飲み放題（ビール・炭酸）", price: 1000, category: "system", emoji: "🍺" },
    { id: 111, name: "キャッチ（平日）", price: 2000, category: "system", emoji: "🤝", isTaxFree: true },
    { id: 112, name: "キャッチ（金土祝前）", price: 3000, category: "system", emoji: "🤝", isTaxFree: true },

    // ===== ショット =====
    { id: 10, name: "イエガー", price: 1500, category: "shot", emoji: "🥃" },
    { id: 11, name: "クライナー", price: 1500, category: "shot", emoji: "🥃" },
    { id: 12, name: "テキーラ", price: 1500, category: "shot", emoji: "🥃" },
    { id: 13, name: "コカボム", price: 2000, category: "shot", emoji: "💣" },
    { id: 14, name: "テキーラ観覧車", price: 20000, category: "shot", emoji: "🎡" },
    { id: 15, name: "クライナーセット", price: 30000, category: "shot", emoji: "🎉" },
    { id: 16, name: "テキーラ地球儀", price: 50000, category: "shot", emoji: "🌍" },

    // ===== キャストドリンク =====
    { id: 20, name: "キャストドリンク", price: 1000, category: "castdrink", emoji: "🍹", requiresRecipient: true },
    { id: 21, name: "キャストショット", price: 1500, category: "castdrink", emoji: "🥃", requiresRecipient: true },
    { id: 24, name: "キャストショット＋", price: 2000, category: "castdrink", emoji: "🥃", requiresRecipient: true },
    { id: 22, name: "キャスト割ピッチャー（+500）", price: 500, category: "castdrink", emoji: "🫗" },
    { id: 23, name: "キャスト割ピッチャー（+1000）", price: 1000, category: "castdrink", emoji: "🫗" },

    // ===== ボトル =====
    { id: 30, name: "チャミスル", price: 5000, category: "bottle", emoji: "🍶" },
    { id: 31, name: "鏡月", price: 5000, category: "bottle", emoji: "🍶" },
    { id: 32, name: "キンミヤ", price: 5000, category: "bottle", emoji: "🍶" },
    { id: 33, name: "だいやめ", price: 6000, category: "bottle", emoji: "🍶" },
    { id: 34, name: "吉四六", price: 9000, category: "bottle", emoji: "🍶" },
    { id: 35, name: "角", price: 7000, category: "bottle", emoji: "🥃" },
    { id: 36, name: "ジャックダニエル", price: 13000, category: "bottle", emoji: "🥃" },
    { id: 37, name: "マッカラン12年", price: 55000, category: "bottle", emoji: "🥃" },
    { id: 38, name: "山崎12年", price: 66000, category: "bottle", emoji: "🥃" },
    { id: 40, name: "澪", price: 2000, category: "bottle", emoji: "🍶" },
    { id: 41, name: "すず音", price: 2500, category: "bottle", emoji: "🍶" },
    { id: 42, name: "コロナ", price: 2000, category: "bottle", emoji: "🍺" },
    { id: 43, name: "ハイネケン", price: 2000, category: "bottle", emoji: "🍺" },
    { id: 44, name: "バドワイザー", price: 2000, category: "bottle", emoji: "🍺" },

    // ===== シャンパン =====
    { id: 50, name: "モエ ブリュット", price: 25000, category: "champagne", emoji: "🥂" },
    { id: 51, name: "モエ ロゼ", price: 28000, category: "champagne", emoji: "🌹" },
    { id: 52, name: "モエ アイスアンペリアル", price: 33000, category: "champagne", emoji: "❄️" },
    { id: 53, name: "モエ N.I.R", price: 35000, category: "champagne", emoji: "🖤" },
    { id: 54, name: "ソウメイ ブリュット ゴールド", price: 80000, category: "champagne", emoji: "👑" },
    { id: 55, name: "カフェ ド パリ ルージュセンセーション", price: 10000, category: "champagne", emoji: "🫧" },
    { id: 56, name: "マバム テンテーション", price: 18000, category: "champagne", emoji: "🫧" },
    { id: 57, name: "ヴーヴ・クリコ イエローラベル", price: 28000, category: "champagne", emoji: "🏷️" },
    { id: 58, name: "ヴーヴ・クリコ ホワイトラベル", price: 28000, category: "champagne", emoji: "🤍" },
    { id: 60, name: "ドン・ペリニヨン", price: 100000, category: "champagne", emoji: "👑" },
    { id: 61, name: "アルマン・ド・ブリニャック ゴールド", price: 150000, category: "champagne", emoji: "🏆" },
    { id: 62, name: "アルマン・ド・ブリニャック ロゼ", price: 320000, category: "champagne", emoji: "🌸" },
    { id: 63, name: "エンジェル ブリュット ブラック", price: 150000, category: "champagne", emoji: "🖤" },
    { id: 64, name: "エンジェル ドゥミセック ブルー", price: 300000, category: "champagne", emoji: "💙" },
    { id: 65, name: "エンジェル ドゥミセック ロゼ", price: 350000, category: "champagne", emoji: "💗" },
    { id: 66, name: "ペリエ・ジュエ グランブリュット", price: 30000, category: "champagne", emoji: "🌿" },
    { id: 67, name: "ペリエ・ジュエ ブラン ド ブラン", price: 50000, category: "champagne", emoji: "🤍" },
    { id: 68, name: "ペリエ・ジュエ ベルエポック", price: 80000, category: "champagne", emoji: "🌸" },
    { id: 69, name: "ペリエ・ジュエ ベルエポックロゼ", price: 200000, category: "champagne", emoji: "🌹" },
    { id: 70, name: "ペリエ・ジュエ ベルエポックブランドブラン", price: 350000, category: "champagne", emoji: "✨" },

    // ===== オリジナル =====
    { id: 80, name: "GIFTオリジナル ホワイト", price: 15000, category: "original", emoji: "🤍" },
    { id: 81, name: "GIFTオリジナル ロゼ", price: 30000, category: "original", emoji: "🩷" },
    { id: 82, name: "GIFTオリジナル ゴールド", price: 55000, category: "original", emoji: "👑" },
    { id: 83, name: "GIFTオリジナル ブラック", price: 100000, category: "original", emoji: "🖤" },
    { id: 84, name: "オリシャン 3本セット", price: 150000, category: "original", emoji: "🎁" },

    // ===== ワイン =====
    { id: 90, name: "紫鈴 rindo (赤)", price: 30000, category: "wine", emoji: "🍷" },
    { id: 91, name: "夢久 muku (白)", price: 26000, category: "wine", emoji: "🥂" },

    // ===== フード =====
    { id: 100, name: "お菓子盛り合わせ", price: 1000, category: "food", emoji: "🍬" },
    { id: 101, name: "乾物盛り", price: 1500, category: "food", emoji: "🥜" },
    { id: 102, name: "チョコレート", price: 500, category: "food", emoji: "🍫" },

    // ===== その他 =====
    { id: 103, name: "瓶コーラ", price: 1000, category: "other", emoji: "🥤" },
    { id: 105, name: "キャストショット＋（カウント）", price: 0, category: "other", emoji: "📊", isShotTracker: true },

    // ===== ガチャガチャ＆ダーツ =====
    // isTaxFree: SC/TAX免除, isGacha: キャスト小計に加算しないフラグ
  ],
};
