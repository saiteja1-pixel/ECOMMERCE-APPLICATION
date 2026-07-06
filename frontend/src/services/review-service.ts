import { createClient } from "@/lib/supabase/client";

export interface Review {
  id: string;
  product_id: string;
  customer_id: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  customer_name?: string;
}

export interface RatingSummary {
  average_rating: number;
  reviews_count: number;
  distribution: { [key: number]: number };
}

export const reviewService = {
  async getProductReviews(productId: string): Promise<Review[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        profiles (full_name)
      `)
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((r: any) => ({
      id: r.id,
      product_id: r.product_id,
      customer_id: r.customer_id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      created_at: r.created_at,
      customer_name: r.profiles?.full_name || "Anonymous",
    }));
  },

  async submitReview(review: {
    product_id: string;
    customer_id: string;
    rating: number;
    title: string;
    comment: string;
  }): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    const { error } = await supabase
      .from("reviews")
      .insert([review]);

    if (error) throw new Error(error.message);
  },

  async getRatingSummary(productId: string): Promise<RatingSummary> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("rating")
      .eq("product_id", productId);

    if (error) throw new Error(error.message);

    const count = reviews.length;
    if (count === 0) {
      return {
        average_rating: 0,
        reviews_count: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const sum = reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0);
    const avg = Number((sum / count).toFixed(1));

    const distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r: { rating: number }) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    });

    // Convert to percentage
    Object.keys(distribution).forEach((key) => {
      const k = Number(key);
      distribution[k] = Math.round((distribution[k] / count) * 100);
    });

    return {
      average_rating: avg,
      reviews_count: count,
      distribution,
    };
  }
};
