import React from "react";
import { DutyLog, DailyData } from "../types";

type DutyLogListProps = {
	logs: DutyLog[];
	onEdit: (log: DutyLog) => void;
	onDelete: (id: string) => void;
	onCreate: () => void;
	canEdit: (log: DutyLog) => boolean;
	comments: { id: string; logId: string; userId: string; userName: string; content: string; createdAt: string }[];
	onAddComment: (logId: string, content: string) => void;
	onDeleteComment: (commentId: string) => void;
	currentUserName: string;
	currentUserId: string;
	onExport: (range?: { startDate?: string; endDate?: string }) => void;
	onExportSingle: (log: DutyLog) => void;
	onImport: (file: File) => Promise<{ dates: string[] }>;
	onUpdateImages?: (logId: string, images: string[]) => void; // อัปเดตรูปภาพของ log
	language: "th" | "en";
	darkMode?: boolean;
	onDateChange?: (date: string) => void; // Callback เมื่อต้องการเปลี่ยน selectedDate จากภายนอก
};

// Helper function to format date as dd/mm/yyyy
const formatDateDDMMYYYY = (date: Date | string): string => {
	const d = typeof date === 'string' ? new Date(date) : date;
	const day = String(d.getDate()).padStart(2, '0');
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const year = d.getFullYear();
	return `${day}/${month}/${year}`;
};

// Helper function to format date with time as dd/mm/yyyy HH:mm
const formatDateTimeDDMMYYYY = (date: Date | string): string => {
	const d = typeof date === 'string' ? new Date(date) : date;
	const day = String(d.getDate()).padStart(2, '0');
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const year = d.getFullYear();
	const hours = String(d.getHours()).padStart(2, '0');
	const minutes = String(d.getMinutes()).padStart(2, '0');
	return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const texts = {
	th: {
		header: "บันทึกงาน",
		newLog: "+ บันทึกใหม่",
		export: "📤 ส่งออก",
		import: "📥 นำเข้า",
		filter: "📅 กรอง",
		arrival: "ผู้เข้าพัก",
		departure: "ผู้ออก",
		occupancy: "อัตราการเข้าพัก",
		mod: "MOD:",
		search: "ค้นหา...",
		dmMorning: "กะเช้า:",
		dmAfternoon: "กะบ่าย:",
		dmNight: "กะดึก:",
		dmShift: "กะ",
		dmShiftMorning: "กะเช้า",
		dmShiftAfternoon: "กะบ่าย",
		dmShiftNight: "กะดึก",
		placeholderStaff: "",
		unit: "ห้อง",
		date: "วันที่",
		details: "รายละเอียด",
		actionTaken: "การดำเนินการ",
		noData: "ไม่มีข้อมูล",
		comments: "ความคิดเห็น",
		addComment: "เพิ่มความคิดเห็น",
		filterTitle: "กรองตามช่วงวันที่",
		startDate: "วันที่เริ่มต้น",
		endDate: "วันที่สิ้นสุด",
		startTime: "เวลาเริ่มต้น",
		endTime: "เวลาสิ้นสุด",
		apply: "ใช้",
		clear: "ล้าง",
		cancel: "ยกเลิก",
		exportTitle: "ส่งออกเป็น Excel",
		importTitle: "นำเข้าจาก Excel",
		exportInfo: "ไฟล์จะถูกบันทึกเป็น",
		importInfo: "เลือกไฟล์ Excel เพื่อนำเข้าข้อมูล",
		importSuccess: "นำเข้าข้อมูลสำเร็จ",
		importError: "เกิดข้อผิดพลาดในการนำเข้า",
		guest: "แขก",
		room: "ห้อง",
		source: "ช่องทางการจอง",
		period: "ช่วงเวลาพัก",
		time: "เวลาเกิดเหตุ",
		more: "คลิกเพื่อดูข้อมูลเพิ่มเติม →",
		moveTo: "ย้ายไป",
	},
	en: {
		header: "Duty Log",
		newLog: "+ New Log",
		export: "📤 Export",
		import: "📥 Import",
		filter: "📅 Filter",
		arrival: "Arrival",
		departure: "Departure",
		occupancy: "Occupancy",
		mod: "MOD:",
		search: "Search...",
		dmMorning: "DM Morning Shift:",
		dmAfternoon: "DM Afternoon Shift:",
		dmNight: "DM Night Shift:",
		dmShift: "DM Shift",
		dmShiftMorning: "DM Morning Shift",
		dmShiftAfternoon: "DM Afternoon Shift",
		dmShiftNight: "DM Night Shift",
		placeholderStaff: "",
		unit: "units",
		date: "Date",
		details: "Details / Issue",
		actionTaken: "Action Taken",
		noData: "No data",
		comments: "Comments",
		addComment: "Add Comment",
		filterTitle: "Filter by Date Range",
		startDate: "Start Date",
		endDate: "End Date",
		startTime: "Start Time",
		endTime: "End Time",
		apply: "Apply",
		clear: "Clear",
		cancel: "Cancel",
		exportTitle: "Export to Excel",
		importTitle: "Import from Excel",
		exportInfo: "File will be saved as",
		importInfo: "Select Excel file to import data",
		importSuccess: "Data imported successfully",
		importError: "Error importing data",
		guest: "Guest",
		room: "Room",
		source: "Source of Booking",
		period: "Period of stay",
		time: "Incident time",
		more: "Click to view more →",
		moveTo: "Move to",
	},
};

export function DutyLogList({ logs, onEdit, onDelete, onCreate, canEdit, comments, onAddComment, onDeleteComment, currentUserName, currentUserId, onExport, onExportSingle, onImport, onUpdateImages, language, darkMode = false, onDateChange }: DutyLogListProps) {
	const t = texts[language];
	const [query, setQuery] = React.useState("");
	const [page, setPage] = React.useState(1);
	const pageSize = 30;
	const [detail, setDetail] = React.useState<DutyLog | null>(null);
	const [viewingImage, setViewingImage] = React.useState<string | null>(null);
	const [newComment, setNewComment] = React.useState<string>("");
	const [showExportModal, setShowExportModal] = React.useState(false);
	const [startDate, setStartDate] = React.useState("");
	const [endDate, setEndDate] = React.useState("");
	const [showFilterModal, setShowFilterModal] = React.useState(false);
	const [showImportModal, setShowImportModal] = React.useState(false);
	const [importFile, setImportFile] = React.useState<File | null>(null);
	const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
	const [filterStartDate, setFilterStartDate] = React.useState("");
	const [filterEndDate, setFilterEndDate] = React.useState("");
	const [filterStartTime, setFilterStartTime] = React.useState("");
	const [filterEndTime, setFilterEndTime] = React.useState("");
	
	// DailyData state - เก็บข้อมูลรายวัน
	const [dailyData, setDailyData] = React.useState<{[key: string]: DailyData}>(() => {
		const saved = localStorage.getItem("dailyData");
		return saved ? JSON.parse(saved) : {};
	});
	
	// Refresh dailyData จาก localStorage เมื่อมีการเปลี่ยนแปลง (เช่น หลัง import)
	React.useEffect(() => {
		const refreshDailyData = () => {
			const saved = localStorage.getItem("dailyData");
			if (saved) {
				const parsed = JSON.parse(saved);
				setDailyData(parsed);
				console.log("🔄 Refreshed dailyData from localStorage:", Object.keys(parsed).length, "days");
			}
		};
		
		// Refresh ทันที
		refreshDailyData();
		
		// Listen สำหรับการเปลี่ยนแปลงของ localStorage (เมื่อมีการ import จากหน้าอื่น)
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === "dailyData") {
				refreshDailyData();
			}
		};
		
		window.addEventListener("storage", handleStorageChange);
		
		// Custom event สำหรับ refresh เมื่อ import ในหน้าเดียวกัน
		const handleImportComplete = () => {
			refreshDailyData();
		};
		
		window.addEventListener("dailyDataUpdated", handleImportComplete);
		
		return () => {
			window.removeEventListener("storage", handleStorageChange);
			window.removeEventListener("dailyDataUpdated", handleImportComplete);
		};
	}, []);
	
	// โหลดข้อมูลวันปัจจุบัน
	const currentDailyData = dailyData[selectedDate] || {
		date: selectedDate,
		dmMorningShift: "",
		dmAfternoonShift: "",
		dmNightShift: "",
		mod: "",
		arrival: undefined,
		departure: undefined,
		occupancy: undefined
	};
	
	// ฟังก์ชันบันทึกข้อมูลรายวัน
	const saveDailyData = (data: DailyData) => {
		const updated = { ...dailyData, [data.date]: data };
		setDailyData(updated);
		localStorage.setItem("dailyData", JSON.stringify(updated));
	};

	const filtered = React.useMemo(() => {
		// กรองตามวันที่ - ถ้ามี filterStartDate และ filterEndDate ให้กรองตามช่วงนั้น
		// แต่ถ้ามี selectedDate ให้กรองตาม selectedDate (วันเดียว) แทน
		// ถ้าไม่มี filter และมี selectedDate ให้กรองตาม selectedDate (วันเดียว)
		// ถ้าไม่มี filter และไม่มี selectedDate ให้แสดง logs ของวันปัจจุบันและย้อนหลัง 7 วัน (8 วัน)
		let filteredByDate = logs;
		
		if (filterStartDate && filterEndDate) {
			// ถ้ามี filter แต่มี selectedDate ให้กรองตาม selectedDate (วันเดียว) แทน
			if (selectedDate) {
				filteredByDate = logs.filter((l) => {
					const logDate = new Date(l.createdAt).toISOString().split('T')[0];
					return logDate === selectedDate;
				});
			} else {
				// กรองตามช่วงวันที่/เวลา
				const startBoundary = new Date(`${filterStartDate}T${filterStartTime || "00:00"}:00`);
				const endBoundary = new Date(`${filterEndDate}T${filterEndTime || "23:59"}:59`);
				filteredByDate = logs.filter((l) => {
					const logDate = new Date(l.createdAt);
					return logDate >= startBoundary && logDate <= endBoundary;
				});
			}
		} else if (selectedDate) {
			// ถ้าไม่มี filter แต่มี selectedDate ให้กรองตาม selectedDate (วันเดียว)
			filteredByDate = logs.filter((l) => {
				const logDate = new Date(l.createdAt).toISOString().split('T')[0];
				return logDate === selectedDate;
			});
		} else {
			// ถ้าไม่มี filter และไม่มี selectedDate ให้แสดง logs ของวันปัจจุบันและย้อนหลัง 7 วัน (8 วัน)
			const today = new Date();
			const dateSet = new Set<string>();
			for (let i = 0; i < 8; i++) {
				const date = new Date(today);
				date.setDate(today.getDate() - i);
				dateSet.add(date.toISOString().split('T')[0]);
			}
			filteredByDate = logs.filter((l) => {
				const logDate = new Date(l.createdAt).toISOString().split('T')[0];
				return dateSet.has(logDate);
			});
		}
		
		// ถ้าไม่มีคำค้นหา ให้แสดงผลตามวันที่ที่กรองแล้ว
		if (!query.trim()) return filteredByDate;
		
		// ถ้ามีคำค้นหา ให้กรองจากผลลัพธ์ที่กรองตามวันที่แล้ว
		const q = query.toLowerCase();
		return filteredByDate.filter((l) =>
			(l.title + " " + l.description + " " + l.category + " " + l.createdByName)
				.toLowerCase()
				.includes(q),
		);
	}, [logs, query, selectedDate, filterStartDate, filterEndDate, filterStartTime, filterEndTime]);

	const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
	const start = (page - 1) * pageSize;
	const current = filtered.slice(start, start + pageSize);

	// สร้าง availableDates จาก logs (วันที่ทั้งหมดที่มี logs)
	const availableDates = React.useMemo(() => {
		const dateSet = new Set<string>();
		logs.forEach(log => {
			const logDate = new Date(log.createdAt).toISOString().split('T')[0];
			dateSet.add(logDate);
		});
		return Array.from(dateSet).sort();
	}, [logs]);
	
	// สร้างวันที่ย้อนหลัง 7 วันจากวันปัจจุบัน (ถ้าไม่มี filter)
	const last7Days = React.useMemo(() => {
		const today = new Date();
		const dates: string[] = [];
		for (let i = 0; i < 8; i++) { // รวมวันนี้ด้วย = 8 วัน
			const date = new Date(today);
			date.setDate(today.getDate() - i);
			dates.push(date.toISOString().split('T')[0]);
		}
		return dates.reverse(); // เรียงจากเก่าไปใหม่ (27, 28, 29, 30, 31, 1, 2)
	}, []);
	
	// วันที่ที่จะแสดงในปุ่ม: ถ้ามี filter ให้ใช้ availableDates, ถ้าไม่มีให้ใช้ last7Days
	const displayDates = React.useMemo(() => {
		if (filterStartDate && filterEndDate) {
			// ถ้ามี filter ให้แสดงวันที่ในช่วง filter
			const start = new Date(filterStartDate);
			const end = new Date(filterEndDate);
			const dates: string[] = [];
			const current = new Date(start);
			while (current <= end) {
				dates.push(current.toISOString().split('T')[0]);
				current.setDate(current.getDate() + 1);
			}
			return dates;
		} else {
			// ถ้าไม่มี filter ให้แสดง last7Days
			return last7Days;
		}
	}, [filterStartDate, filterEndDate, last7Days]);
	
	// เมื่อ Clear Filter หรือไม่มี filter ให้ set selectedDate เป็นวันปัจจุบัน
	React.useEffect(() => {
		if (!filterStartDate && !filterEndDate) {
			const today = new Date().toISOString().split('T')[0];
			// ตรวจสอบว่า selectedDate อยู่ใน last7Days หรือไม่
			const isInLast7Days = last7Days.includes(selectedDate);
			if (!isInLast7Days && selectedDate !== today) {
				setSelectedDate(today);
				if (onDateChange) {
					onDateChange(today);
				}
			}
		}
	}, [filterStartDate, filterEndDate, selectedDate, last7Days, onDateChange]);
	
	// Debug: แสดง availableDates และ selectedDate
	React.useEffect(() => {
		console.log("Available dates from logs:", availableDates);
		console.log("Selected date:", selectedDate);
	}, [availableDates, selectedDate]);

	return (
		<section>
			{/* Header ส่วนบน - ส่วนที่วงสีส้ม */}
			<div className={`${darkMode ? 'bg-[#2f3136] border-[#40444b] text-white' : 'bg-white border-gray-300'} border-2 rounded-lg p-6 mb-5 shadow-sm`}>
				<h1 className={`text-2xl font-bold text-center mb-4 pb-2 border-b ${darkMode ? 'border-[#40444b]' : 'border-gray-300'}`}>{t.header}</h1>
				
				{/* ข้อมูลพนักงานเวร (สีม่วง) และสถิติ */}
				<div className="grid grid-cols-2 gap-6 mb-4">
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<label className={`font-medium w-40 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{t.dmMorning}</label>
							<input
								type="text"
								className={`flex-1 border-b px-2 py-1 focus:outline-none ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500 focus:border-purple-400' : 'border-gray-300 focus:border-purple-500'}`}
								value={currentDailyData.dmMorningShift}
								onChange={(e) => saveDailyData({...currentDailyData, dmMorningShift: e.target.value})}
								placeholder={t.placeholderStaff}
							/>
						</div>
						<div className="flex items-center gap-2">
							<label className={`font-medium w-40 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{t.dmAfternoon}</label>
							<input
								type="text"
								className={`flex-1 border-b px-2 py-1 focus:outline-none ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500 focus:border-purple-400' : 'border-gray-300 focus:border-purple-500'}`}
								value={currentDailyData.dmAfternoonShift}
								onChange={(e) => saveDailyData({...currentDailyData, dmAfternoonShift: e.target.value})}
								placeholder={t.placeholderStaff}
							/>
						</div>
						<div className="flex items-center gap-2">
							<label className={`font-medium w-40 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{t.dmNight}</label>
							<input
								type="text"
								className={`flex-1 border-b px-2 py-1 focus:outline-none ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500 focus:border-purple-400' : 'border-gray-300 focus:border-purple-500'}`}
								value={currentDailyData.dmNightShift}
								onChange={(e) => saveDailyData({...currentDailyData, dmNightShift: e.target.value})}
								placeholder={t.placeholderStaff}
							/>
						</div>
					</div>
					
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<label className={`font-medium w-32 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{t.arrival}:</label>
							<div className={`flex flex-1 items-center gap-2 border-b px-2 py-1 ${darkMode ? 'border-[#40444b] focus-within:border-purple-400' : 'border-gray-300 focus-within:border-purple-500'}`}>
								<input
									type="number"
									min="0"
									className={`w-full focus:outline-none ${darkMode ? 'bg-[#36393f] text-white placeholder-gray-500' : 'bg-transparent'}`}
									value={currentDailyData.arrival !== undefined && currentDailyData.arrival !== null ? currentDailyData.arrival : ""}
									onChange={(e) => {
										const val = e.target.value;
										if (val === "") {
											// ถ้าว่างให้บันทึกเป็น undefined เพื่อให้แสดงเป็นช่องว่าง
											const updated = {...currentDailyData};
											delete updated.arrival;
											saveDailyData(updated);
										} else {
											const num = parseInt(val);
											if (!isNaN(num) && num >= 0) {
												saveDailyData({...currentDailyData, arrival: num});
											}
										}
									}}
									placeholder=""
								/>
								<span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.unit}</span>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<label className={`font-medium w-32 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{t.departure}:</label>
							<div className={`flex flex-1 items-center gap-2 border-b px-2 py-1 ${darkMode ? 'border-[#40444b] focus-within:border-purple-400' : 'border-gray-300 focus-within:border-purple-500'}`}>
								<input
									type="number"
									min="0"
									className={`w-full focus:outline-none ${darkMode ? 'bg-[#36393f] text-white placeholder-gray-500' : 'bg-transparent'}`}
									value={currentDailyData.departure !== undefined && currentDailyData.departure !== null ? currentDailyData.departure : ""}
									onChange={(e) => {
										const val = e.target.value;
										if (val === "") {
											// ถ้าว่างให้บันทึกเป็น undefined เพื่อให้แสดงเป็นช่องว่าง
											const updated = {...currentDailyData};
											delete updated.departure;
											saveDailyData(updated);
										} else {
											const num = parseInt(val);
											if (!isNaN(num) && num >= 0) {
												saveDailyData({...currentDailyData, departure: num});
											}
										}
									}}
									placeholder=""
								/>
								<span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.unit}</span>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<label className={`font-medium w-32 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{t.occupancy}:</label>
							<div className={`flex flex-1 items-center gap-2 border-b px-2 py-1 ${darkMode ? 'border-[#40444b] focus-within:border-purple-400' : 'border-gray-300 focus-within:border-purple-500'}`}>
								<input
									type="number"
									min="0"
									step="0.01"
									className={`w-full focus:outline-none ${darkMode ? 'bg-[#36393f] text-white placeholder-gray-500' : 'bg-transparent'}`}
									value={currentDailyData.occupancy !== undefined && currentDailyData.occupancy !== null ? currentDailyData.occupancy : ""}
									onChange={(e) => {
										const val = e.target.value;
										if (val === "") {
											// ถ้าว่างให้บันทึกเป็น undefined เพื่อให้แสดงเป็นช่องว่าง
											const updated = {...currentDailyData};
											delete updated.occupancy;
											saveDailyData(updated);
										} else {
											const num = parseFloat(val);
											if (!isNaN(num) && num >= 0) {
												saveDailyData({...currentDailyData, occupancy: num});
											}
										}
									}}
									placeholder=""
								/>
								<span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>%</span>
							</div>
						</div>
					</div>
				</div>
				
				<div className="flex items-center gap-2 mb-4">
					<label className={`font-medium ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>{t.mod}</label>
					<input
						type="text"
						className={`flex-1 border-b px-2 py-1 focus:outline-none ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500 focus:border-purple-400' : 'border-gray-300 focus:border-purple-500'}`}
						value={currentDailyData.mod}
						onChange={(e) => saveDailyData({...currentDailyData, mod: e.target.value})}
						placeholder=""
					/>
				</div>
				
				{/* วันที่ปัจจุบัน (สีแดง) - แสดง filterStartDate/filterEndDate ถ้ามี filter หรือ selectedDate */}
				<div className={`text-center font-bold text-lg mb-4 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
					{t.date}: {
						filterStartDate && filterEndDate 
							? `${formatDateDDMMYYYY(filterStartDate)} - ${formatDateDDMMYYYY(filterEndDate)}`
							: formatDateDDMMYYYY(selectedDate)
					}
				</div>
				
				{/* ปุ่มค้นหาและฟังก์ชัน */}
				<div className="flex items-center justify-between gap-4 mb-4">
					<div className="relative flex-1 max-w-md">
						<input
							className={`w-full rounded-lg border px-4 py-2 pl-10 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300'}`}
							placeholder={t.search}
							value={query}
							onChange={(e) => {
								setQuery(e.target.value);
								setPage(1);
							}}
						/>
						<span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>🔎</span>
					</div>
					
					<div className="flex gap-2">
						<button 
							className="rounded-lg bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600 font-medium transition-colors" 
							onClick={onCreate}
							title="สร้าง Duty Log ใหม่"
						>
							{t.newLog}
						</button>
						<button 
							className={`rounded-lg px-3 py-2 text-sm border-2 transition-colors ${darkMode ? 'bg-[#36393f] border-[#40444b] text-gray-300 hover:bg-[#40444b]' : 'bg-white border-gray-800 hover:bg-gray-50'}`}
							title="Filter by date" 
							onClick={() => setShowFilterModal(true)}
						>
							{t.filter}
						</button>
						<button 
							className={`rounded-lg border-2 px-3 py-2 text-sm transition-colors ${darkMode ? 'bg-[#36393f] border-[#40444b] text-gray-300 hover:bg-[#40444b]' : 'bg-white border-gray-800 hover:bg-gray-50'}`}
							onClick={() => setShowExportModal(true)}
							title="ส่งออกข้อมูลเป็น Excel"
						>
							{t.export}
						</button>
						<button 
							className={`rounded-lg border-2 px-3 py-2 text-sm transition-colors ${darkMode ? 'bg-[#36393f] border-[#40444b] text-gray-300 hover:bg-[#40444b]' : 'bg-white border-gray-800 hover:bg-gray-50'}`}
							onClick={() => setShowImportModal(true)}
							title="นำเข้าข้อมูลจาก Excel"
						>
							{t.import}
						</button>
					</div>
				</div>
				
				{/* ปุ่มวันที่ - ถ้ามี filter แสดงช่วง filter, ถ้าไม่มีแสดง last7Days */}
				<div className="flex justify-center gap-2 flex-wrap">
					{displayDates.length > 0 ? (
						displayDates.map((dateStr, idx) => {
							const day = new Date(dateStr);
							const dayNum = day.getDate();
							const logsCount = logs.filter(log => 
								new Date(log.createdAt).toISOString().split('T')[0] === dateStr
							).length;
							// highlight เมื่อ dateStr === selectedDate (ไม่ว่าจะมี filter หรือไม่)
							const isSelected = dateStr === selectedDate;
							
							return (
								<button
									key={idx}
									className={`px-4 py-2 rounded-lg font-bold border-2 transition-all ${
										isSelected 
											? darkMode
												? 'bg-[#5865f2] border-[#4752c4] text-white scale-110 shadow-md'
												: 'bg-[#5865f2] border-[#4752c4] text-white scale-110 shadow-md'
											: darkMode
												? 'bg-[#36393f] border-[#40444b] text-gray-300 hover:bg-[#40444b]'
												: 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
									}`}
									onClick={() => {
										// เมื่อคลิกปุ่มวันที่:
										// - ถ้ามี filter → แค่ set selectedDate (ไม่ clear filter)
										// - ถ้าไม่มี filter → clear filter และ set selectedDate
										if (filterStartDate && filterEndDate) {
											// มี filter → แค่ set selectedDate
											setSelectedDate(dateStr);
											if (onDateChange) {
												onDateChange(dateStr);
											}
										} else {
											// ไม่มี filter → clear filter และ set selectedDate
											setFilterStartDate("");
											setFilterEndDate("");
											setFilterStartTime("");
											setFilterEndTime("");
											setSelectedDate(dateStr);
											if (onDateChange) {
												onDateChange(dateStr);
											}
										}
									}}
									title={`${formatDateDDMMYYYY(day)} - ${logsCount} logs`}
								>
									{dayNum}
								</button>
							);
						})
					) : (
						<div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
							ไม่มีข้อมูล
						</div>
					)}
				</div>
			</div>

			{/* รายการ Duty Logs แบบการ์ด (กลับมาใช้แบบเดิม) */}
			<ul className="space-y-4">
				{current.map((log) => {
					const commentCount = comments.filter((c) => c.logId === log.id).length;
					// แปลง Action Taken เป็น bullet points
					const actionLines = log.actionTaken 
						? log.actionTaken.split('\n').filter(line => line.trim()).map(line => line.trim())
						: [];
					const showActionPreview = actionLines.length > 3;
					const actionPreview = showActionPreview ? actionLines.slice(0, 3) : actionLines;
					
					return (
						<li key={log.id} className={`group rounded-2xl border shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${darkMode ? 'bg-[#2f3136] border-[#40444b] hover:border-[#5865f2]' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
							{/* Header with buttons */}
							<div className={`flex items-center justify-between border-b px-6 py-3 ${darkMode ? 'border-[#40444b]' : 'border-gray-200'}`}>
								<div className="flex items-center gap-3 flex-1">
									<h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{log.title}</h3>
									{/* แสดง category badge (เช่น "Lost and found item") */}
									{log.category && (
										<span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
											darkMode 
												? 'bg-blue-600 text-white border border-blue-500' 
												: 'bg-blue-100 text-blue-700 border border-blue-300'
										}`}>
											{log.category}
										</span>
									)}
								</div>
								<div className="flex shrink-0 gap-2" onClick={(e) => e.stopPropagation()}>
									<button
										title="Export"
										className={`inline-flex items-center justify-center rounded-lg border p-2 shadow-sm transition-colors ${darkMode ? 'bg-[#36393f] border-[#40444b] hover:bg-[#40444b] text-gray-300' : 'bg-white hover:bg-gray-50 text-black'}`}
										onClick={() => onExportSingle(log)}
									>
										<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16h8M8 12h8m-5-8h-3a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V9l-5-5z"/></svg>
									</button>
									{canEdit(log) && (
										<>
											<button
												title="Edit"
												className={`inline-flex items-center justify-center rounded-lg border p-2 shadow-sm transition-colors ${darkMode ? 'bg-[#36393f] border-[#40444b] hover:bg-[#40444b] text-gray-300' : 'bg-white hover:bg-gray-50 text-black'}`}
												onClick={() => onEdit(log)}
											>
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M4 13.5V20h6.5l8.036-8.036a2.5 2.5 0 10-3.536-3.536L7 16.5"/></svg>
											</button>
											<button
												title="Delete"
												className={`inline-flex items-center justify-center rounded-lg border p-2 shadow-sm transition-colors ${darkMode ? 'bg-[#36393f] border-[#40444b] hover:bg-[#40444b] text-gray-300' : 'bg-white hover:bg-gray-50 text-black'}`}
												onClick={() => onDelete(log.id)}
											>
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0V5a2 2 0 012-2h2a2 2 0 012 2v2"/></svg>
											</button>
										</>
									)}
								</div>
							</div>
							
							{/* 3-Column Layout */}
							<div className="grid grid-cols-3 gap-6 px-6 py-4 cursor-pointer" onClick={() => setDetail(log)}>
								{/* Left Column - Basic Info */}
								<div className="space-y-1">
									{log.category && (
										<p className={`text-sm mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
											<span className={`font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
												{language === "th" ? "หมวดหมู่:" : "Category:"}
											</span> {log.category}
										</p>
									)}
									{log.guestNameLocation && (
										<p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
											<span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t.guest}:</span> {log.guestName || log.guestNameLocation}
										</p>
									)}
									{log.roomNumber && (
										<p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
											<span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t.room}:</span> {log.roomNumber}
										</p>
									)}
									{log.dmShift && (
										<p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
											<span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t.dmShift}:</span> {
												log.dmShift === 'morning' ? t.dmShiftMorning : 
												log.dmShift === 'afternoon' ? t.dmShiftAfternoon : 
												t.dmShiftNight
											}
										</p>
									)}
									{log.moveTo && (
										<p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
											<span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t.moveTo}:</span> {log.moveTo}
										</p>
									)}
									{log.periodOfStay && (
										<p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
											<span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t.period}:</span> {log.periodOfStay}
										</p>
									)}
									{log.sourceOfBooking && (
										<p className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
											<span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>{t.source}:</span> {log.sourceOfBooking}
										</p>
									)}
									{/* แสดง thumbnail รูป (รูปแรก) */}
									{(log as any).images && (log as any).images.length > 0 && (
										<div className="mt-3 relative">
											<div className="relative w-full h-32 rounded-lg overflow-hidden border">
												<img 
													src={(log as any).images[0]} 
													alt="Evidence" 
													className="w-full h-full object-cover"
													onError={(e) => {
														// ถ้าโหลดรูปไม่ได้ ให้ซ่อน
														(e.target as HTMLImageElement).style.display = 'none';
													}}
												/>
												{/* Badge "+N" ถ้ามีหลายรูป */}
												{(log as any).images.length > 1 && (
													<div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${darkMode ? 'bg-black/70 text-white' : 'bg-white/90 text-gray-800'}`}>
														+{(log as any).images.length - 1}
													</div>
												)}
											</div>
										</div>
									)}
								</div>
								
								{/* Middle Column - Details/Issue */}
								<div className={`border-l border-r px-4 ${darkMode ? 'border-[#40444b]' : 'border-gray-200'}`}>
									<h4 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{t.details}</h4>
									<p className={`text-sm line-clamp-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{log.description}</p>
									{log.description && log.description.length > 150 && (
										<p className={`text-xs mt-2 hover:underline ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{t.more}</p>
									)}
								</div>
								
							{/* Right Column - Action Taken */}
							<div>
								<h4 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{t.actionTaken}</h4>
								{actionLines.length > 0 ? (
									<div className={`text-sm space-y-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
										{actionPreview.map((line, idx) => (
											<div key={idx} className="line-clamp-1">
												{line}
											</div>
										))}
										{showActionPreview && (
											<p className={`text-xs mt-2 hover:underline ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{t.more}</p>
										)}
									</div>
								) : (
									<p className={`text-sm italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.noData}</p>
								)}
							</div>
							</div>
							
							{/* Footer */}
							<div className={`flex items-center justify-between border-t px-6 py-3 text-sm ${darkMode ? 'border-[#40444b] text-gray-300' : 'border-gray-200 text-gray-700'}`}>
								<div className="flex items-center gap-4">
									<span className={`inline-flex items-center gap-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}><span>👤</span>{log.createdByName}</span>
									{log.incidentTime && (
										<span className={`inline-flex items-center gap-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}><span>🕒</span>{t.time}: {log.incidentTime}</span>
									)}
								</div>
								<div className={`flex items-center gap-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
								<span>💬</span>
								<span>{commentCount} {t.comments}</span>
								</div>
							</div>
						</li>
					);
				})}
			</ul>

			{/* Detail Modal */}
			{detail && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" role="dialog" aria-modal="true" onClick={() => setDetail(null)}>
					<div className={`mx-auto max-w-[90vw] rounded shadow-lg w-full ${darkMode ? 'bg-[#2f3136]' : 'bg-white'}`} onClick={(e)=>e.stopPropagation()}>
					<header className={`border-b px-6 py-4 ${darkMode ? 'border-[#40444b]' : 'border-gray-200'}`}>
						<div className="flex items-center gap-3 mb-2">
							<button 
								className="rounded bg-blue-500 px-3 py-2 text-white hover:bg-blue-600 flex items-center gap-2"
								onClick={() => setDetail(null)}
								title="ปิดและกลับไปหน้ารายการ"
							>
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
								</svg>
								ย้อนกลับ
							</button>
                            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{detail.title}</h3>
						</div>
						<div className="mt-2 flex flex-wrap gap-2">
							{detail.category && (
								<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
									darkMode 
										? 'bg-blue-600 text-white border border-blue-500' 
										: 'bg-blue-100 text-blue-700 border border-blue-300'
								}`}>
									{detail.category}
								</span>
							)}
							{detail.status && (
								<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
									detail.status === 'resolved' 
										? darkMode ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'
										: detail.status === 'in-progress' 
										? darkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800'
										: darkMode ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'
								}`}>{detail.status}</span>
							)}
							{detail.categorization && (
								<span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
									darkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800'
								}`}>{detail.categorization}</span>
							)}
						</div>
						<div className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>By {detail.createdByName} • {formatDateTimeDDMMYYYY(detail.createdAt)}</div>
					</header>
					<main className="mx-auto max-w-[90vw] px-6 py-6 max-h-[85vh] overflow-auto">
						{/* ฟิลด์ใหม่สำหรับโรงแรม */}
						<div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
							{detail.guestNameLocation && (
								<div className={`p-4 rounded-lg ${darkMode ? 'bg-[#36393f] border border-[#40444b]' : 'bg-gray-50'}`}>
										<h4 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t.guest}</h4>
										<p className={darkMode ? 'text-white' : 'text-gray-900'}>{detail.guestName || detail.guestNameLocation}</p>
								</div>
							)}
								{detail.roomNumber && (
									<div className={`p-4 rounded-lg ${darkMode ? 'bg-[#36393f] border border-[#40444b]' : 'bg-gray-50'}`}>
										<h4 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t.room}</h4>
										<p className={darkMode ? 'text-white' : 'text-gray-900'}>{detail.roomNumber}</p>
										</div>
									)}
						{detail.moveTo && (
							<div className={`p-4 rounded-lg ${darkMode ? 'bg-[#36393f] border border-[#40444b]' : 'bg-gray-50'}`}>
								<h4 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t.moveTo}</h4>
								<p className={darkMode ? 'text-white' : 'text-gray-900'}>{detail.moveTo}</p>
								</div>
							)}
							{detail.dmShift && (
								<div className={`p-4 rounded-lg ${darkMode ? 'bg-[#36393f] border border-[#40444b]' : 'bg-gray-50'}`}>
								<h4 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t.dmShift}</h4>
									<p className={darkMode ? 'text-white' : 'text-gray-900'}>
										{detail.dmShift === 'morning' ? t.dmShiftMorning : 
										 detail.dmShift === 'afternoon' ? t.dmShiftAfternoon : 
										 t.dmShiftNight}
									</p>
								</div>
							)}
							{detail.incidentTime && (
								<div className={`p-4 rounded-lg ${darkMode ? 'bg-[#36393f] border border-[#40444b]' : 'bg-gray-50'}`}>
								<h4 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t.time}</h4>
									<p className={darkMode ? 'text-white' : 'text-gray-900'}>{detail.incidentTime}</p>
								</div>
							)}
						{detail.periodOfStay && (
							<div className={`p-4 rounded-lg ${darkMode ? 'bg-[#36393f] border border-[#40444b]' : 'bg-gray-50'}`}>
								<h4 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t.period}</h4>
								<p className={darkMode ? 'text-white' : 'text-gray-900'}>{detail.periodOfStay}</p>
							</div>
						)}
						{detail.sourceOfBooking && (
							<div className={`p-4 rounded-lg ${darkMode ? 'bg-[#36393f] border border-[#40444b]' : 'bg-gray-50'}`}>
								<h4 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t.source}</h4>
								<p className={darkMode ? 'text-white' : 'text-gray-900'}>{detail.sourceOfBooking}</p>
								</div>
							)}
							{detail.categorization && (
								<div className={`p-4 rounded-lg ${darkMode ? 'bg-[#36393f] border border-[#40444b]' : 'bg-gray-50'}`}>
									<h4 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
										{language === "th" ? "หมวดหมู่" : "Categorization"}
									</h4>
									<p className={darkMode ? 'text-white' : 'text-gray-900'}>{detail.categorization}</p>
								</div>
							)}
						</div>
						
						<div className="mb-6">
							<h4 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t.details}</h4>
							<p className={`whitespace-pre-wrap text-[15px] leading-7 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{detail.description}</p>
						</div>
						
						{detail.actionTaken && (
							<div className="mb-6">
								<h4 className={`font-semibold text-sm mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{t.actionTaken}</h4>
								<p className={`whitespace-pre-wrap text-[15px] leading-7 ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{detail.actionTaken}</p>
							</div>
						)}
                        {/* Evidence Images Section */}
                        <div className="mt-6">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className={`font-semibold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    {language === "th" ? "หลักฐานภาพ" : "Evidence Images"}
                                    {(detail as any).images?.length > 0 && (
                                        <span className={`ml-2 text-xs font-normal ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            ({(detail as any).images.length}/3)
                                        </span>
                                    )}
                                </h4>
                                {onUpdateImages && (
                                    <label className={`cursor-pointer rounded px-3 py-1.5 text-xs border transition-colors ${darkMode ? 'bg-[#36393f] border-[#40444b] text-gray-300 hover:bg-[#40444b]' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
                                        {language === "th" ? "📤 อัปโหลดหลักฐาน" : "📤 Upload Evidence"}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={async (e) => {
                                                const files = Array.from(e.target.files ?? []);
                                                if (files.length === 0) return;
                                                
                                                const currentImages = (detail as any).images || [];
                                                const MAX_IMAGES = 3;
                                                const MAX_FILE_SIZE_MB = 1;
                                                const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
                                                
                                                // ตรวจสอบจำนวนรูป
                                                if (currentImages.length + files.length > MAX_IMAGES) {
                                                    alert(language === "th" 
                                                        ? `ไม่สามารถอัปโหลดได้เกิน ${MAX_IMAGES} รูป (ปัจจุบันมี ${currentImages.length} รูป)` 
                                                        : `Cannot upload more than ${MAX_IMAGES} images (currently ${currentImages.length} images)`);
                                                    return;
                                                }
                                                
                                                // ตรวจสอบขนาดไฟล์
                                                const oversizedFiles = files.filter(f => f.size > MAX_FILE_SIZE_BYTES);
                                                if (oversizedFiles.length > 0) {
                                                    alert(language === "th" 
                                                        ? `ไฟล์บางไฟล์ใหญ่เกิน ${MAX_FILE_SIZE_MB}MB: ${oversizedFiles.map(f => f.name).join(', ')}` 
                                                        : `Some files exceed ${MAX_FILE_SIZE_MB}MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
                                                    return;
                                                }
                                                
                                                // แปลงไฟล์เป็น data URL (สำหรับ frontend-only)
                                                // ใน production ควร upload ไปยัง server แล้วได้ URL
                                                const fileToDataUrl = (f: File) => new Promise<string>((resolve, reject) => {
                                                    const reader = new FileReader();
                                                    reader.onload = () => resolve(String(reader.result));
                                                    reader.onerror = reject;
                                                    reader.readAsDataURL(f);
                                                });
                                                
                                                try {
                                                    const dataUrls = await Promise.all(files.map(fileToDataUrl));
                                                    const newImages = [...currentImages, ...dataUrls];
                                                    
                                                    if (onUpdateImages) {
                                                        onUpdateImages(detail.id, newImages);
                                                        // อัปเดต detail state ทันที
                                                        setDetail({ ...detail, images: newImages } as any);
                                                    }
                                                } catch (error) {
                                                    console.error("Error uploading images:", error);
                                                    alert(language === "th" ? "เกิดข้อผิดพลาดในการอัปโหลดรูป" : "Error uploading images");
                                                }
                                                
                                                // Reset input
                                                e.target.value = '';
                                            }}
                                        />
                                    </label>
                                )}
                            </div>
                            
                            {(detail as any).images?.length ? (
                                <div className="space-y-4">
                                    {(detail as any).images.map((src: string, idx: number) => {
                                        const isDataUrl = src.startsWith('data:');
                                        const dataUrlSizeKB = isDataUrl ? Math.ceil((src.length - (src.indexOf(',') + 1)) * 0.75 / 1024) : 0;
                                        
                                        return (
                                            <div key={idx} className="overflow-hidden rounded-lg border bg-black/5 relative group">
                                                <div className="flex items-center justify-center">
                                                    <img src={src} alt="attachment" className="h-auto max-h-[60vh] w-auto max-w-full cursor-zoom-in" onClick={() => setViewingImage(src)} />
                                                </div>
                                                {onUpdateImages && (
                                                    <button
                                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-1.5 transition-opacity"
                                                        onClick={() => {
                                                            const currentImages = (detail as any).images || [];
                                                            const newImages = currentImages.filter((_: any, i: number) => i !== idx);
                                                            onUpdateImages(detail.id, newImages);
                                                            setDetail({ ...detail, images: newImages } as any);
                                                        }}
                                                        title={language === "th" ? "ลบรูป" : "Delete image"}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                )}
                                                {isDataUrl && dataUrlSizeKB > 100 && (
                                                    <div className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs ${darkMode ? 'bg-yellow-900/80 text-yellow-200' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {language === "th" ? `⚠️ Data URL (${dataUrlSizeKB}KB) - เหมาะแค่ dev` : `⚠️ Data URL (${dataUrlSizeKB}KB) - dev only`}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className={`text-sm italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {language === "th" ? "ยังไม่มีหลักฐานภาพ" : "No evidence images"}
                                </p>
                            )}
                        </div>

						{/* Comments */}
						<section className="mt-8">
							<h4 className={`mb-3 text-base font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{t.comments}</h4>
								<div className="space-y-3">
								{comments.filter((c) => c.logId === detail.id).map((c) => (
									<div key={c.id} className={`rounded border px-3 py-2 ${
										darkMode 
											? 'bg-[#36393f] border-[#40444b]' 
											: 'bg-white border-gray-200'
									}`}>
										<div className="flex items-center justify-between">
											<div className={`text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
												{c.userName} 
												<span className={`ml-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
													{formatDateTimeDDMMYYYY(c.createdAt)}
												</span>
											</div>
											{c.userId === currentUserId && (
												<button
													onClick={() => onDeleteComment(c.id)}
													className={`text-xs px-2 py-1 rounded transition-colors ${
														darkMode 
															? 'text-red-400 hover:text-red-300 hover:bg-red-900/30' 
															: 'text-red-500 hover:text-red-700 hover:bg-red-50'
													}`}
													title="ลบคอมเมนต์"
												>
													🗑️ ลบ
												</button>
											)}
										</div>
										<div className={`text-sm mt-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{c.content}</div>
									</div>
								))}
								{comments.filter((c) => c.logId === detail.id).length === 0 && (
									<div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.noData}</div>
								)}
							</div>
								<div className="mt-4 flex gap-2">
                                <input
                                    className={`w-full rounded border px-3 py-2 ${
										darkMode 
											? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none' 
											: 'border-gray-300 focus:border-blue-500 focus:outline-none'
									}`}
                                    placeholder=""
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const text = newComment.trim();
                                            if (!text) return;
                                            onAddComment(detail.id, text);
                                            setNewComment('');
                                        }
                                    }}
                                />
                                <button
                                    className={`rounded px-3 py-2 text-white transition-colors ${
										darkMode 
											? 'bg-blue-600 hover:bg-blue-700' 
											: 'bg-blue-500 hover:bg-blue-600'
									}`}
                                    onClick={() => {
                                        const text = newComment.trim();
                                        if (!text) return;
                                        onAddComment(detail.id, text);
                                        setNewComment('');
                                    }}
                                >
                                    {t.addComment}
                                </button>
                            </div>
						</section>
					</main>
				</div>
			</div>
			)}

            {viewingImage && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setViewingImage(null)}>
                    <img src={viewingImage} alt="full" className="max-h-[95vh] max-w-[95vw] object-contain" />
                </div>
            )}

			{/* Export Modal */}
			{showExportModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
					<div className={`w-full max-w-md rounded p-6 shadow ${darkMode ? 'bg-[#2f3136]' : 'bg-white'}`}>
						<h3 className={`mb-4 text-lg font-semibold ${darkMode ? 'text-white' : ''}`}>{t.exportTitle}</h3>
						<div className="space-y-4">
							<div>
								<label className={`mb-1 block text-sm font-medium ${darkMode ? 'text-gray-200' : ''}`}>{t.startDate}</label>
								<input
									type="date"
									className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white' : ''}`}
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
								/>
							</div>
							<div>
								<label className={`mb-1 block text-sm font-medium ${darkMode ? 'text-gray-200' : ''}`}>{t.endDate}</label>
								<input
									type="date"
									className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white' : ''}`}
									value={endDate}
									onChange={(e) => setEndDate(e.target.value)}
								/>
							</div>
							<div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
								{startDate && endDate ? (
									<>{t.exportInfo}: <span className="font-mono">{startDate.replace(/-/g, '')}_{endDate.replace(/-/g, '')}.xlsx</span></>
								) : (
									<>{t.exportInfo}: <span className="font-mono">duty-logs-{new Date().toISOString().split('T')[0]}.xlsx</span></>
								)}
							</div>
						</div>
						<div className="mt-6 flex justify-end gap-2">
							<button
								className={`rounded px-3 py-2 transition-colors ${darkMode ? 'bg-[#36393f] text-gray-300 hover:bg-[#40444b]' : 'hover:bg-gray-100'}`}
								onClick={() => setShowExportModal(false)}
							>
								{t.cancel}
							</button>
							<button
								className={`rounded px-3 py-2 text-white transition-colors ${darkMode ? 'bg-[#5865f2] hover:bg-[#4752c4]' : 'bg-blue-500 hover:bg-blue-600'}`}
								onClick={() => {
									onExport({ startDate, endDate });
									setShowExportModal(false);
								}}
							>
								{t.export}
							</button>
						</div>
					</div>
				</div>
			)}
			
			{/* Filter Modal */}
			{showFilterModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
					<div className={`w-full max-w-md rounded p-6 shadow ${darkMode ? 'bg-[#2f3136]' : 'bg-white'}`}>
						<h3 className={`mb-4 text-lg font-semibold ${darkMode ? 'text-white' : ''}`}>{t.filterTitle}</h3>
						<div className="space-y-4">
							<div>
								<label className={`mb-1 block text-sm font-medium ${darkMode ? 'text-gray-200' : ''}`}>{t.startDate}</label>
								<input
									type="date"
									className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white' : ''}`}
									value={filterStartDate}
									onChange={(e) => setFilterStartDate(e.target.value)}
								/>
								<input
									type="time"
									className={`mt-2 w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white' : ''}`}
									value={filterStartTime}
									onChange={(e) => setFilterStartTime(e.target.value)}
								/>
							</div>
							<div>
								<label className={`mb-1 block text-sm font-medium ${darkMode ? 'text-gray-200' : ''}`}>{t.endDate}</label>
								<input
									type="date"
									className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white' : ''}`}
									value={filterEndDate}
									onChange={(e) => setFilterEndDate(e.target.value)}
								/>
								<input
									type="time"
									className={`mt-2 w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white' : ''}`}
									value={filterEndTime}
									onChange={(e) => setFilterEndTime(e.target.value)}
								/>
							</div>
							<div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
								{filterStartDate && filterEndDate ? (
									<>
										{language === "th" ? "แสดงข้อมูลตั้งแต่" : "Showing data from"}{' '}
										<span className="font-medium">
											{formatDateDDMMYYYY(filterStartDate)}
										</span>{' '}
										{language === "th" ? "ถึง" : "to"}{' '}
										<span className="font-medium">
											{formatDateDDMMYYYY(filterEndDate)}
										</span>
									</>
								) : filterStartDate ? (
									<>{language === "th" ? "เลือกวันที่สิ้นสุดเพื่อกรองข้อมูล" : "Select end date to filter data"}</>
								) : (
									<>{language === "th" ? "เลือกช่วงวันที่เพื่อกรองข้อมูล" : "Select date range to filter data"}</>
								)}
							</div>
						</div>
						<div className="mt-6 flex justify-end gap-2">
							<button
								className={`rounded px-3 py-2 transition-colors ${darkMode ? 'bg-[#36393f] text-gray-300 hover:bg-[#40444b]' : 'hover:bg-gray-100'}`}
								onClick={() => {
									// Clear filter และ set selectedDate เป็นวันปัจจุบัน
									setFilterStartDate("");
									setFilterEndDate("");
									setFilterStartTime("");
									setFilterEndTime("");
									const today = new Date().toISOString().split('T')[0];
									setSelectedDate(today);
									if (onDateChange) {
										onDateChange(today);
									}
									setShowFilterModal(false);
								}}
							>
								{t.clear}
							</button>
							<button
								className={`rounded px-3 py-2 transition-colors ${darkMode ? 'bg-[#36393f] text-gray-300 hover:bg-[#40444b]' : 'hover:bg-gray-100'}`}
								onClick={() => setShowFilterModal(false)}
							>
								{t.cancel}
							</button>
							<button
								className={`rounded px-3 py-2 text-white transition-colors ${darkMode ? 'bg-[#5865f2] hover:bg-[#4752c4]' : 'bg-blue-500 hover:bg-blue-600'}`}
								onClick={() => {
									if (filterStartDate && filterEndDate && filterStartDate > filterEndDate) {
										alert('วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด');
										return;
									}
									// เมื่อกด Apply ให้ set selectedDate เป็น filterEndDate (วันล่าสุด) เพื่อ highlight ปุ่มวันที่ขวาสุด
									if (filterStartDate && filterEndDate) {
										setSelectedDate(filterEndDate);
										if (onDateChange) {
											onDateChange(filterEndDate);
										}
									}
									setShowFilterModal(false);
								}}
							>
								{t.apply}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Import Modal */}
			{showImportModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
					<div className={`w-full max-w-md rounded p-6 shadow ${darkMode ? 'bg-[#2f3136]' : 'bg-white'}`}>
						<h3 className={`mb-4 text-lg font-semibold ${darkMode ? 'text-white' : ''}`}>{t.importTitle}</h3>
						<div className="space-y-4">
							<div>
								<label className={`mb-1 block text-sm font-medium ${darkMode ? 'text-gray-200' : ''}`}>{t.importInfo}</label>
								<input
									type="file"
									accept=".xlsx,.xls"
									className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white' : ''}`}
									onChange={(e) => {
										const file = e.target.files?.[0];
										if (file) {
											setImportFile(file);
										}
									}}
								/>
							</div>
							{importFile && (
								<div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
									{language === "th" ? "ไฟล์ที่เลือก:" : "Selected file:"} <span className="font-mono">{importFile.name}</span>
								</div>
							)}
						</div>
						<div className="mt-6 flex justify-end gap-2">
							<button
								className={`rounded px-3 py-2 transition-colors ${darkMode ? 'bg-[#36393f] text-gray-300 hover:bg-[#40444b]' : 'hover:bg-gray-100'}`}
								onClick={() => {
									setShowImportModal(false);
									setImportFile(null);
								}}
							>
								{t.cancel}
							</button>
							<button
								className={`rounded px-3 py-2 text-white transition-colors ${darkMode ? 'bg-[#5865f2] hover:bg-[#4752c4]' : 'bg-blue-500 hover:bg-blue-600'}`}
								disabled={!importFile}
								onClick={async () => {
									if (!importFile) return;
									try {
										const { dates } = await onImport(importFile);
										
										// หลังจาก import เสร็จ ให้ set selectedDate เป็นวันแรกจาก Excel
										if (dates && dates.length > 0) {
											const firstDate = dates[0]; // ใช้วันแรก หรือ dates[dates.length - 1] สำหรับวันล่าสุด
											setSelectedDate(firstDate);
											if (onDateChange) {
												onDateChange(firstDate);
											}
											console.log("Selected date after import:", firstDate);
										}
										
										setShowImportModal(false);
										setImportFile(null);
									} catch (error) {
										console.error('Import error:', error);
									}
								}}
							>
								{t.import}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Pagination */}
			<div className="mt-6 flex items-center justify-between text-sm text-gray-600">
				<span>
					Showing {filtered.length === 0 ? 0 : start + 1}-{Math.min(start + pageSize, filtered.length)} of {filtered.length}
				</span>
				<div className="flex gap-2">
					<button disabled={page <= 1} className="rounded border bg-white px-3 py-1 disabled:opacity-50" onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
					<span>Page {page} / {totalPages}</span>
					<button disabled={page >= totalPages} className="rounded border bg-white px-3 py-1 disabled:opacity-50" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
				</div>
			</div>
		</section>
	);
}
