import Link from "next/link";
import { Search } from "lucide-react";

export function Header() {
  return (
    <header className="border-b bg-background">
      <div className="container flex flex-wrap items-center gap-4 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-primary">
          Local Market
        </Link>
        <form action="/search" method="GET" className="flex min-w-0 flex-1 items-center">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              name="q"
              placeholder="Search shops, products, categories…"
              className="h-10 w-full rounded-full border border-input bg-background pl-9 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </form>
      </div>
    </header>
  );
}
