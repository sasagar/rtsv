'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import InviteCodeManager from '@/components/admin/InviteCodeManager';

/**
 * The page for managing invite codes.
 * This page is accessible only to authenticated administrators.
 * @returns {JSX.Element} The rendered invite codes management page.
 */
export default function InviteCodesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">招待コード管理</h1>
      <InviteCodeManager />
    </div>
  );
}
