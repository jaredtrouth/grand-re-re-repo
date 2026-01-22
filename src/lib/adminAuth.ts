'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Create a Supabase client for server-side auth operations
 * Uses cookies for session management
 */
export async function createAuthClient() {
    const cookieStore = await cookies();

    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
            storage: {
                getItem: (key: string) => cookieStore.get(key)?.value ?? null,
                setItem: () => {
                    // Cookie setting is handled by the auth response
                },
                removeItem: () => {
                    // Cookie removal is handled by signOut
                },
            },
        },
    });
}

/**
 * Sign in with email and password
 */
export async function signInAdmin(email: string, password: string) {
    const supabase = await createAuthClient();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    // Set auth cookies
    const cookieStore = await cookies();

    if (data.session) {
        cookieStore.set('sb-access-token', data.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        cookieStore.set('sb-refresh-token', data.session.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });
    }

    return { success: true, user: data.user };
}

/**
 * Sign out current session
 */
export async function signOutAdmin() {
    const supabase = await createAuthClient();
    await supabase.auth.signOut();

    // Clear auth cookies
    const cookieStore = await cookies();
    cookieStore.delete('sb-access-token');
    cookieStore.delete('sb-refresh-token');

    return { success: true };
}

/**
 * Get current admin session
 */
export async function getAdminSession() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    const refreshToken = cookieStore.get('sb-refresh-token')?.value;

    if (!accessToken || !refreshToken) {
        return null;
    }

    const supabase = await createAuthClient();

    const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    if (error || !data.session) {
        return null;
    }

    // Refresh cookies if session was refreshed
    if (data.session.access_token !== accessToken) {
        cookieStore.set('sb-access-token', data.session.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        cookieStore.set('sb-refresh-token', data.session.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });
    }

    return data.session;
}
