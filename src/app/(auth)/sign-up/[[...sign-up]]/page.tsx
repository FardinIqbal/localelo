import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link href="/" className="text-[15px] font-medium tracking-tight text-white">
          LocalElo
        </Link>
        <Link
          href="/sign-in"
          className="text-[13px] text-zinc-500 hover:text-white transition-colors"
        >
          Sign in
        </Link>
      </nav>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-6">
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto w-full max-w-sm",
              card: "bg-transparent shadow-none border-0 p-0",
              headerTitle: "text-[28px] font-semibold tracking-tight text-white text-center",
              headerSubtitle: "text-[14px] text-zinc-500 text-center",
              socialButtonsBlockButton:
                "bg-transparent border border-zinc-800 text-white hover:bg-zinc-900 hover:border-zinc-700 rounded-full transition-colors",
              socialButtonsBlockButtonText: "text-[13px] font-medium",
              formFieldLabel: "text-[13px] text-zinc-500",
              formFieldInput:
                "bg-transparent border-0 border-b border-zinc-800 rounded-none text-[15px] text-white placeholder:text-zinc-700 focus:border-zinc-600 focus:ring-0",
              formButtonPrimary:
                "bg-white hover:bg-zinc-200 text-black text-[13px] font-medium rounded-full transition-colors",
              footerActionLink: "text-zinc-400 hover:text-white transition-colors text-[13px]",
              dividerLine: "bg-zinc-800",
              dividerText: "text-[12px] text-zinc-600",
              formFieldInputShowPasswordButton: "text-zinc-600 hover:text-zinc-400",
              identityPreviewEditButton: "text-zinc-400 hover:text-white",
              formResendCodeLink: "text-zinc-400 hover:text-white text-[13px]",
              footer: "hidden",
            },
          }}
        />
      </div>
    </div>
  );
}
