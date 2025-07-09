'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

/**
 * Header component for the application.
 * Displays navigation links, user's email (if logged in), and login/logout buttons.
 * Provides a link to the invite code management page for authenticated users.
 * @returns {JSX.Element} The rendered header component.
 */
export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();

  /**
   * Handles the user logout process.
   * Signs out the user from Supabase and redirects to the login page.
   * @async
   * @returns {Promise<void>}
   */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <header className="bg-primary text-primary-foreground p-4 flex justify-between items-center">
      <Link href="/">
        <h1 className="text-2xl font-bold">Real-time Survey</h1>
      </Link>
      <nav>
        {!loading && (
          user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm">{user.email}</span>
              <Link href="/admin"> {/* 管理画面へのリンクを追加 */}
                <Button variant="secondary" size="sm">
                  管理画面
                </Button>
              </Link>
              <Link href="/admin/invite-codes">
                <Button variant="secondary" size="sm">
                  招待コード管理
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="secondary" size="sm">
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="secondary" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="secondary" size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )
        )}
      </nav>
    </header>
  );
}
