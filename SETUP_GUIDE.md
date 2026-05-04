# คู่มือการตั้งค่าโปรเจกต์ Duty Log

## ปัญหาที่ 1: รัน `npm run dev` ไม่ได้

### สาเหตุ
Node.js/npm ไม่ได้ติดตั้งหรือไม่อยู่ใน PATH ของระบบ

### วิธีแก้ไข

#### ขั้นตอนที่ 1: ติดตั้ง Node.js
1. ไปที่เว็บไซต์: https://nodejs.org/
2. ดาวน์โหลด LTS version (แนะนำ)
3. ติดตั้งโดยใช้ตัวติดตั้ง (Installer)
4. **สำคัญ**: ตรวจสอบให้แน่ใจว่าเลือก "Add to PATH" ระหว่างการติดตั้ง

#### ขั้นตอนที่ 2: ตรวจสอบการติดตั้ง
เปิด Command Prompt หรือ PowerShell ใหม่ แล้วรัน:
```cmd
node --version
npm --version
```

ถ้าแสดงหมายเลขเวอร์ชัน แสดงว่าติดตั้งสำเร็จแล้ว

#### ขั้นตอนที่ 3: ติดตั้ง dependencies
เปิด Command Prompt หรือ PowerShell ในโฟลเดอร์โปรเจกต์:
```cmd
cd "C:\Users\bonni\Downloads\Duty Log Code"
npm install
```

#### ขั้นตอนที่ 4: รันโปรเจกต์
```cmd
npm run dev
```

โปรเจกต์จะรันที่ http://localhost:5173

---

## ปัญหาที่ 2: โค้ดไม่แสดงใน Cursor

### วิธีแก้ไข

#### วิธีที่ 1: เปิดโฟลเดอร์ใหม่
1. ใน Cursor: กด `Ctrl + K` แล้วกด `Ctrl + O` (หรือ File > Open Folder)
2. เลือกโฟลเดอร์: `C:\Users\bonni\Downloads\Duty Log Code`
3. กด "Select Folder"

#### วิธีที่ 2: ตรวจสอบไฟล์ที่ซ่อน
1. ใน Cursor: กด `Ctrl + Shift + P`
2. พิมพ์: "Preferences: Open Settings"
3. ค้นหา: "files.exclude"
4. ตรวจสอบว่าไม่มี pattern ที่ซ่อนไฟล์ของคุณ

#### วิธีที่ 3: ใช้ Command Line
เปิด Command Prompt แล้วรัน:
```cmd
cd "C:\Users\bonni\Downloads\Duty Log Code"
cursor .
```

---

## โครงสร้างโปรเจกต์

```
Duty Log Code/
├── App.tsx                 # Component หลัก
├── index.html              # HTML entry point
├── package.json            # Dependencies และ scripts
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── components/             # React components
│   ├── DutyLogForm.tsx
│   ├── DutyLogList.tsx
│   ├── LoginPage.tsx
│   ├── Navbar.tsx
│   └── UserManagement.tsx
├── lib/                    # Utilities
│   ├── exportUtils.ts
│   └── mockData.ts
├── styles/                 # CSS files
│   └── globals.css
├── types/                  # TypeScript types
│   ├── globals.d.ts
│   └── index.ts
└── ui/                     # UI components (shadcn/ui)
    └── ...
```

---

## คำสั่งที่ใช้บ่อย

```cmd
# ติดตั้ง dependencies
npm install

# รัน development server
npm run dev

# Build สำหรับ production
npm run build

# Preview production build
npm run preview
```

---

## หมายเหตุ

- โปรเจกต์ใช้ Vite เป็น build tool
- Port default คือ 5173
- ใช้ React 18.3.1 และ TypeScript
- UI components ใช้ shadcn/ui และ Tailwind CSS

