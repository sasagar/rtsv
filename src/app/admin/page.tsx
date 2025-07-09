
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Edit } from 'lucide-react'; // アイコンを追加
import Link from 'next/link'; // Link コンポーネントを追加

/**
 * Generates a random 6-character uppercase access code.
 * @returns {string} The generated access code.
 */
const generateAccessCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Represents an event managed by an administrator.
 * @interface
 */
interface Event {
  id: number;
  name: string;
  access_code: string;
  user_id: string;
}

/**
 * The administration page for managing events.
 * Allows administrators to create, view, edit, and delete their events.
 * @returns {JSX.Element} The rendered admin page.
 */
export default function AdminPage() {
  const [eventName, setEventName] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [editingEventId, setEditingEventId] = useState<number | null>(null); // 編集中のイベントID
  const [editingEventName, setEditingEventName] = useState(''); // 編集中のイベント名
  const router = useRouter();
  const { user, loading } = useAuth();

  /**
   * Fetches events associated with the currently logged-in user from Supabase.
   * @async
   * @returns {Promise<void>}
   */
  const fetchEvents = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id); // ログインユーザーのイベントのみ取得

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data || []);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
    if (user) {
      fetchEvents();
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  /**
   * Handles the creation of a new event.
   * Generates a unique access code and inserts the event into the Supabase database.
   * @async
   * @returns {Promise<void>}
   */
  const handleCreateEvent = async () => {
    console.log('User object at event creation:', user);
    console.log('User ID at event creation:', user?.id);

    const { data: { session } } = await supabase.auth.getSession();
    console.log('Session before event creation:', session);

    if (!eventName.trim()) {
      alert('イベント名を入力してください。');
      return;
    }

    let accessCode = '';
    let data = null;
    let error = null;
    const MAX_ATTEMPTS = 5;

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      accessCode = generateAccessCode();
      const result = await supabase
        .from('events')
        .insert([{ name: eventName, access_code: accessCode, user_id: user.id }])
        .select();

      data = result.data;
      error = result.error;

      if (!error) {
        break;
      }

      if (error.code === '23505' && error.details.includes('access_code')) {
        console.warn(`試行 ${i + 1}: アクセスコード "${accessCode}" は既に存在します。再試行中...`);
      } else {
        break;
      }
    }

    if (error) {
      console.error('Error creating event:', error);
      alert('イベントの作成に失敗しました。');
    } else if (data) {
      setEventName('');
      fetchEvents();
      router.push(`/admin/${data[0].id}`);
    }
  };

  /**
   * Handles the deletion of an event.
   * Confirms with the user before deleting the event from the Supabase database.
   * Only allows deletion of events owned by the current user.
   * @param {number} id - The ID of the event to delete.
   * @async
   * @returns {Promise<void>}
   */
  const handleDeleteEvent = async (id: number) => {
    if (!confirm('本当にこのイベントを削除しますか？')) {
      return;
    }
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // 自分のイベントのみ削除可能

    if (error) {
      console.error('Error deleting event:', error);
      alert('イベントの削除に失敗しました。');
    } else {
      fetchEvents(); // 削除後、一覧を更新
    }
  };

  /**
   * Handles the update of an event's name.
   * Updates the event name in the Supabase database.
   * Only allows updating of events owned by the current user.
   * @param {number} id - The ID of the event to update.
   * @async
   * @returns {Promise<void>}
   */
  const handleUpdateEvent = async (id: number) => {
    if (!editingEventName.trim()) {
      alert('イベント名を入力してください。');
      return;
    }
    const { error } = await supabase
      .from('events')
      .update({ name: editingEventName })
      .eq('id', id)
      .eq('user_id', user.id); // 自分のイベントのみ更新可能

    if (error) {
      console.error('Error updating event:', error);
      alert('イベントの更新に失敗しました。');
    } else {
      setEditingEventId(null);
      setEditingEventName('');
      fetchEvents(); // 更新後、一覧を更新
    }
  };

  return (
    <div className="container mx-auto flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow-sm mb-8">
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

      <div className="w-full max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h2 className="mb-6 text-center text-2xl font-bold">あなたのイベント</h2>
        {events.length === 0 ? (
          <p className="text-center text-gray-500">まだイベントがありません。</p>
        ) : (
          <ul>
            {events.map((event) => (
              <li key={event.id} className="mb-4 p-4 border rounded-md flex justify-between items-center">
                {editingEventId === event.id ? (
                  <div className="flex-grow mr-2">
                    <Input
                      value={editingEventName}
                      onChange={(e) => setEditingEventName(e.target.value)}
                      className="w-full"
                    />
                  </div>
                ) : (
                  // Link コンポーネントでラップ
                  <Link href={`/admin/${event.id}`} className="flex-grow mr-2">
                    <div>
                      <h3 className="text-lg font-semibold">{event.name}</h3>
                      <p className="text-sm text-gray-600">アクセスコード: {event.access_code}</p>
                    </div>
                  </Link>
                )}
                <div className="flex space-x-2">
                  {editingEventId === event.id ? (
                    <>
                      <Button variant="outline" size="icon" onClick={() => handleUpdateEvent(event.id)}>
                        保存
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setEditingEventId(null)}>
                        キャンセル
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="icon" onClick={() => {
                        setEditingEventId(event.id);
                        setEditingEventName(event.name);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDeleteEvent(event.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
