
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const generateAccessCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function CreateEvent() {
  const [eventName, setEventName] = useState('');
  const router = useRouter();

  const handleCreateEvent = async () => {
    if (!eventName.trim()) {
      alert('イベント名を入力してください。');
      return;
    }

    const accessCode = generateAccessCode();
    const { data, error } = await supabase
      .from('events')
      .insert([{ name: eventName, access_code: accessCode }])
      .select();

    if (error) {
      console.error('Error creating event:', error);
      alert('イベントの作成に失敗しました。');
    } else if (data) {
      router.push(`/admin/${data[0].id}`);
    }
  };

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="mb-6 text-center text-3xl font-bold">新しいイベントを作成</h1>
        <div className="mb-4">
          <Label htmlFor="eventName" className="sr-only">イベント名</Label>
          <Input
            id="eventName"
            placeholder="イベント名"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="w-full"
          />
        </div>
        <Button
          onClick={handleCreateEvent}
          className="w-full py-2 text-lg"
        >
          作成
        </Button>
      </div>
    </div>
  );
}
