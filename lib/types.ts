export type Service = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  is_active: boolean;
  sort_order: number;
  coming_soon: boolean;
};

export type ServiceItem = {
  id: string;
  service_id: string;
  name: string;
  description: string | null;
  price: number | null;
  event_date: string | null;
  image_url: string | null;
  location: string | null;
  is_active: boolean;
  sort_order: number;
};

export type Profile = {
  id: string;
  role: "client" | "admin" | "driver";
  full_name: string | null;
  phone: string | null;
};

export type BookingStatus =
  | "pending"
  | "payment_uploaded"
  | "confirmed"
  | "assigned"
  | "completed"
  | "cancelled";

export type Location = {
  address_text: string;
  lat: number | null;
  lng: number | null;
};
