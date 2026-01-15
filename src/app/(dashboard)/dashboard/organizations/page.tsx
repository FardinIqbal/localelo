"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Users,
  ChevronRight,
  Search,
  Trophy,
  Globe,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useState } from "react";

function OrgCard({ org }: { org: { name: string; slug: string; role: string; rank: number | null; rating: number | null; organizationId: unknown } }) {
  return (
    <Link href={`/org/${org.slug}`}>
      <Card className="group cursor-pointer transition-all hover:border-zinc-700 hover:bg-zinc-900">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <Users className="h-6 w-6 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold">{org.name}</h3>
              <Globe className="h-3.5 w-3.5 text-zinc-500" />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-zinc-400">/{org.slug}</p>
              {org.role === "Owner" && (
                <Badge variant="secondary" className="text-xs">
                  Owner
                </Badge>
              )}
              {org.role === "Admin" && (
                <Badge variant="secondary" className="text-xs">
                  Admin
                </Badge>
              )}
            </div>
            {org.rank && (
              <p className="mt-1 text-sm text-zinc-500">
                Rank #{org.rank} · {Math.round(org.rating ?? 1500)} rating
              </p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-zinc-600 transition-transform group-hover:translate-x-1 group-hover:text-zinc-400" />
        </CardContent>
      </Card>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardContent className="flex items-center gap-4 p-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 py-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
        <Users className="h-8 w-8 text-zinc-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold">No organizations yet</h3>
      <p className="mb-6 max-w-sm text-center text-sm text-zinc-400">
        Create your first organization to start tracking rankings and logging
        matches.
      </p>
      <Link href="/dashboard/new-org">
        <Button variant="glow" className="gap-2">
          <Plus className="h-4 w-4" />
          Create Organization
        </Button>
      </Link>
    </motion.div>
  );
}

export default function OrganizationsPage() {
  const [search, setSearch] = useState("");
  const orgs = useQuery(api.organizations.myOrganizations);
  const isLoading = orgs === undefined;

  const filteredOrgs = orgs
    ?.filter((org) => org !== null)
    .filter(
      (org) =>
        org.name.toLowerCase().includes(search.toLowerCase()) ||
        org.slug.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-zinc-400">
            Manage all your gyms, clubs, and teams.
          </p>
        </div>
        <Link href="/dashboard/new-org">
          <Button variant="glow" className="gap-2">
            <Plus className="h-4 w-4" />
            New Organization
          </Button>
        </Link>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid gap-4 sm:grid-cols-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{orgs?.length ?? 0}</p>
              <p className="text-sm text-zinc-400">Total Orgs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Trophy className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {orgs?.filter((o) => o?.role === "Owner").length ?? 0}
              </p>
              <p className="text-sm text-zinc-400">You Own</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <Globe className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {orgs?.length ?? 0}
              </p>
              <p className="text-sm text-zinc-400">Public</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {isLoading ? (
          <LoadingSkeleton />
        ) : !orgs || orgs.length === 0 ? (
          <EmptyState />
        ) : filteredOrgs && filteredOrgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="mb-4 h-8 w-8 text-zinc-600" />
            <p className="text-sm text-zinc-400">
              No organizations match &quot;{search}&quot;
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrgs?.map((org, index) => (
              <motion.div
                key={String(org.organizationId)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <OrgCard org={org} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
