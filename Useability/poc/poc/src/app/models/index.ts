export type SportType = 'tennis' | 'padel' | 'voetbal';

export interface Club {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface Facility {
  id: string;
  clubId: string;
  clubName: string;
  type: SportType;
  name: string;
  description: string;
  pricePerHour: number;
  imageUrl: string;
}

export interface TimeSlot {
  id: string;
  facilityId: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface Booking {
  id: string;
  facilityId: string;
  facilityName: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerEmail: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'paid';
  createdAt: Date;
}