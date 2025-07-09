import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Handles GET requests to retrieve invite codes.
 * Only authenticated users can access this endpoint.
 * Administrators can retrieve all invite codes, while other users can only retrieve codes they created.
 * @param {Request} request - The incoming request object.
 * @returns {Promise<NextResponse>} A promise that resolves to a Next.js response object.
 */
export async function GET(request: Request) {
  try {
    console.log('Request headers in /api/invite-codes GET:', request.headers);
    console.log('SUPABASE_JWT_SECRET in API route:', process.env.SUPABASE_JWT_SECRET);

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    let user = null;
    if (token) {
      const { data } = await supabaseAdmin.auth.getUser(token); // トークンを渡す
      user = data.user;
    }

    console.log('User in /api/invite-codes GET:', user);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーのロールを取得
    const userRole = user.app_metadata?.claims?.role;

    let query = supabaseAdmin.from('invite_codes').select('*');

    // admin ロールでなければ、自分が作成した招待コードのみに制限
    if (userRole !== 'admin') {
      query = query.eq('created_by_user_id', user.id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invite codes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    console.error('API error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/**
 * Handles POST requests to create a new invite code.
 * Only authenticated users with the 'admin' role can create invite codes.
 * @param {Request} request - The incoming request object.
 * @returns {Promise<NextResponse>} A promise that resolves to a Next.js response object.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    let user = null;
    if (token) {
      const { data } = await supabaseAdmin.auth.getUser(token); // トークンを渡す
      user = data.user;
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ユーザーのロールを取得
    const userRole = user.app_metadata?.claims?.role;

    // admin ロールを持つユーザーのみが招待コードを発行できるようにする
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only admin users can create invite codes' }, { status: 403 });
    }

    const { code, max_uses, expires_at } = await request.json();

    if (!code || !max_uses || !expires_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('invite_codes')
      .insert([{ code, max_uses, expires_at, created_by_user_id: user.id }]) // created_by_user_id を追加
      .select();

    if (error) {
      console.error('Error creating invite code:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (e: any) {
    console.error('API error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
