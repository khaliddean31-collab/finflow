import { supabase } from "./supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthError = { message: string };

export type RegisterPayload = {
    email: string;
    password: string;
    fullName: string;
};

export type LoginPayload = {
    email: string;
    password: string;
};

// ─── Auth Functions ───────────────────────────────────────────────────────────

/**
 * Register a new user with email & password.
 * Also inserts a row into the `profiles` table.
 */
export async function register({ email, password, fullName }: RegisterPayload) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
        },
    });

    if (error) return { user: null, error: { message: error.message } };
    return { user: data.user, error: null };
}

/**
 * Sign in an existing user with email & password.
 */
export async function login({ email, password }: LoginPayload) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) return { user: null, session: null, error: { message: error.message } };
    return { user: data.user, session: data.session, error: null };
}

/**
 * Sign out the current user.
 */
export async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) return { error: { message: error.message } };
    return { error: null };
}

/**
 * Get the current authenticated session.
 */
export async function getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) return { session: null, error: { message: error.message } };
    return { session: data.session, error: null };
}

/**
 * Get the current authenticated user.
 */
export async function getUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) return { user: null, error: { message: error.message } };
    return { user: data.user, error: null };
}
