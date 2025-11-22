export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  category: string;
  condition: "New" | "Good" | "Better" | "Average" | "Below Average";
  imageUrl: string;
  frontCover?: string;
  backCover?: string;
  insidePages?: string;
  additionalImages?: string[];
  sold: boolean;
  createdAt: string;
  itemType: "textbook" | "reader";
  grade?: string;
  universityYear?: string;
  university?: string;
  curriculum?: 'CAPS' | 'Cambridge' | 'IEB';
  universityBookType?: 'Study Guide' | 'Course Book';
  province?: string;
  // Quantity fields
  initialQuantity?: number;
  availableQuantity?: number;
  soldQuantity?: number;
  seller: {
    id: string;
    name: string;
    email: string;
  };
}

export interface BookFormData {
  title: string;
  author: string;
  description: string;
  price: number;
  category: string;
  condition: "New" | "Good" | "Better" | "Average" | "Below Average";
  imageUrl: string;
  frontCover?: string;
  backCover?: string;
  insidePages?: string;
  additionalImages?: string[];
  itemType: "textbook" | "reader";
  grade?: string;
  universityYear?: string;
  university?: string;
  curriculum?: 'CAPS' | 'Cambridge' | 'IEB';
  universityBookType?: 'Study Guide' | 'Course Book';
  province?: string;
  // Quantity to create listing with
  quantity?: number;
}
