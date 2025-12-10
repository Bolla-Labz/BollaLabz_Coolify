import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">BollaLabz Command Center</h1>
      <p className="mt-4 text-muted-foreground">
        AI-powered personal command center
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/sign-in" className="text-primary hover:underline">
          Sign In
        </Link>
        <Link href="/sign-up" className="text-primary hover:underline">
          Sign Up
        </Link>
      </div>
      <footer className="absolute bottom-8 flex gap-4 text-sm text-muted-foreground">
        <Link href="/privacy" className="hover:underline">
          Privacy Policy
        </Link>
        <span>|</span>
        <Link href="/terms" className="hover:underline">
          Terms of Service
        </Link>
      </footer>
    </main>
  );
}