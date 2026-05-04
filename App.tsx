import React, { useState } from "react";
import { LoginPage } from "./components/LoginPage";
import { Navbar } from "./components/Navbar";
import { DutyLogList } from "./components/DutyLogList";
import { DutyLogForm } from "./components/DutyLogForm";
import { UserManagement } from "./components/UserManagement";
import {
  mockUsers,
  mockDutyLogs,
  mockComments,
} from "./lib/mockData";
import { User, DutyLog, Comment } from "./types";
import { Toaster } from "./ui/sonner";
import { toast } from "sonner";
import {
  exportLogsToExcel,
  exportSingleLog,
  importLogsFromExcel,
} from "./lib/exportUtils";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(
    null,
  );
  const [language, setLanguage] = useState<"th" | "en">("th");
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem("users");
    return saved ? JSON.parse(saved) : mockUsers;
  });
  const [roles, setRoles] = useState<string[]>(() => {
    const saved = localStorage.getItem("roles");
    return saved ? JSON.parse(saved) : ["IT/Admin", "Staff"];
  });
  const [dutyLogs, setDutyLogs] = useState<DutyLog[]>(() => {
    const saved = localStorage.getItem("dutyLogs");
    return saved ? JSON.parse(saved) : mockDutyLogs;
  });
  const [comments, setComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem("comments");
    return saved ? JSON.parse(saved) : mockComments;
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editLog, setEditLog] = useState<DutyLog | null>(null);
  const [currentView, setCurrentView] = useState<
    "logs" | "users"
  >("logs");

  const handleLogin = (
    username: string,
    password: string,
  ): boolean => {
    const user = users.find(
      (u) => u.username === username && u.password === password,
    );
    if (user) {
      setCurrentUser(user);
      toast.success(language === "th" ? `ยินดีต้อนรับ, ${user.fullName}!` : `Welcome back, ${user.fullName}!`);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView("logs");
    toast.info(language === "th" ? "ออกจากระบบสำเร็จ" : "Logged out successfully");
  };

  const handleCreateLog = (logData: Partial<DutyLog>) => {
    if (!currentUser) return;

    const guestNameLocation = [logData.guestName, logData.roomNumber ? `Room ${logData.roomNumber}` : ""].filter(Boolean).join(" • ");
    const newLog: DutyLog = {
      id: Date.now().toString(),
      title: logData.title!,
      description: logData.description!,
      category: logData.category || '',
      images: logData.images || [],
      createdBy: currentUser.id,
      createdByName: currentUser.fullName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: (logData.status as any) || '',
      guestNameLocation: guestNameLocation || logData.guestNameLocation,
      guestName: logData.guestName,
      roomNumber: logData.roomNumber,
      dmShift: logData.dmShift,
      incidentTime: logData.incidentTime,
      actionTaken: logData.actionTaken,
      categorization: logData.categorization,
      periodOfStay: logData.periodOfStay,
      sourceOfBooking: logData.sourceOfBooking,
      moveTo: logData.moveTo,
    };

    const updated = [newLog, ...dutyLogs];
    setDutyLogs(updated);
    localStorage.setItem("dutyLogs", JSON.stringify(updated));
    toast.success(language === "th" ? "สร้างบันทึกสำเร็จ" : "Duty log created successfully");
  };

  const handleUpdateLog = (logData: Partial<DutyLog>) => {
    if (!editLog) return;

    const updatedLogs = dutyLogs.map((log) =>
      log.id === editLog.id
        ? {
            ...log,
            ...logData,
            updatedAt: new Date().toISOString(),
          }
        : log,
    );

    setDutyLogs(updatedLogs);
    localStorage.setItem("dutyLogs", JSON.stringify(updatedLogs));
    setEditLog(null);
    toast.success(language === "th" ? "อัปเดตบันทึกสำเร็จ" : "Duty log updated successfully");
  };

  const handleUpdateLogImages = (logId: string, newImages: string[]) => {
    const updatedLogs = dutyLogs.map((log) =>
      log.id === logId
        ? {
            ...log,
            images: newImages,
            updatedAt: new Date().toISOString(),
          }
        : log,
    );

    setDutyLogs(updatedLogs);
    localStorage.setItem("dutyLogs", JSON.stringify(updatedLogs));
    toast.success(language === "th" ? "อัปเดตรูปภาพสำเร็จ" : "Images updated successfully");
  };

  const handleDeleteLog = (id: string) => {
    const remaining = dutyLogs.filter((log) => log.id !== id);
    setDutyLogs(remaining);
    localStorage.setItem("dutyLogs", JSON.stringify(remaining));
    const remainingComments = comments.filter((comment) => comment.logId !== id);
    setComments(remainingComments);
    localStorage.setItem("comments", JSON.stringify(remainingComments));
    toast.success(language === "th" ? "ลบบันทึกสำเร็จ" : "Duty log deleted successfully");
  };

  const handleEditLog = (log: DutyLog) => {
    setEditLog(log);
    setIsFormOpen(true);
  };

  const handleAddComment = (logId: string, content: string) => {
    if (!currentUser) return;

    // Allow all users to comment on any post

    const newComment: Comment = {
      id: Date.now().toString(),
      logId,
      userId: currentUser.id,
      userName: currentUser.fullName,
      content,
      createdAt: new Date().toISOString(),
    };

    const updated = [...comments, newComment];
    setComments(updated);
    localStorage.setItem("comments", JSON.stringify(updated));
    toast.success(language === "th" ? "เพิ่มคอมเมนต์แล้ว" : "Comment added");
  };

  const handleDeleteComment = (commentId: string) => {
    const remaining = comments.filter((comment) => comment.id !== commentId);
    setComments(remaining);
    localStorage.setItem("comments", JSON.stringify(remaining));
    toast.success(language === "th" ? "ลบคอมเมนต์แล้ว" : "Comment deleted successfully");
  };

  const handleCreateUser = (
    userData: Omit<User, "id" | "createdAt">,
  ) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem("users", JSON.stringify(updated));
    toast.success(language === "th" ? "สร้างผู้ใช้สำเร็จ" : "User created successfully");
  };

  const handleUpdateUser = (
    id: string,
    userData: Partial<User>,
  ) => {
    const updatedUsers = users.map((user) =>
      user.id === id ? { ...user, ...userData } : user,
    );
    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    toast.success(language === "th" ? "อัปเดตผู้ใช้สำเร็จ" : "User updated successfully");
  };

  const handleDeleteUser = (id: string) => {
    const remaining = users.filter((user) => user.id !== id);
    setUsers(remaining);
    localStorage.setItem("users", JSON.stringify(remaining));
    toast.success(language === "th" ? "ลบผู้ใช้สำเร็จ" : "User deleted successfully");
  };

  // roles (positions) helpers
  const addRole = (roleName: string) => {
    const value = roleName.trim();
    if (!value) return;
    if (roles.includes(value)) return;
    const updated = [...roles, value];
    setRoles(updated);
    localStorage.setItem("roles", JSON.stringify(updated));
  };

  const removeRole = (roleName: string) => {
    const updated = roles.filter((r) => r !== roleName);
    setRoles(updated);
    localStorage.setItem("roles", JSON.stringify(updated));
  };

  const canEditLog = (log: DutyLog): boolean => {
    if (!currentUser) return false;
    return (
      currentUser.role === "admin" ||
      currentUser.role === "manager" ||
      log.createdBy === currentUser.id
    );
  };

  const handleExportToExcel = async () => {
    try {
      await exportLogsToExcel(dutyLogs, "duty-logs-all");
      toast.success(language === "th" ? "ส่งออกข้อมูลสำเร็จ" : "All logs exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error(language === "th" ? "เกิดข้อผิดพลาดในการส่งออกข้อมูล" : "Failed to export logs");
    }
  };
  const handleExportToExcelRange = async (range?: { startDate?: string; endDate?: string }) => {
    try {
      await exportLogsToExcel(dutyLogs, "duty-logs-all", range?.startDate, range?.endDate);
      toast.success(language === "th" ? "ส่งออกข้อมูลสำเร็จ" : "Logs exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error(language === "th" ? "เกิดข้อผิดพลาดในการส่งออกข้อมูล" : "Failed to export logs");
    }
  };

  const handleExportSingleLog = (log: DutyLog) => {
    exportSingleLog(log);
    toast.success(language === "th" ? "ส่งออกบันทึกสำเร็จ" : "Log exported successfully");
  };

  const handleImportFromExcel = async (file: File): Promise<{ dates: string[] }> => {
    try {
      const { dutyLogsByDate, dailyHeaders, dates } = await importLogsFromExcel(file);
      
      // Debug: แสดง dates ที่ import
      console.log("Imported dates:", dates);
      console.log("Imported dailyHeaders:", dailyHeaders);
      
      // แปลง dutyLogsByDate เป็น array ของ logs
      const allImportedLogs: DutyLog[] = [];
      Object.values(dutyLogsByDate).forEach(logs => {
        allImportedLogs.push(...logs);
      });
      
      // รวม logs ใหม่กับ logs เดิม
      const existingLogs = dutyLogs;
      const updatedLogs = [...allImportedLogs, ...existingLogs];
      
      // บันทึกลง localStorage
      setDutyLogs(updatedLogs);
      localStorage.setItem("dutyLogs", JSON.stringify(updatedLogs));
      
      // บันทึก dailyHeaders ลง localStorage (แปลงเป็น DailyData format)
      const existingDailyDataStr = localStorage.getItem("dailyData");
      const existingDailyData = existingDailyDataStr ? JSON.parse(existingDailyDataStr) : {};
      
      // แปลง dailyHeaders เป็น DailyData format และบันทึกทุกวันที่ import
      let headerCount = 0;
      Object.entries(dailyHeaders).forEach(([dateISO, header]) => {
        const dailyDataEntry = {
          date: dateISO,
          mod: header.mod || '',
          dmMorningShift: header.dmMorning || '',
          dmAfternoonShift: header.dmAfternoon || '',
          dmNightShift: header.dmNight || '',
          arrival: header.arrivalRooms || 0,
          departure: header.departureRooms || 0,
          occupancy: header.occupancyPercent || 0
        };
        
        existingDailyData[dateISO] = dailyDataEntry;
        headerCount++;
        
        // Debug: แสดงข้อมูล header ที่บันทึก
        console.log(`💾 Saved header for ${dateISO}:`, {
          mod: dailyDataEntry.mod || '(empty)',
          dmMorning: dailyDataEntry.dmMorningShift || '(empty)',
          dmAfternoon: dailyDataEntry.dmAfternoonShift || '(empty)',
          dmNight: dailyDataEntry.dmNightShift || '(empty)',
          arrival: dailyDataEntry.arrival || 0,
          departure: dailyDataEntry.departure || 0,
          occupancy: dailyDataEntry.occupancy || 0
        });
      });
      
      localStorage.setItem("dailyData", JSON.stringify(existingDailyData));
      console.log(`✅ Saved ${headerCount} daily headers to localStorage`);
      
      // Trigger custom event เพื่อให้ DutyLogList component refresh dailyData state
      window.dispatchEvent(new Event("dailyDataUpdated"));
      
      toast.success(language === "th" ? `นำเข้าข้อมูลสำเร็จ: ${allImportedLogs.length} บันทึก จาก ${dates.length} วันที่` : `Import successful: ${allImportedLogs.length} logs from ${dates.length} dates`);
      
      // Return dates เพื่อให้ DutyLogList ใช้ set selectedDate
      return { dates };
    } catch (error) {
      console.error("Import error:", error);
      toast.error(language === "th" ? `เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : "Unknown error"}` : `Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      throw error;
    }
  };


  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} language={language} />;
  }

  // บันทึก darkMode เมื่อเปลี่ยน
  const toggleDarkMode = () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    localStorage.setItem("darkMode", JSON.stringify(newValue));
  };

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-[#36393f]' : 'bg-gray-50'}`}>
      <Navbar
        user={currentUser}
        onLogout={handleLogout}
        onNavigate={
          currentUser.role === "admin"
            ? setCurrentView
            : undefined
        }
        currentView={currentView}
        language={language}
        onToggleLanguage={() => setLanguage((prev) => (prev === "th" ? "en" : "th"))}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      <main className={`flex-1 px-6 py-8 ${darkMode ? 'bg-[#36393f]' : ''}`}>
        {currentView === "logs" ? (
          <DutyLogList
            logs={dutyLogs}
            onEdit={handleEditLog}
            onDelete={handleDeleteLog}
            onCreate={() => {
              setEditLog(null);
              setIsFormOpen(true);
            }}
            canEdit={canEditLog}
            comments={comments}
            onAddComment={handleAddComment}
            onDeleteComment={handleDeleteComment}
            currentUserName={currentUser.fullName}
            currentUserId={currentUser.id}
            onExport={handleExportToExcelRange}
            onExportSingle={handleExportSingleLog}
            onImport={handleImportFromExcel}
            onUpdateImages={handleUpdateLogImages}
            language={language}
            darkMode={darkMode}
          />
        ) : (
          <UserManagement
            users={users}
            roles={roles}
            onAddRole={addRole}
            onRemoveRole={removeRole}
            onCreateUser={(u) => {
              if (u.roleName && !roles.includes(u.roleName)) {
                addRole(u.roleName);
              }
              handleCreateUser(u as any);
            }}
            onUpdateUser={(id, u) => {
              if (u.roleName && !roles.includes(u.roleName)) {
                addRole(u.roleName);
              }
              handleUpdateUser(id, u);
            }}
            onDeleteUser={handleDeleteUser}
            language={language}
            darkMode={darkMode}
          />
        )}
      </main>

      <DutyLogForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditLog(null);
        }}
        onSubmit={editLog ? handleUpdateLog : handleCreateLog}
        editLog={editLog}
        language={language}
        darkMode={darkMode}
      />

      <Toaster />
    </div>
  );
}