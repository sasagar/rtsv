import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The home page component for the Real-time Survey Tool.
 * Provides entry points for different user roles: Admin, Presenter, and Audience.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 bg-gray-50 dark:bg-gray-900">
      <main className="w-full max-w-4xl space-y-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-6xl">
          リアルタイムアンケートツール
        </h1>
        <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-300">
          インタラクティブなセッション、プレゼンテーション、イベントでリアルタイムのフィードバックを収集します。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {/* Admin Card */}
          <Card className="flex flex-col items-center p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">管理者</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <CardDescription className="text-center">
                イベントの作成、質問の管理、結果の表示を行います。
              </CardDescription>
              <Link href="/admin" passHref>
                <Button className="w-full">管理者ダッシュボードへ</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Audience Card */}
          <Card className="flex flex-col items-center p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">参加者</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <CardDescription className="text-center">
                イベントのアクセスコードを入力して参加します。
              </CardDescription>
              <form className="w-full space-y-2">
                <Label htmlFor="access-code" className="sr-only">アクセスコード</Label>
                <Input id="access-code" placeholder="アクセスコードを入力" className="text-center" />
                <Button type="submit" className="w-full">イベントに参加</Button>
              </form>
            </CardContent>
          </Card>

          {/* Presenter Card */}
          <Card className="flex flex-col items-center p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">プレゼンター</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <CardDescription className="text-center">
                ライブ結果を聴衆に表示します。
              </CardDescription>
              <Link href="/presenter/YOUR_EVENT_ID" passHref> {/* Placeholder for event ID */}
                <Button className="w-full">プレゼンタービューへ</Button>
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                ※イベントIDは管理者ダッシュボードで確認してください。
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="mt-12 text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Real-time Survey Tool. All rights reserved.
      </footer>
    </div>
  );
}