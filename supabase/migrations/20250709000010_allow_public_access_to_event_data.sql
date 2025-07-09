-- events テーブルの SELECT ポリシーを修正 (認証されていないユーザーも参照可能に)
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;
CREATE POLICY "Allow public select on events"
ON public.events
FOR SELECT
USING (true);

-- questions テーブルの SELECT ポリシーを追加 (認証されていないユーザーも参照可能に)
-- 既存のポリシーがあれば DROP してから CREATE
DROP POLICY IF EXISTS "Allow public select on questions" ON public.questions;
CREATE POLICY "Allow public select on questions"
ON public.questions
FOR SELECT
USING (true);

-- answers テーブルの SELECT ポリシーを追加 (認証されていないユーザーも参照可能に)
-- 既存のポリシーがあれば DROP してから CREATE
DROP POLICY IF EXISTS "Allow public select on answers" ON public.answers;
CREATE POLICY "Allow public select on answers"
ON public.answers
FOR SELECT
USING (true);
