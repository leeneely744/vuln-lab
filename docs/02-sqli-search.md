# 検索機能のSQLインジェクション(UNIONベース)

対象: `GET /search?q=...`

## Build(脆弱にした実装)

- `src/routes/search.ts` で `req.query.q` を文字列結合でSQL文に埋め込んでいる:
  `SELECT * FROM comments WHERE body LIKE '%${q}%';`
- プレースホルダ(バインドパラメータ)を使わず、テンプレートリテラルで直接組み立てているため、`q`の中身次第でSQL文の構造そのものを変えられる

## Attack

### Step 1: 注入点の確認

検索欄に `'` (シングルクォート1文字)を入力。

**結果**: SQL構文エラーが発生。

```
SqliteError: unrecognized token: "'; "
```

`q`がクォートで囲まれた文字列リテラルの一部としてではなく、SQL文の構造の一部として解釈されていることを確認。

### Step 2: カラム数の特定

`UNION SELECT`で他テーブルのデータを取得するには、元クエリと同じカラム数が必要。`x' UNION SELECT NULL-- ` からNULLの数を1つずつ増やして試行。

**結果**: NULLが5個のときにエラーが解消。`comments`テーブルのカラム数(id, author, body, likes, created_at)と一致することを確認。

```sql
x' UNION SELECT NULL,NULL,NULL,NULL,NULL--
```

### Step 3(寄り道): スタックドクエリの試行 → 失敗

`information_schema`からカラム一覧を取得しようとして以下を試行:

```sql
x';select columns from information_schema.columns where table_name='comments';'
```

**結果**: `RangeError: The supplied SQL string contains more than one statement` で失敗。

**失敗の理由は2つ**
1. `better-sqlite3`の`.prepare()`は、渡されたSQL文字列に複数のステートメント(`;`区切り)が含まれているとエラーを返す仕様になっている(スタックドクエリ対策がライブラリレベルで組み込まれている)。`db.exec()`なら複数文を実行できるが、`search.ts`では`.prepare().all()`を使っているためこの経路は塞がれている。
2. そもそも`information_schema`はMySQL/PostgreSQL/SQL Server系の概念で、SQLiteには存在しない。SQLiteでスキーマ情報を調べる場合は`sqlite_master`(テーブル一覧)や`pragma_table_info('テーブル名')`(カラム一覧)を使う。

→ 今回は自作アプリでスキーマを事前に知っていたため実害はなかったが、実戦では単一SELECT文の中で`sqlite_master`等を使った偵察が必要になる。

### Step 4: UNIONベースでの実データ抽出

カラム数(5)と`comments`のカラム順(id, author, body, likes, created_at)が分かっているので、画面に表示される2番目・3番目の位置(`author`・`body`)に`secrets`テーブルの`label`・`value`を割り当てて抽出:

```sql
x' UNION SELECT NULL,s.label,s.value,NULL,NULL FROM secrets as s--
```

**結果**: 検索結果に `api_key:1a1a1a` が表示され、`secrets`テーブルの中身を外部から抽出できることを確認。

### 補足: なぜ`author`・`body`の位置に`label`・`value`が表示されるのか

`UNION`で結合した結果セットの列名は、**最初のSELECT文(`comments`側)の列名がそのまま使われる**。2つ目のSELECT文(`secrets`側)がどんな列名・エイリアスを付けていても無視され、**位置だけで値がマッピングされる**ため、`s.label`・`s.value`は結果セット上では2番目・3番目の位置にある値として扱われ、`author`・`body`という名前が(実体とは無関係に)割り当てられる。

`search.ejs`側は`item.author`・`item.body`というプロパティ名だけを見て表示しているため、データの出どころが`comments`か`secrets`かを気にせずそのまま表示してしまう。これがUNIONベースSQLiでデータを抽出できる仕組みの本質。

実際に列名がどう見えるかを確認したスクリーンショット: [union_action.png](./union_action.png)

## 原因

- SQL文をプレースホルダ(バインドパラメータ)を使わず文字列結合で組み立てているため、ユーザー入力がSQL文の構造そのものに影響を与えられる
- `UNION SELECT`により、アプリが本来意図していない別テーブル(`secrets`)のデータを、正規のクエリ結果に混ぜて画面に表示させることができた

## Fix

`src/routes/search.ts` のSQL文をプレースホルダ(`?`)化し、`q`を文字列結合で埋め込むのをやめて `db.prepare(sql).all("%" + q + "%")` のようにバインドパラメータとして渡す形に変更した。あわせて `req.query.q` が文字列でない場合(配列・オブジェクト・undefined)に備えて `typeof q !== 'string'` の型ガードを追加した。

**確認**: Attackで使った `x' UNION SELECT NULL,s.label,s.value,NULL,NULL FROM secrets as s--` を再度投入し、`secrets`テーブルの内容が表示されないことを確認した。入力値がSQL文の構造に影響を与えなくなり、単なる検索キーワードの一部として扱われるようになったため。
