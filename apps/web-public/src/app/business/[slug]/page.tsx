import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navigation, MapPin, Star } from "lucide-react";
import { Badge } from "@platform/ui";
import { ApiError, getBusinessBySlug, listProducts, listServices, listReviews } from "@/lib/api";
import { ProductCard } from "@/components/product-card";
import { ServiceCard } from "@/components/service-card";
import { ReviewRow } from "@/components/review-row";
import { AppDownloadCta } from "@/components/app-download-cta";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const business = await getBusinessBySlug(slug);
    return {
      title: business.name,
      description: business.description ?? `${business.name} — order from a verified local business near you.`,
    };
  } catch {
    return { title: "Business not found" };
  }
}

export default async function BusinessProfilePage({ params }: PageProps) {
  const { slug } = await params;

  let business;
  try {
    business = await getBusinessBySlug(slug);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const [products, services, reviews] = await Promise.all([
    listProducts(business.id),
    listServices(business.id),
    listReviews(business.id),
  ]);

  const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`;

  return (
    <div>
      <div className="h-48 w-full bg-muted sm:h-64">
        {business.bannerUrl && <img src={business.bannerUrl} alt="" className="h-full w-full object-cover" />}
      </div>

      <div className="container">
        <div className="-mt-12 flex items-end gap-4 sm:-mt-16">
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-background bg-card sm:h-32 sm:w-32">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt={business.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-muted-foreground">{business.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0 pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-bold">{business.name}</h1>
              <Badge>Verified</Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {avgRating !== null && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {avgRating.toFixed(1)} ({reviews.length})
                </span>
              )}
              <span className={business.isOpen ? "font-medium text-emerald-600 dark:text-emerald-400" : "font-medium text-destructive"}>
                {business.isOpen ? "Open now" : "Closed"}
              </span>
            </div>
          </div>
        </div>

        <div className="my-4 flex flex-wrap gap-2">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <Navigation className="h-4 w-4" />
            Directions
          </a>
          <span className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {business.addressLine}, {business.pinCode}
          </span>
          {business.deliveryEnabled && <Badge variant="outline">Delivery</Badge>}
          {business.pickupEnabled && <Badge variant="outline">Pickup</Badge>}
        </div>

        <nav className="mb-6 flex gap-5 overflow-x-auto border-b text-sm font-medium text-muted-foreground">
          {products.length > 0 && (
            <a href="#products" className="border-b-2 border-transparent py-2 hover:border-primary hover:text-foreground">
              Products
            </a>
          )}
          {services.length > 0 && (
            <a href="#services" className="border-b-2 border-transparent py-2 hover:border-primary hover:text-foreground">
              Services
            </a>
          )}
          <a href="#reviews" className="border-b-2 border-transparent py-2 hover:border-primary hover:text-foreground">
            Reviews
          </a>
          <a href="#about" className="border-b-2 border-transparent py-2 hover:border-primary hover:text-foreground">
            About
          </a>
        </nav>

        <div className="grid grid-cols-1 gap-8 pb-12 lg:grid-cols-3">
          <div className="space-y-10 lg:col-span-2">
            {products.length > 0 && (
              <section id="products">
                <h2 className="mb-3 text-lg font-semibold">Products</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

            {services.length > 0 && (
              <section id="services">
                <h2 className="mb-3 text-lg font-semibold">Services</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {services.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              </section>
            )}

            <section id="reviews">
              <h2 className="mb-3 text-lg font-semibold">Reviews</h2>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewRow key={review.id} review={review} />
                  ))}
                </div>
              )}
            </section>

            <section id="about">
              <h2 className="mb-3 text-lg font-semibold">About</h2>
              <p className="text-sm text-muted-foreground">{business.description ?? "No description provided."}</p>
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <AppDownloadCta label={`Order from ${business.name} in the app`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
