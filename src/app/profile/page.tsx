"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { useOptionalAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { fetchProfileStatsFromApi } from "@/lib/content/api-client";
import { isBrowserSupabaseConfigured } from "@/lib/supabase/browser";

export default function ProfilePage() {
  const auth = useOptionalAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["profile-stats", auth?.userId ?? "anon"],
    queryFn: () => fetchProfileStatsFromApi(auth?.getAuthHeaders()),
  });

  return (
    <main className="mx-auto max-w-2xl space-y-8 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your stats</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reading and listening across your library
          </p>
        </div>
        <Button
          variant="outline"
          nativeButton={false}
          className="rounded-xl"
          render={<Link href="/" />}
        >
          Library
        </Button>
      </div>

      {isLoading || !stats ? (
        <p className="text-sm text-muted-foreground">Loading stats…</p>
      ) : (
        <dl className="grid grid-cols-2 gap-4">
          <StatCard label="Books created" value={stats.booksCreated} />
          <StatCard label="Books finished" value={stats.booksFinished} />
          <StatCard label="Hours read" value={stats.hoursRead} />
          <StatCard label="Hours listened" value={stats.hoursListened} />
          <StatCard
            label="Favorite category"
            value={stats.favoriteCategory ?? "—"}
          />
          <StatCard label="Longest streak" value={`${stats.longestStreakDays} days`} />
        </dl>
      )}

      {isBrowserSupabaseConfigured() && (
        <section className="rounded-2xl border border-border/60 p-5">
          <h2 className="text-sm font-semibold">Sync across devices</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with your Chrysty account to merge progress from this browser
            and continue on any device.
          </p>
          {auth?.email ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="text-sm">
                Signed in as <span className="font-medium">{auth.email}</span>
              </p>
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => void auth.signOut()}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <Button className="mt-4 rounded-xl" onClick={() => auth?.signIn()}>
              Sign in with Chrysty
            </Button>
          )}
        </section>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-card">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-2 text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
