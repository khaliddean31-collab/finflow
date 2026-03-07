import { supabase } from "./supabase";
import type { Company, Transaction } from "./data";

// ─── Profile ──────────────────────────────────────────────────────────────────

export type Profile = {
    id: string;
    full_name: string;
    avatar_url?: string;
    created_at?: string;
    updated_at?: string;
};

export async function upsertProfile(userId: string, fullName: string) {
    const { data, error } = await supabase
        .from("profiles")
        .upsert(
            { id: userId, full_name: fullName, updated_at: new Date().toISOString() },
            { onConflict: "id" }
        )
        .select()
        .single();

    if (error) return { profile: null, error: { message: error.message } };
    return { profile: data as Profile, error: null };
}

export async function getProfile(userId: string) {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (error) return { profile: null, error: { message: error.message } };
    return { profile: data as Profile, error: null };
}

// ─── Company ──────────────────────────────────────────────────────────────────

export type CompanyRow = {
    id: string;
    owner_id: string;
    name: string;
    currency: string;
    join_code: string;
    created_at?: string;
    updated_at?: string;
};

export async function createCompany(
    ownerId: string,
    company: Pick<Company, "name" | "currency" | "joinCode">
) {
    const { data, error } = await supabase
        .from("companies")
        .insert({
            owner_id: ownerId,
            name: company.name,
            currency: company.currency,
            join_code: company.joinCode,
        })
        .select()
        .single();

    if (error) return { company: null, error: { message: error.message } };
    return { company: data as CompanyRow, error: null };
}

/**
 * Fetch the company for a user — checks ownership first, then membership.
 */
export async function getUserCompany(userId: string) {
    // 1. Check if user owns a company
    const { data: owned } = await supabase
        .from("companies")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (owned) return { company: owned as CompanyRow, error: null };

    // 2. Check if user is a member of a company
    const { data: membership } = await supabase
        .from("company_members")
        .select("companies(*)")
        .eq("user_id", userId)
        .order("joined_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (membership?.companies) {
        return { company: membership.companies as unknown as CompanyRow, error: null };
    }

    return { company: null, error: { message: "No company found" } };
}

export async function findCompanyByJoinCode(joinCode: string) {
    const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("join_code", joinCode.trim().toUpperCase())
        .maybeSingle();

    if (error || !data) return { company: null, error: { message: "Invalid join code" } };
    return { company: data as CompanyRow, error: null };
}

/**
 * Record that a user has joined a company as a member (role: 'member').
 */
export async function joinCompany(userId: string, companyId: string) {
    const { error } = await supabase
        .from("company_members")
        .upsert(
            { user_id: userId, company_id: companyId, role: "member", joined_at: new Date().toISOString() },
            { onConflict: "user_id,company_id" }
        );

    if (error) return { error: { message: error.message } };
    return { error: null };
}

export async function updateCompany(
    companyId: string,
    updates: Partial<Pick<Company, "name" | "currency">>
) {
    const { data, error } = await supabase
        .from("companies")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", companyId)
        .select()
        .single();

    if (error) return { company: null, error: { message: error.message } };
    return { company: data as CompanyRow, error: null };
}

// ─── Member Management ────────────────────────────────────────────────────────

export type MemberRow = {
    user_id: string;
    company_id: string;
    role: "member" | "admin";
    joined_at?: string;
    profiles: {
        full_name: string | null;
        avatar_url: string | null;
    } | null;
};

/**
 * Fetch all members of a company (including owner who is admin).
 */
export async function getCompanyMembers(companyId: string) {
    const { data, error } = await supabase
        .from("company_members")
        .select("user_id, company_id, role, joined_at, profiles(full_name, avatar_url)")
        .eq("company_id", companyId)
        .order("joined_at", { ascending: true });

    if (error) return { members: [], error: { message: error.message } };
    // Supabase returns profiles as array; normalize to single object
    const members: MemberRow[] = (data ?? []).map((row: unknown) => {
        const r = row as {
            user_id: string;
            company_id: string;
            role: "member" | "admin";
            joined_at?: string;
            profiles: { full_name: string | null; avatar_url: string | null }[] | { full_name: string | null; avatar_url: string | null } | null;
        };
        const profilesRaw = r.profiles;
        const profile = Array.isArray(profilesRaw)
            ? (profilesRaw[0] ?? null)
            : profilesRaw;
        return {
            user_id: r.user_id,
            company_id: r.company_id,
            role: r.role,
            joined_at: r.joined_at,
            profiles: profile,
        };
    });
    return { members, error: null };
}

/**
 * Fetch the number of members in a company (owner is included as admin).
 */
export async function getCompanyMemberCount(companyId: string) {
    const { count, error } = await supabase
        .from("company_members")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

    if (error) return { count: 1, error: { message: error.message } };
    return { count: count ?? 1, error: null };
}

/**
 * Get the current user's role in a company.
 */
export async function getCurrentUserRole(userId: string, companyId: string) {
    const { data, error } = await supabase
        .from("company_members")
        .select("role")
        .eq("user_id", userId)
        .eq("company_id", companyId)
        .maybeSingle();

    if (error || !data) return { role: "member" as const };
    return { role: data.role as "member" | "admin" };
}

/**
 * Update role of a member (admin → member or member → admin).
 * Only admins can call this (also enforced via RLS).
 */
export async function updateMemberRole(userId: string, companyId: string, role: "member" | "admin") {
    const { error } = await supabase
        .from("company_members")
        .update({ role })
        .eq("user_id", userId)
        .eq("company_id", companyId);

    if (error) return { error: { message: error.message } };
    return { error: null };
}

/**
 * Remove a member from a company.
 */
export async function removeMember(userId: string, companyId: string) {
    const { error } = await supabase
        .from("company_members")
        .delete()
        .eq("user_id", userId)
        .eq("company_id", companyId);

    if (error) return { error: { message: error.message } };
    return { error: null };
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export type TransactionRow = {
    id: string;
    company_id: string;
    user_id: string;
    title: string;
    amount: number;
    category: string;
    type: "income" | "expense";
    date: string;
    note?: string;
    created_at?: string;
};

export async function getTransactions(companyId: string) {
    const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("company_id", companyId)
        .order("date", { ascending: false });

    if (error) return { transactions: [], error: { message: error.message } };
    return { transactions: (data ?? []) as TransactionRow[], error: null };
}

export async function addTransaction(
    companyId: string,
    userId: string,
    tx: Omit<Transaction, "id">
) {
    const { data, error } = await supabase
        .from("transactions")
        .insert({
            company_id: companyId,
            user_id: userId,
            title: tx.title,
            amount: tx.amount,
            category: tx.category,
            type: tx.type,
            date: tx.date,
            note: tx.note ?? null,
        })
        .select()
        .single();

    if (error) return { transaction: null, error: { message: error.message } };
    return { transaction: data as TransactionRow, error: null };
}

export async function deleteTransaction(transactionId: string) {
    const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId);

    if (error) return { error: { message: error.message } };
    return { error: null };
}
