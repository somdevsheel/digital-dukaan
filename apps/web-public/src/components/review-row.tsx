import { Star } from "lucide-react";
import type { Review } from "@/lib/api";

export function ReviewRow({ review }: { review: Review }) {
  return (
    <div className="border-b pb-4 last:border-0">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${i < review.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`}
          />
        ))}
      </div>
      {review.comment && <p className="mt-2 text-sm">{review.comment}</p>}
      {review.reply && (
        <div className="mt-2 rounded-md bg-muted p-2 text-sm">
          <span className="font-medium">Business reply: </span>
          {review.reply.message}
        </div>
      )}
    </div>
  );
}
