import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

/**
 * Represents an invite code object.
 * @interface
 */
interface InviteCode {
  id: number;
  code: string;
  max_uses: number;
  uses: number;
  expires_at: string;
  created_at: string;
}

/**
 * Defines the shape of the return object for the `useInviteCodes` hook.
 * @interface
 */
interface UseInviteCodesResult {
  /** An array of invite code objects. */
  inviteCodes: InviteCode[];
  /** Indicates if data is currently being loaded. */
  loading: boolean;
  /** Any error message that occurred during operations. */
  error: string | null;
  /**
   * Function to add a new invite code.
   * @param {string} code - The invite code string.
   * @param {number} maxUses - The maximum number of uses for the code.
   * @param {string} expiresAt - The expiration date and time of the code in ISO format.
   * @returns {Promise<void>}
   */
  addInviteCode: (code: string, maxUses: number, expiresAt: string) => Promise<void>;
  /**
   * Function to fetch the latest list of invite codes from the API.
   * @returns {Promise<void>}
   */
  fetchInviteCodes: () => Promise<void>;
}

/**
 * Custom hook for managing invite codes.
 * Provides functionality to fetch, add, and manage the state of invite codes.
 * @returns {UseInviteCodesResult} An object containing invite codes data, loading state, error, and functions to manipulate invite codes.
 */
export const useInviteCodes = (): UseInviteCodesResult => {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches the list of invite codes from the API.
   * @async
   * @returns {Promise<void>}
   */
  const fetchInviteCodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Supabase セッションからアクセストークンを取得
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session in useInviteCodes:', session);
      if (!session) {
        throw new Error('No active session. Please log in.');
      }

      const response = await fetch('/api/invite-codes', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Error fetching invite codes: ${response.statusText}`);
      }
      const data: InviteCode[] = await response.json();
      setInviteCodes(data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Adds a new invite code via the API.
   * @async
   * @param {string} code - The invite code string.
   * @param {number} maxUses - The maximum number of uses for the code.
   * @param {string} expiresAt - The expiration date and time of the code in ISO format.
   * @returns {Promise<void>}
   */
  const addInviteCode = useCallback(async (code: string, maxUses: number, expiresAt: string) => {
    setError(null);
    try {
      const response = await fetch('/api/invite-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, max_uses: maxUses, expires_at: expiresAt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error adding invite code: ${response.statusText}`);
      }

      const newCode: InviteCode = await response.json();
      setInviteCodes(prevCodes => [newCode, ...prevCodes]);
      toast.success('招待コードが正常に追加されました。');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    }
  }, []);

  useEffect(() => {
    fetchInviteCodes();
  }, [fetchInviteCodes]);

  return {
    inviteCodes,
    loading,
    error,
    addInviteCode,
    fetchInviteCodes,
  };
};
