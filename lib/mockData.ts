import { User, DutyLog, Comment } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    fullName: 'Admin User',
    email: 'admin@hotel.com',
    createdAt: '2025-01-01T00:00:00Z'
  },
  {
    id: '2',
    username: 'manager',
    password: 'manager123',
    role: 'manager',
    fullName: 'Manager User',
    email: 'manager@hotel.com',
    createdAt: '2025-01-01T12:00:00Z'
  },
  {
    id: '3',
    username: 'staff1',
    password: 'staff123',
    role: 'staff',
    fullName: 'John Smith',
    email: 'john@hotel.com',
    createdAt: '2025-01-02T00:00:00Z'
  },
  {
    id: '4',
    username: 'staff2',
    password: 'staff123',
    role: 'staff',
    fullName: 'Sarah Johnson',
    email: 'sarah@hotel.com',
    createdAt: '2025-01-03T00:00:00Z'
  }
];

export const mockDutyLogs: DutyLog[] = [
  {
    id: '1',
    title: 'Room 305 - Air Conditioning Issue',
    description: 'Guest reported that the air conditioning unit in room 305 is not cooling properly. Temperature reading shows 28°C when set to 20°C. Needs immediate maintenance attention.',
    category: 'Maintenance',
    images: [],
    createdBy: '2',
    createdByName: 'John Smith',
    createdAt: '2025-10-16T08:30:00Z',
    updatedAt: '2025-10-16T08:30:00Z',
    status: 'open'
  },
  {
    id: '2',
    title: 'Lobby - Guest Complaint about Noise',
    description: 'Guest from room 412 complained about construction noise from the adjacent building starting at 7 AM. Offered room change to the opposite wing. Guest accepted and moved to room 218.',
    category: 'Guest Service',
    images: [],
    createdBy: '3',
    createdByName: 'Sarah Johnson',
    createdAt: '2025-10-16T09:15:00Z',
    updatedAt: '2025-10-16T09:15:00Z',
    status: 'resolved'
  },
  {
    id: '3',
    title: 'Restaurant - Equipment Malfunction',
    description: 'Main dishwasher in the restaurant kitchen stopped working during breakfast service. Using backup unit. Technician has been called and expected to arrive at 2 PM.',
    category: 'Maintenance',
    images: [],
    createdBy: '2',
    createdByName: 'John Smith',
    createdAt: '2025-10-16T10:00:00Z',
    updatedAt: '2025-10-16T10:00:00Z',
    status: 'in-progress'
  },
  {
    id: '4',
    title: 'Room 521 - Early Check-in Request',
    description: 'VIP guest requested early check-in at 10 AM (standard check-in is 3 PM). Room was available and prepared. Guest checked in successfully at 10:15 AM.',
    category: 'Front Desk',
    images: [],
    createdBy: '3',
    createdByName: 'Sarah Johnson',
    createdAt: '2025-10-15T10:15:00Z',
    updatedAt: '2025-10-15T10:15:00Z',
    status: 'resolved'
  },
  {
    id: '5',
    title: 'Parking - Security Incident',
    description: 'Security camera detected suspicious activity in parking lot section B at 2:30 AM. Security team investigated and found it was a guest looking for their vehicle. Assisted guest in locating their car.',
    category: 'Security',
    images: [],
    createdBy: '2',
    createdByName: 'John Smith',
    createdAt: '2025-10-15T02:45:00Z',
    updatedAt: '2025-10-15T02:45:00Z',
    status: 'resolved'
  }
];

export const mockComments: Comment[] = [
  {
    id: '1',
    logId: '1',
    userId: '1',
    userName: 'Admin User',
    content: 'I\'ve contacted the maintenance team. They will be there within 30 minutes.',
    createdAt: '2025-10-16T08:45:00Z'
  },
  {
    id: '2',
    logId: '1',
    userId: '2',
    userName: 'John Smith',
    content: 'Thank you! Guest has been informed.',
    createdAt: '2025-10-16T08:50:00Z'
  },
  {
    id: '3',
    logId: '3',
    userId: '1',
    userName: 'Admin User',
    content: 'Technician confirmed arrival at 2 PM. Parts may need to be ordered.',
    createdAt: '2025-10-16T11:00:00Z'
  }
];
