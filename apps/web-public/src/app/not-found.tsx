import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center gap-3 py-24 text-center">
      <h1 className="text-2xl font-bold">We couldn&apos;t find that</h1>
      <p className="text-muted-foreground">The business or page you&apos;re looking for doesn&apos;t exist or isn&apos;t live yet.</p>
      <Link href="/" className="mt-2 text-sm font-medium text-primary hover:underline">
        Back to home
      </Link>
    </div>
  );
}
