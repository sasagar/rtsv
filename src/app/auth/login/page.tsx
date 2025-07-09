'use client';

import AuthForm from '@/components/auth/AuthForm';

/**
 * The login page component.
 * Renders the authentication form for user login.
 * @returns {JSX.Element} The rendered login page.
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <AuthForm />
    </div>
  );
}
