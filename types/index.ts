export interface User {
  id: string;
  username: string;
  password: string;
  role: 'staff' | 'admin' | 'manager';
  roleName?: string; // customizable display role name
  fullName: string;
  email: string;
  createdAt: string;
}

export interface DutyLog {
  id: string;
  title: string;
  description: string;
  category?: string; // ไม่ใช้แล้วใน UI (คงไว้เพื่อความเข้ากันได้)
  images: string[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  status?: string; // เปลี่ยนเป็นข้อความอิสระและเป็นทางเลือก
  // ฟิลด์ใหม่สำหรับโรงแรม
  guestNameLocation?: string;
  dmShift?: 'morning' | 'afternoon' | 'night';
  incidentTime?: string; // เวลาที่เกิดเหตุการณ์
  actionTaken?: string; // การดำเนินการที่ทำ
  categorization?: string; // ไม่บังคับ ใช้ได้ถ้าต้องการบันทึกเพิ่ม
  periodOfStay?: string; // ช่วงเวลาที่พัก
  sourceOfBooking?: string; // แหล่งที่มาของการจอง เช่น Agoda, Booking.com
  moveTo?: string; // ห้องที่ย้ายไป (ถ้ามีการย้ายห้อง)
  guestName?: string; // ชื่อแขก
  roomNumber?: string; // เลขห้อง
}

export interface Comment {
  id: string;
  logId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

// Daily Data สำหรับแต่ละวัน - เก็บข้อมูลพนักงานเวร และสถิติโรงแรม
export interface DailyData {
  date: string; // รูปแบบ YYYY-MM-DD
  dmMorningShift: string; // ชื่อพนักงานกะเช้า
  dmAfternoonShift: string; // ชื่อพนักงานกะบ่าย
  dmNightShift: string; // ชื่อพนักงานกะดึก
  mod: string; // MOD
  arrival: number; // จำนวนห้องที่มีผู้เข้าพัก
  departure: number; // จำนวนห้องที่ checkout
  occupancy: number; // % occupancy
}
