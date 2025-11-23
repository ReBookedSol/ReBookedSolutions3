export interface BookFilters {
  search?: string;
  category?: string;
  condition?: string;
  grade?: string;
  genre?: string;
  universityYear?: string;
  university?: string;
  province?: string;
  curriculum?: 'CAPS' | 'Cambridge' | 'IEB';
  minPrice?: number;
  maxPrice?: number;
  itemType?: 'textbook' | 'reader' | 'all';
}

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  preferred_delivery_locker_data?: any;
  has_pickup_address?: boolean;
}

export interface BookQueryResult {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  image_url?: string;
  front_cover?: string;
  back_cover?: string;
  inside_pages?: string;
  additional_images?: string[] | null;
  sold: boolean;
  created_at: string;
  item_type?: 'textbook' | 'reader';
  grade?: string;
  genre?: string;
  university_year?: string;
  university?: string;
  curriculum?: 'CAPS' | 'Cambridge' | 'IEB';
  province?: string;
  // Quantity fields from DB
  initial_quantity?: number | null;
  available_quantity?: number | null;
  sold_quantity?: number | null;
  seller_id: string;
  profiles?: ProfileData | null;
}
