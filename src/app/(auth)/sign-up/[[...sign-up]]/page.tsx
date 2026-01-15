import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#0a0a0a]">
      {/* Subtle noise texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Orange glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-orange-500/6 blur-[100px] rounded-full" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-orange-500 flex items-center justify-center">
            <span className="text-[10px] font-bold text-black">LE</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-white">LocalElo</span>
        </Link>
        <Link
          href="/sign-in"
          className="text-[13px] text-zinc-400 hover:text-white transition-colors"
        >
          Sign in
        </Link>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 pb-12">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-[24px] font-bold tracking-tight text-white">
              Create your account
            </h1>
            <p className="mt-2 text-[14px] text-zinc-500">
              Start tracking rankings in 60 seconds
            </p>
          </div>

          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none border-0 p-0 gap-4",
                header: "hidden",
                socialButtonsBlockButton:
                  "bg-zinc-900/50 border border-zinc-800 text-white hover:bg-zinc-800 hover:border-zinc-700 rounded-lg transition-all h-11",
                socialButtonsBlockButtonText: "text-[13px] font-medium",
                socialButtonsBlockButtonArrow: "text-zinc-500",
                dividerLine: "bg-zinc-800",
                dividerText: "text-[11px] text-zinc-600 uppercase tracking-wider",
                formFieldLabel: "text-[12px] text-zinc-500 font-medium uppercase tracking-wider",
                formFieldInput:
                  "bg-zinc-900/50 border border-zinc-800 rounded-lg text-[14px] text-white placeholder:text-zinc-600 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 h-11 px-4 transition-all",
                formFieldInputShowPasswordButton: "text-zinc-500 hover:text-zinc-300",
                formButtonPrimary:
                  "bg-orange-500 hover:bg-orange-400 text-black text-[13px] font-semibold rounded-lg transition-all h-11 shadow-lg shadow-orange-500/20",
                footerAction: "justify-center",
                footerActionText: "text-[13px] text-zinc-500",
                footerActionLink: "text-orange-500 hover:text-orange-400 transition-colors text-[13px] font-medium",
                identityPreviewEditButton: "text-zinc-400 hover:text-white text-[12px]",
                identityPreviewText: "text-[13px] text-zinc-300",
                formResendCodeLink: "text-orange-500 hover:text-orange-400 text-[13px]",
                otpCodeFieldInput: "bg-zinc-900/50 border-zinc-800 text-white",
                formFieldAction: "text-[12px] text-zinc-500 hover:text-zinc-300",
                formFieldHintText: "text-[11px] text-zinc-600",
                alert: "bg-red-500/10 border-red-500/20 text-red-400 rounded-lg text-[13px]",
                alertText: "text-red-400",
                footer: "hidden",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
