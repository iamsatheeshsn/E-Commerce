import { Timestamp } from "firebase/firestore";

export type UserRole = "customer" | "admin";

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Timestamp;
  addresses: Address[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  images: string[];
  category: string;
  subcategory?: string;
  brand: string;
  stock: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  specifications: Record<string, string>;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selectedVariant?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selectedVariant?: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderEvent {
  status: string;
  message: string;
  timestamp: Timestamp;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: Address;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: OrderStatus;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  trackingNumber?: string;
  estimatedDelivery?: Timestamp;
  timeline: OrderEvent[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  createdAt: Timestamp;
}

export interface WishlistItem {
  productId: string;
  addedAt: Timestamp;
}

export interface ProductFilters {
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStockOnly?: boolean;
  search?: string;
  sort?: "relevance" | "price-asc" | "price-desc" | "newest" | "rating";
}

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  revenueByDay: { date: string; revenue: number }[];
}
