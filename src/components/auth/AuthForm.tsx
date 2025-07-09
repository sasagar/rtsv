'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Props for the AuthForm component.
 * @interface
 */
interface AuthFormProps {
  /**
   * Whether the form should initially be in sign-up mode.
   * @default false
   */
  isSignUpInitial?: boolean;
}

/**
 * A reusable authentication form component for user login and sign-up.
 * It supports invite-code based sign-up and redirects to the admin page on successful login.
 * @param {AuthFormProps} props - The component props.
 * @returns {JSX.Element} The rendered authentication form.
 */
export default function AuthForm({ isSignUpInitial = false }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(isSignUpInitial);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  /**
   * Handles the authentication process, either signing up a new user with an invite code
   * or signing in an existing user.
   * @async
   * @returns {Promise<void>}
   */
  const handleAuth = async () => {
    setError(null);
    setMessage(null);

    if (isSignUp) {
      // If invite code is valid, proceed with user signup
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            invite_code: inviteCode,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        // サインアップ成功後、自動的にログインさせる
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
        } else {
          setMessage('登録が完了しました。自動的にログインしました。');
          console.log('Sign-up successful, attempting auto-login.');
          const session = await supabase.auth.getSession();
          console.log('Session after sign-in:', session);
          const user = await supabase.auth.getUser();
          console.log('User after sign-in:', user);
          window.location.href = '/admin'; // 管理ページへリダイレクト
        }
      }
    } else {
      // Attempt to sign in
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        // Redirect to admin page on successful login
        window.location.href = '/admin';
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{isSignUp ? 'Sign Up' : 'Login'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {isSignUp && (
            <div className="grid gap-2">
              <Label htmlFor="invite-code">Invite Code</Label>
              <Input
                id="invite-code"
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
            </div>
          )}
          <Button onClick={handleAuth} className="w-full">
            {isSignUp ? 'Sign Up' : 'Login'}
          </Button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {message && <p className="text-green-500 text-sm">{message}</p>}
        </div>
        <div className="mt-4 text-center text-sm">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button onClick={() => setIsSignUp(false)} className="underline">
                Login
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button onClick={() => setIsSignUp(true)} className="underline">
                Sign Up
              </button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}