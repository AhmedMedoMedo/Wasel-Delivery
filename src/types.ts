export type UserRole = 'restaurant' | 'driver' | 'admin';
export type VehicleType = 'motorcycle' | 'car' | 'any';
export type OrderStatus = 'pending' | 'active' | 'completed';

export interface DocumentImages {
  idCardFront?: string; // Base64
  idCardBack?: string;  // Base64
  personalPhoto?: string; // Base64
  selfieWithId?: string; // Base64
  commercialRegister?: string; // For restaurants
}

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
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  rejectionReason?: string;
  documents?: DocumentImages;
  paymentPending?: boolean; // True when user reports they transferred commission
  paymentReportedAt?: string;
  lastSettledAt?: string;
}

export interface PublicProfile {
  id: string; // Firebase Auth UID
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  vehicle?: VehicleType; // for drivers
  ratings?: number[]; // for drivers
  createdAt?: string;
  approvalStatus?: 'approved' | 'pending' | 'rejected';
  documents?: DocumentImages;
  commissionOwed?: number;
  paymentPending?: boolean;
  paymentReportedAt?: string;
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
  pickupCode?: string; // 4-digit secret handover code (e.g. "4821")
  pickedUp?: boolean; // True once restaurant hands over order & driver pays order price
  pickedUpAt?: string | null;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}
