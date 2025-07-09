'use client';

import AuthForm from '@/components/auth/AuthForm';

/**
 * The sign-up page component.
 * Renders the authentication form initialized for user sign-up.
 * @returns {JSX.Element} The rendered sign-up page.
 */
export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <AuthForm isSignUpInitial={true} />
    </div>
  );
}
