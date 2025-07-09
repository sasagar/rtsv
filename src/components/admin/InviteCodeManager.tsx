'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInviteCodes } from '@/hooks/useInviteCodes';
import { Toaster } from '@/components/ui/sonner';
import { format } from 'date-fns';

/**
 * InviteCodeManager component provides an interface for administrators to manage invite codes.
 * It allows adding new invite codes and viewing existing ones.
 * @returns {JSX.Element} The rendered InviteCodeManager component.
 */
export default function InviteCodeManager() {
  const { inviteCodes, loading, error, addInviteCode } = useInviteCodes();
  const [newCode, setNewCode] = useState('');
  const [maxUses, setMaxUses] = useState<number>(1);
  const [expiresAt, setExpiresAt] = useState<string>('');

  /**
   * Handles the addition of a new invite code.
   * Validates input fields and calls the `addInviteCode` function from the `useInviteCodes` hook.
   * @async
   * @returns {Promise<void>}
   */
  const handleAddCode = async () => {
    if (!newCode.trim() || !expiresAt) {
      alert('コードと有効期限を入力してください。');
      return;
    }
    await addInviteCode(newCode, maxUses, expiresAt);
    setNewCode('');
    setMaxUses(1);
    setExpiresAt('');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>新しい招待コードを追加</CardTitle>
          <CardDescription>ユーザー登録用の招待コードを発行します。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">招待コード</Label>
              <Input
                id="code"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="例: MYSECRETCODE"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="max-uses">最大使用回数</Label>
              <Input
                id="max-uses"
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(Number(e.target.value))}
                min={0}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expires-at">有効期限</Label>
              <Input
                id="expires-at"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <Button onClick={handleAddCode}>コードを追加</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>既存の招待コード</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>読み込み中...</p>
          ) : error ? (
            <p className="text-red-500">エラー: {error}</p>
          ) : inviteCodes.length === 0 ? (
            <p>招待コードはありません。</p>
          ) : (
            <div className="grid gap-4">
              {inviteCodes.map((invite) => (
                <Card key={invite.id} className="p-4">
                  <p><strong>コード:</strong> {invite.code}</p>
                  <p><strong>使用状況:</strong> {invite.uses} / {invite.max_uses === 0 ? '無制限' : invite.max_uses}</p>
                  <p><strong>有効期限:</strong> {format(new Date(invite.expires_at), 'yyyy/MM/dd HH:mm')}</p>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}
