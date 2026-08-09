# 検索機能の反射型XSS

対象: `GET /search?q=...`

## Build(脆弱にした実装)

- `src/routes/search.ts` で `req.query.q` を受け取り、そのまま `search.ejs` に渡している
- `src/views/search.ejs` で `q` と検索結果一覧(`item.author` / `item.body` / `item.likes`)を `<%- %>`(エスケープなし出力)でレンダリングしている
- ejsのデフォルトタグ `<%= %>` は自動エスケープするが、意図的にエスケープなしタグへ変更することで脆弱性を再現した

## Attack

**ペイロード**

```
<script>alert(1)</script>
```

**結果**

検索フォームに上記ペイロードを投入したところ、ブラウザ上で `alert(1)` のダイアログが発生した(スクリーンショット確認済み)。サーバー側のログにも、`q` の値がエスケープされずそのままSQL文に埋め込まれている様子が記録されている:

```
sql:  SELECT * FROM comments WHERE body LIKE '%<script>alert(1)</script>%';
```

同一クエリがログに3回連続で出力されていたが、これは検索を3回実行したことによるもので、アプリ側の異常ではない。

## 原因

- ユーザー入力 `q` をHTMLエスケープせずに `res.render()` へ渡し、ejs側でも `<%- %>` で出力しているため、`<script>` タグがブラウザにそのままHTML要素として解釈された
- サーバーサイドレンダリングされた初回HTML内に埋め込まれているため、`innerHTML` 経由の動的注入とは異なり、ブラウザのHTMLパース時に素直に `<script>` が実行される

## Fix

`src/views/search.ejs` の `q`・`item.author`・`item.body`・`item.likes` の出力タグを、すべて `<%- %>`(エスケープなし)から `<%= %>`(エスケープあり)に変更した。

**確認**: Attackで使った `<script>alert(1)</script>` を再度投入し、アラートが発生せず画面上に文字列としてそのまま(エスケープされた形で)表示されることを確認した。
