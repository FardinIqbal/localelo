"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

export default function NewOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  const createOrgMutation = useMutation(api.organizations.create);

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isPending) return;
    setError("");
    setIsPending(true);
    try {
      const orgId = await createOrgMutation({
        name: name.trim(),
        slug,
        visibility: "public",
      });
      // Get org by id to navigate to slug
      router.push(`/org/${slug}`);
    } catch (err: any) {
      setError(err.message || "Failed to create organization");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-zinc-600 transition-colors hover:text-zinc-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        <h1 className="mb-8 text-[28px] font-semibold tracking-tight">
          New organization
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Organization name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-0 border-b border-zinc-800 bg-transparent py-3 text-[17px] outline-none transition-colors placeholder:text-zinc-700 focus:border-zinc-600"
              autoFocus
            />
            {name && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-[12px] text-zinc-600"
              >
                localelo.com/org/{slug || "..."}
              </motion.p>
            )}
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[13px] text-red-400"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={!name.trim() || isPending}
            className="group flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-[14px] font-medium text-black transition-all hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            whileTap={{ scale: 0.98 }}
          >
            {isPending ? (
              <span className="text-zinc-600">Creating...</span>
            ) : (
              <>
                Create
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
