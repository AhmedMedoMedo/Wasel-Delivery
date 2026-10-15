export type UserRole = 'restaurant' | 'driver' | 'admin';
export type VehicleType = 'motorcycle' | 'car' | 'any';
export type OrderStatus = 'pending' | 'active' | 'completed';

export interface User {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  commissionOwed: number; // in EGP (ج.م)
  vehicle?: VehicleType; // for drivers
  ratings?: number[]; // list of numbers (1-5) for drivers
  avatar?: string;
  createdAt?: string;
}

export interface PublicProfile {
  id: string; // Firebase Auth UID
  name: string;
  role: UserRole;
  vehicle?: VehicleType; // for drivers
  ratings?: number[]; // for drivers
  createdAt?: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  type: string;
  vehicleType: VehicleType;
  deliveryFee: number;
  orderPrice: number;
  contactPhone: string;
  status: OrderStatus;
  driverId: string | null;
  applyingDrivers: string[];
  createdAt: string; // ISO date string
  completedAt?: string | null;
  commission?: number; // Fixed 1.00 EGP per completed delivery
  rated?: boolean;
  deliveryAddress?: string; // Optional delivery address or landmark for maps
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}
