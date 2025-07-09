# リアルタイムアンケートツール

このツールは、Next.js、Supabase、Socket.IO を使用して構築されたリアルタイムのオーディエンス反応ツールです。

## 機能

- **リアルタイム更新:** Socket.IO を使用して、質問と結果がリアルタイムで更新されます。
- **複数の質問タイプ:** 単一選択、複数選択、自由入力の質問タイプをサポートしています。
- **プレゼンタービュー:** プレゼンターが質問と結果を聴衆に表示するための専用ビューです。
- **管理者ビュー:** 管理者がイベントと質問を管理するための専用ビューです。
- **参加者ビュー:** 参加者が質問に回答するための専用ビューです。
- **招待制ユーザー登録:** 管理者のユーザー登録には招待コードが必要で、アクセスが制御されます。
- **プレゼンター画面のカスタマイズ:** 管理者はプレゼンター画面の背景色と文字色をカスタマイズできます。ピックアップされた回答は、最適な視認性のために文字色が自動的に調整されます。

## 技術スタック

- **フレームワーク:** [Next.js](https://nextjs.org/)
- **バックエンド:** [Supabase](https://supabase.io/)
- **リアルタイム:** [Socket.IO](https://socket.io/)
- **UI:** [Radix UI](https://www.radix-ui.com/) および [Tailwind CSS](https://tailwindcss.com/)
- **状態管理:** [Zustand](https://zustand-demo.pmnd.rs/)
- **ドキュメンテーション:** [TypeDoc](https://typedoc.org/)

## はじめに

### 前提条件

- Node.js (v18 以降)
- npm
- Supabase アカウント

### インストール

1. **リポジトリをクローンします:**

   ```bash
   git clone https://github.com/your-username/rtsv.git
   cd rtsv
   ```

2. **依存関係をインストールします:**

   ```bash
   npm install
   ```

3. **環境変数を設定します:**

   プロジェクトのルートに `.env.local` ファイルを作成し、Supabase の URL と anon キーを追加します。`.env.local.example` ファイルをテンプレートとして使用できます。

   ```
   NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
   ```

4. **Supabase データベースを設定します:**

   Supabase プロジェクトの `supabase/migrations` ディレクトリにある SQL スクリプトを実行して、必要なテーブルと関数を作成します。Supabase CLI を使用できます。

   ```bash
   # ローカルプロジェクトを Supabase プロジェクトにリンクします (YOUR_PROJECT_REF を置き換えてください)
   supabase link --project-ref YOUR_PROJECT_REF

   # マイグレーションを Supabase データベースにプッシュします
   supabase db push
   ```

   または、ローカル開発のために、Supabase CLIを使用してSupabaseをローカルで実行できます。

   1.  **Supabase CLIのインストール:**
       まだインストールしていない場合は、Supabase CLIをインストールします。
       ```bash
       brew install supabase/supabase/supabase # macOS
       # または、お使いのOSの手順に従ってください: https://supabase.com/docs/guides/cli/getting-started#install-the-cli
       ```

   2.  **ローカルSupabaseサービスの開始:**
       `supabase`ディレクトリに移動し、ローカルサービスを開始します。
       ```bash
       cd supabase
       supabase start
       ```
       これにより、ローカルのSupabase URLとanonキーが出力されます。これらの値で`.env.local`ファイルを更新してください。

   3.  **ローカルSupabaseへのマイグレーションの適用:**
       プロジェクトのルートから、ローカルのSupabaseインスタンスにマイグレーションをプッシュします。
       ```bash
       supabase db push
       ```

   4.  **ローカルデータベースのシード (オプション):**
       初期データ用の`seed.sql`ファイル（例: `supabase/seed.sql`）がある場合は、それを実行できます。
       ```bash
       supabase db seed
       ```

   **注:** マイグレーションで定義されている `invite_codes` テーブルと `signup_with_invite` 関数が作成されていることを確認してください。また、`events` テーブルには `background_color` と `text_color` カラムが追加されています。最初の招待コードについては、Supabase ダッシュボードから `invite_codes` テーブルに手動で挿入する必要があります。

5. **開発サーバーを起動します:**

   ```bash
   npm run dev
   ```

   デフォルトでは、アプリケーションはポート `3000` で動作します。`PORT` 環境変数を設定することで、これを変更できます。
   ```bash
   PORT=4000 npm run dev
   ```
   ポートを変更した場合は、Nginxの設定で `proxy_pass` ディレクティブを適切に更新することを忘れないでください。

   ブラウザで [http://localhost:3000](http://localhost:3000) を開いて結果を確認します。

## 使用方法

- **管理者ダッシュボード:** `/admin`
  - 登録には有効な招待コードを使用したユーザーログインが必要です。
  - ログインしているユーザーのみがイベントを作成および管理できます。
  - **表示設定:** プレゼンター画面の背景色と文字色をカスタマイズできます。
- **プレゼンタービュー:** `/presenter/[eventId]`
  - 公開アクセス可能です。特定のイベントのリアルタイム結果を表示します。
- **参加者ビュー:** `/event/[accessCode]`
  - 公開アクセス可能です。参加者が特定のイベントの質問に回答できます。

## 招待コード管理 (システム管理者向け)

新しいユーザーを管理者として登録できるようにするには、招待コードを発行する必要があります。現在、これは手動で行われます。

1.  Supabase プロジェクトのダッシュボードに移動します。
2.  `Table Editor` に移動します。
3.  `invite_codes` テーブルを選択します。
4.  以下の詳細を含む新しい行を挿入します。
    - `code`: ユニークな文字列 (例: `MYSECRETINVITE`)
    - `max_uses`: このコードが使用できる最大回数 (例: 1 回限りの場合は `1`、無制限の場合は `0`)
    - `expires_at`: コードが期限切れになる将来のタイムスタンプ (例: `2025-12-31T23:59:59Z`)

ユーザーは、サインアッププロセス中にこの `code` を使用できます。

## ドキュメント生成

JSDoc コメントから API ドキュメントを生成するには:

```bash
npm run docs
```

生成された HTML ドキュメントは `./docs` ディレクトリにあります。ブラウザで `docs/index.html` を開いて確認してください。

## ライブドキュメント

最新のAPIドキュメントは、[https://sasagar.github.io/rtsv/](https://sasagar.github.io/rtsv/) で自動的にデプロイされ、利用可能です。