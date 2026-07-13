import Link from "next/link";
import { listBusinessTypes, listCities } from "@/lib/api";
import { NearMeButton } from "@/components/near-me-button";

export default async function HomePage() {
  const [businessTypes, cities] = await Promise.all([listBusinessTypes(), listCities()]);

  return (
    <div className="container py-10">
      <section className="mb-10 rounded-2xl bg-accent px-6 py-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-accent-foreground sm:text-4xl">
          Shop local, delivered fast
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-accent-foreground/80">
          Groceries, medicines, food, salons, clinics, and more — from verified businesses in your neighborhood.
        </p>
        <div className="mt-6 flex justify-center">
          <NearMeButton />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Shop by category</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {businessTypes.map((type) => (
            <Link
              key={type.id}
              href={`/search?businessTypeId=${type.id}`}
              className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-center transition-shadow hover:shadow-md"
            >
              <span className="text-2xl" aria-hidden>
                {type.icon ?? "🏪"}
              </span>
              <span className="text-sm font-medium">{type.name}</span>
            </Link>
          ))}
          {businessTypes.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">No categories available yet.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Shop by city</h2>
        <div className="flex flex-wrap gap-2">
          {cities.map((city) => (
            <Link
              key={city.id}
              href={`/search?cityId=${city.id}`}
              className="rounded-full border px-4 py-1.5 text-sm hover:bg-muted"
            >
              {city.name}, {city.state}
            </Link>
          ))}
          {cities.length === 0 && <p className="text-sm text-muted-foreground">No cities available yet.</p>}
        </div>
      </section>
    </div>
  );
}
