export interface GuestReviewDTO {
  guestId: string | null;
  resId: string | null;
  orderId: string | null;
  reviewText: string;
  nlpScore: number | null;
  sentimentLabel: string | null;
  starRating: number;
  date: string;
  food_items: string[];
  members: string[];
}
