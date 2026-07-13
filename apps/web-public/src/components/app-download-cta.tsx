const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL || null;
const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL || null;

// Ordering, cart, checkout, and service enquiries are all native-app-only (Architecture §4)
// — this app is read-only. Every screen that would otherwise need a transactional action
// routes here instead of reimplementing commerce.
export function AppDownloadCta({ label = "Open in app to order" }: { label?: string }) {
  return (
    <div className="rounded-lg border bg-accent p-4 text-center">
      <p className="mb-3 text-sm font-medium text-accent-foreground">{label}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <a
          href={APP_STORE_URL || "#"}
          aria-disabled={!APP_STORE_URL}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          Download for iOS
        </a>
        <a
          href={PLAY_STORE_URL || "#"}
          aria-disabled={!PLAY_STORE_URL}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          Download for Android
        </a>
      </div>
    </div>
  );
}
