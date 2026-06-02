# 新店舗POSレジ セットアップ手順書

Gift POSレジを別店舗用に複製してデプロイするための手順です。

---

## 前提条件

- Googleアカウントを持っている
- GitHubアカウントを持っている
- Google Cloud Shell を使う（インストール不要）

---

## 全体の流れ（所要時間: 約20分）

1. GitHubにリポジトリを作成してファイルをアップロード
2. Firebase プロジェクトを作成
3. Firestore を有効化
4. セキュリティルールを変更
5. ウェブアプリを登録して firebaseConfig を取得
6. `db.js` と `data.js` を店舗用に書き換え
7. Cloud Shell からデプロイ

---

## Step 1: GitHubにリポジトリを作成

1. [GitHub](https://github.com/) にログイン
2. 右上の「+」→「New repository」
3. リポジトリ名を入力（例: `店舗名-pos-register`）
4. Public or Private → お好みで
5. 「Create repository」
6. 「Add file」→「Upload files」で以下のファイルをすべてアップロード:

```
index.html
style.css
app.js
data.js
db.js          ← firebaseConfig は後で書き換え
firebase.json
firestore.rules
.firebaserc
.gitignore
```

7. 「Commit changes」をクリック

---

## Step 2: Firebaseプロジェクトを作成

1. [Firebase Console](https://console.firebase.google.com/) を開く
2. 「プロジェクトを追加」
3. プロジェクト名を入力（例: `店舗名-pos`）
4. Googleアナリティクス → 無効でOK
5. 「プロジェクトを作成」→ 完了を待つ

---

## Step 3: Firestore Database を有効化

1. Firebase Console → 作成したプロジェクト
2. 左メニュー「Database と Storage」→「Firestore」
   （または「プロジェクト ショートカット」→「Firestore」）
3. 「データベースを作成」をクリック
4. **「テストモードで開始」** を選択 → 「次へ」
5. ロケーション → **`asia-northeast1`（東京）** を選択
6. 「有効にする」

---

## Step 4: セキュリティルールを変更

1. Firestore の画面で上部の「ルール」タブをクリック
2. ルールを以下に書き換え:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. 「公開」ボタンをクリック

---

## Step 5: ウェブアプリを登録して firebaseConfig を取得

1. Firebase Console → プロジェクト設定（⚙️アイコン）→「全般」
2. 下にスクロール →「マイアプリ」→ `</>` (ウェブ) アイコンをクリック
3. アプリ名を入力（例: `店舗名 POS`）→「アプリを登録」
4. 表示される `firebaseConfig` の値をメモ（コピー）:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "xxx.firebaseapp.com",
  projectId: "xxx",
  storageBucket: "xxx.firebasestorage.app",
  messagingSenderId: "123...",
  appId: "1:123...:web:abc...",
  measurementId: "G-..."
};
```

---

## Step 6: ファイルを店舗用に書き換え

### `db.js` — firebaseConfig を差し替え

GitHubのリポジトリで `db.js` を開き、鉛筆アイコン（Edit）をクリック。
`firebaseConfig` の中身を Step 5 でコピーした値に差し替えて Commit。

### `data.js` — メニュー・価格を変更（必要な場合）

店舗ごとにメニューや価格が異なる場合は `data.js` を編集。
構造はそのままで、`name` と `price` を書き換えるだけ。

### `index.html` — ページタイトルを変更（任意）

```html
<title>店舗名 - POSレジ</title>
```

### `.firebaserc` — プロジェクトIDを空にしておく（Cloud Shellで設定するため）

```json
{
  "projects": {
    "default": ""
  }
}
```

---

## Step 7: Cloud Shell からデプロイ

1. [Google Cloud Shell](https://shell.cloud.google.com/) を開く

2. Firebase CLIにログイン:
```bash
npm install -g firebase-tools
firebase login --no-localhost
```
→ 表示されたURLをブラウザで開いて認証 → コードをターミナルに貼り付け

3. GitHubからクローン:
```bash
git clone https://github.com/ユーザー名/リポジトリ名.git
cd リポジトリ名
```

4. Firebaseプロジェクトを紐付け:
```bash
firebase use プロジェクトID
```
（例: `firebase use 店舗名-pos`）

5. デプロイ:
```bash
firebase deploy
```

6. 完了！表示されるURLでアクセス:
```
https://プロジェクトID.web.app
```

---

## トラブルシューティング

### 別端末でデータが同期されない
- F12 → Console で `typeof DB` を実行 → `"undefined"` なら `db.js` がデプロイされていない
- Cloud Shell で `ls db.js` を確認して再デプロイ

### Firestore のアクセス拒否
- Firebase Console → Firestore → ルール → `allow read, write: if true;` になっているか確認

### ページが真っ白
- ブラウザのキャッシュをクリア（Ctrl+Shift+R）
- Cloud Shell で再デプロイ

### PDF出力が真っ白
- ポップアップブロックを解除
- ブラウザの印刷プレビューでフォント読み込みを待つ

---

## ファイル構成

```
pos-register/
├── index.html        … 画面構造（HTML）
├── style.css         … デザイン（CSS）
├── app.js            … アプリロジック（JavaScript）
├── data.js           … メニュー・価格データ ← 店舗ごとに変更
├── db.js             … Firebase/Firestore接続 ← 店舗ごとに変更
├── firebase.json     … Firebase Hosting設定
├── firestore.rules   … Firestoreセキュリティルール
├── .firebaserc       … Firebaseプロジェクト紐付け
└── .gitignore        … Git除外ファイル指定
```

---

## 計算ロジック

```
小計 × SC(15%) → (小計+SC) × TAX(10%) → 総額
カード: 総額 × 1.08
現金: 10円の位があれば100円に切り上げ
新規特別プラン(¥1,000): この商品のみTAX/SC免除
```
