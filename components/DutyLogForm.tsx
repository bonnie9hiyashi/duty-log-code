import React, { useEffect, useState } from "react";
import { DutyLog } from "../types";

// Helper function to format date as dd/mm/yyyy
const formatDateDDMMYYYY = (date: Date | string): string => {
	const d = typeof date === 'string' ? new Date(date) : date;
	const day = String(d.getDate()).padStart(2, '0');
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const year = d.getFullYear();
	return `${day}/${month}/${year}`;
};

type DutyLogFormProps = {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: Partial<DutyLog>) => void;
	editLog: DutyLog | null;
	language: "th" | "en";
	darkMode?: boolean;
};

const texts = {
	th: {
		title: "หัวข้อ",
		guestName: "ชื่อแขก",
		roomNumber: "เลขห้อง",
		moveTo: "ย้ายไป (ถ้ามี)",
		dmShift: "กะ",
		dmShiftMorning: "กะเช้า",
		dmShiftAfternoon: "กะบ่าย",
		dmShiftNight: "กะดึก",
		incidentTime: "เวลาเกิดเหตุ",
		chooseTime: "ใช้เวลาปัจจุบัน",
		sourceOfBooking: "ช่องทางการจอง",
		sourceCustom: "อื่นๆ (พิมพ์)",
		checkIn: "เช็คอิน",
		checkOut: "เช็คเอาต์",
		periodOfStay: "ช่วงเวลาการเข้าพัก",
		details: "รายละเอียด",
		actionTaken: "การดำเนินการ",
		images: "รูปภาพ (ถ้ามี)",
		cancel: "ยกเลิก",
		create: "สร้าง",
		update: "บันทึก",
		placeholderGuest: "",
		placeholderRoom: "",
		placeholderMove: "",
		placeholderIncident: "",
		placeholderSource: "",
		placeholderDetails: "",
		placeholderAction: "",
		sourceOptions: ["Agoda", "Trip.com", "Traveloka", "Booking.com", "อื่นๆ"],
	},
	en: {
		title: "Title",
		guestName: "Guest Name",
		roomNumber: "Room Number",
		moveTo: "Move to (if any)",
		dmShift: "DM Shift",
		dmShiftMorning: "Morning",
		dmShiftAfternoon: "Afternoon",
		dmShiftNight: "Night",
		incidentTime: "Incident Time",
		chooseTime: "Current time",
		sourceOfBooking: "Source of Booking",
		sourceCustom: "Custom source",
		checkIn: "Check-in Date",
		checkOut: "Check-out Date",
		periodOfStay: "Period of Stay",
		details: "Details / Issue",
		actionTaken: "Action Taken",
		images: "Images (optional)",
		cancel: "Cancel",
		create: "Create",
		update: "Update",
		placeholderGuest: "",
		placeholderRoom: "",
		placeholderMove: "",
		placeholderIncident: "",
		placeholderSource: "",
		placeholderDetails: "",
		placeholderAction: "",
		sourceOptions: ["Agoda", "Trip.com", "Traveloka", "Booking.com", "Other"],
	},
};

export function DutyLogForm({ isOpen, onClose, onSubmit, editLog, language, darkMode = false }: DutyLogFormProps) {
	const t = texts[language];
	const sourceOptions = language === "th" ? texts.th.sourceOptions : texts.en.sourceOptions;
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
    const [category, setCategory] = useState(""); // legacy hidden
    const [statusText, setStatusText] = useState<string>(""); // legacy hidden
	
	// ฟิลด์ใหม่สำหรับโรงแรม
	const [guestName, setGuestName] = useState("");
	const [roomNumber, setRoomNumber] = useState("");
	const [dmShift, setDmShift] = useState<DutyLog["dmShift"]>("morning");
	const [incidentTime, setIncidentTime] = useState("");
	const [actionTaken, setActionTaken] = useState("");
	const [periodOfStay, setPeriodOfStay] = useState("");
	const [periodStartDate, setPeriodStartDate] = useState("");
	const [periodEndDate, setPeriodEndDate] = useState("");
	const [sourceOfBooking, setSourceOfBooking] = useState("");
	const [customSource, setCustomSource] = useState("");
	const [moveTo, setMoveTo] = useState("");

	const [images, setImages] = useState<string[]>([]);

	// hidden file input ref for click from dropzone
	const fileInputId = "dutylog-images-input";

	useEffect(() => {
		if (editLog) {
			setTitle(editLog.title);
			setDescription(editLog.description);
            setCategory(editLog.category || "");
            setStatusText((editLog.status as any) || "");
			setImages((editLog as any).images ?? []);
			
		// ฟิลด์ใหม่
		setGuestName(editLog.guestName || editLog.guestNameLocation || "");
		setRoomNumber(editLog.roomNumber || "");
		setDmShift(editLog.dmShift || "morning");
		setIncidentTime(editLog.incidentTime || "");
		setActionTaken(editLog.actionTaken || "");
		setPeriodOfStay(editLog.periodOfStay || "");
		// ถ้ามีข้อมูล periodOfStay เก่า ให้เก็บไว้ และไม่ต้อง parse
		setPeriodStartDate("");
		setPeriodEndDate("");
		if (editLog.sourceOfBooking && sourceOptions.includes(editLog.sourceOfBooking)) {
			setSourceOfBooking(editLog.sourceOfBooking);
			setCustomSource("");
		} else if (editLog.sourceOfBooking) {
			setSourceOfBooking(language === "th" ? "custom" : "Other");
			setCustomSource(editLog.sourceOfBooking);
		} else {
			setSourceOfBooking("");
			setCustomSource("");
		}
		setMoveTo(editLog.moveTo || "");
	} else {
		setTitle("");
		setDescription("");
            setCategory("");
            setStatusText("");
		setImages([]);
		
		// รีเซ็ตฟิลด์ใหม่
		setGuestName("");
		setRoomNumber("");
		setDmShift("morning");
		setIncidentTime("");
		setActionTaken("");
		setPeriodOfStay("");
		setPeriodStartDate("");
		setPeriodEndDate("");
		setSourceOfBooking("");
		setCustomSource("");
		setMoveTo("");
	}
}, [editLog, sourceOptions]);

	// Reset form when opening for new log
	useEffect(() => {
		if (isOpen && !editLog) {
			setTitle("");
			setDescription("");
            setCategory("");
            setStatusText("");
			setImages([]);
			
		// รีเซ็ตฟิลด์ใหม่
		setGuestName("");
		setRoomNumber("");
		setDmShift("morning");
		setIncidentTime("");
		setActionTaken("");
		setPeriodOfStay("");
		setPeriodStartDate("");
		setPeriodEndDate("");
		setSourceOfBooking("");
		setCustomSource("");
		setMoveTo("");
	}
}, [isOpen, editLog]);

	if (!isOpen) return null;

return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
        <div className={`w-full max-w-4xl rounded p-5 shadow max-h-[90vh] overflow-y-auto ${darkMode ? 'bg-[#2f3136]' : 'bg-white'}`} onClick={(e)=>e.stopPropagation()}>
				<h2 className={`mb-4 text-lg font-semibold ${darkMode ? 'text-white' : ''}`}>{editLog ? t.update : t.create}</h2>
				<div className="space-y-3">
					<div>
						<label className={`mb-1 block text-sm ${darkMode ? 'text-gray-200' : ''}`}>{t.title}</label>
						<input className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500' : ''}`} value={title} onChange={(e) => setTitle(e.target.value)} />
					</div>
					
				{/* ฟิลด์ใหม่สำหรับโรงแรม */}
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className={`mb-1 block text-sm ${darkMode ? 'text-gray-200' : ''}`}>{t.guestName}</label>
						<input 
							className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500' : ''}`}
							placeholder={t.placeholderGuest}
							value={guestName} 
							onChange={(e) => setGuestName(e.target.value)} 
						/>
					</div>
					<div>
						<label className={`mb-1 block text-sm ${darkMode ? 'text-gray-200' : ''}`}>{t.roomNumber}</label>
						<input 
							className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500' : ''}`}
							placeholder={t.placeholderRoom}
							value={roomNumber} 
							onChange={(e) => setRoomNumber(e.target.value)} 
						/>
					</div>
					<div>
						<label className={`mb-1 block text-sm ${darkMode ? 'text-gray-200' : ''}`}>{t.moveTo}</label>
						<input 
							className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500' : ''}`}
							placeholder={t.placeholderMove}
							value={moveTo} 
							onChange={(e) => setMoveTo(e.target.value)} 
						/>
					</div>
				</div>
					
					<div className="grid grid-cols-3 gap-3">
						<div>
							<label className={`mb-1 block text-sm ${darkMode ? 'text-gray-200' : ''}`}>{t.dmShift}</label>
							<select 
								className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white' : ''}`}
								value={dmShift} 
								onChange={(e) => setDmShift(e.target.value as DutyLog["dmShift"])}
							>
								<option value="morning">{t.dmShiftMorning}</option>
								<option value="afternoon">{t.dmShiftAfternoon}</option>
								<option value="night">{t.dmShiftNight}</option>
							</select>
						</div>
						<div>
							<label className={`mb-1 block text-sm ${darkMode ? 'text-gray-200' : ''}`}>{t.incidentTime}</label>
							<input 
								type="time"
								className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500' : ''}`}
								placeholder={t.placeholderIncident}
								step={300}
								value={incidentTime}
								onChange={(e) => setIncidentTime(e.target.value)}
							/>
							<button
								type="button"
								className={`mt-2 w-full rounded border px-3 py-2 text-sm transition-colors ${darkMode ? 'bg-[#36393f] border-[#40444b] text-gray-300 hover:bg-[#40444b]' : 'hover:bg-gray-50'}`}
								onClick={() => {
									const now = new Date();
									const hh = String(now.getHours()).padStart(2, "0");
									const mm = String(now.getMinutes()).padStart(2, "0");
									setIncidentTime(`${hh}:${mm}`);
								}}
							>
								{t.chooseTime}
							</button>
						</div>
						<div>
							<label className={`mb-1 block text-sm ${darkMode ? 'text-gray-200' : ''}`}>{t.sourceOfBooking}</label>
							<select
								className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white' : ''}`}
								value={sourceOfBooking}
								onChange={(e) => setSourceOfBooking(e.target.value)}
							>
								{sourceOptions.map((opt) => (
									<option key={opt} value={opt === "อื่นๆ" || opt === "Other" ? "custom" : opt}>
										{opt}
									</option>
								))}
							</select>
							{(sourceOfBooking === "custom" || sourceOfBooking === "Other") && (
								<input
									className={`mt-2 w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500' : ''}`}
									placeholder={t.sourceCustom}
									value={customSource}
									onChange={(e) => setCustomSource(e.target.value)}
								/>
							)}
						</div>
					</div>
				
				<div>
					<label className={`mb-1 block text-sm ${darkMode ? 'text-gray-200' : ''}`}>{t.periodOfStay}</label>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className={`mb-1 block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t.checkIn}</label>
							<input 
								type="date"
								className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white' : ''}`}
								value={periodStartDate} 
								onChange={(e) => setPeriodStartDate(e.target.value)} 
							/>
						</div>
						<div>
							<label className={`mb-1 block text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t.checkOut}</label>
							<input 
								type="date"
								className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white' : ''}`}
								value={periodEndDate} 
								onChange={(e) => setPeriodEndDate(e.target.value)} 
							/>
						</div>
					</div>
					{periodStartDate && periodEndDate && (
						<div className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
							<span className="font-medium">Preview:</span>{' '}
							{formatDateDDMMYYYY(periodStartDate)} - {formatDateDDMMYYYY(periodEndDate)}
						</div>
					)}
				</div>
                {/* ซ่อน Category/Status/Categorization ตามคำขอ: ตัดออกจากฟอร์ม */}
				<div>
					<label className={`mb-1 block text-sm ${darkMode ? 'text-gray-200' : ''}`}>{t.details}</label>
					<textarea className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500' : ''}`} rows={4} placeholder={t.placeholderDetails} value={description} onChange={(e) => setDescription(e.target.value)} />
				</div>
				
				<div>
					<label className={`mb-1 block text-sm ${darkMode ? 'text-gray-200' : ''}`}>{t.actionTaken}</label>
					<textarea 
						className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500' : ''}`}
						rows={4} 
						placeholder={t.placeholderAction}
						value={actionTaken} 
						onChange={(e) => setActionTaken(e.target.value)} 
					/>
				</div>

					<div className="mt-3">
						<label className="mb-1 block text-sm">{t.images}</label>
						{/* Dropzone-like upload box */}
						<div
							className="flex cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center hover:bg-gray-100"
							onClick={() => document.getElementById(fileInputId)?.click()}
							onDragOver={(e) => e.preventDefault()}
							onDrop={async (e) => {
								e.preventDefault();
								const files = Array.from(e.dataTransfer.files ?? []);
								const fileToBase64 = (f: File) => new Promise<string>((resolve, reject) => {
									const reader = new FileReader();
									reader.onload = () => resolve(String(reader.result));
									reader.onerror = reject;
									reader.readAsDataURL(f);
								});
								const encoded = await Promise.all(files.map(fileToBase64));
								setImages(encoded);
							}}
						>
							{/* upload icon */}
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="mb-2 h-8 w-8 text-gray-400">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6H17a3 3 0 011 5.83M12 12v9m0 0l-3-3m3 3l3-3" />
							</svg>
							<div className="text-sm text-gray-600">{language === "th" ? "อัปโหลดหลักฐานภาพ" : "Upload photo evidence"}</div>
							<button type="button" className="mt-3 rounded bg-white px-4 py-2 text-sm shadow">{language === "th" ? "เลือกไฟล์" : "Choose Files"}</button>
							<input
								id={fileInputId}
								type="file"
								accept="image/*"
								multiple
								className="hidden"
								onChange={async (e) => {
									const files = Array.from(e.target.files ?? []);
									const fileToBase64 = (f: File) => new Promise<string>((resolve, reject) => {
										const reader = new FileReader();
										reader.onload = () => resolve(String(reader.result));
										reader.onerror = reject;
										reader.readAsDataURL(f);
									});
									const encoded = await Promise.all(files.map(fileToBase64));
									setImages(encoded);
								}}
							/>
						</div>

						{images.length > 0 && (
							<div className="mt-3 grid grid-cols-4 gap-2">
								{images.map((src, idx) => (
									<div key={idx} className="overflow-hidden rounded border">
										<img src={src} alt="preview" className="h-24 w-full object-cover" />
									</div>)
								)}
							</div>
						)}
					</div>
				</div>
				<div className="mt-5 flex justify-end gap-2">
					<button className={`rounded px-3 py-2 transition-colors ${darkMode ? 'bg-[#36393f] text-gray-300 hover:bg-[#40444b]' : 'hover:bg-gray-100'}`} onClick={onClose}>{t.cancel}</button>
					<button
						className={`rounded px-3 py-2 text-white transition-colors ${darkMode ? 'bg-[#5865f2] hover:bg-[#4752c4]' : 'bg-black hover:bg-gray-800'}`}
						onClick={() => {
						// สร้าง periodOfStay string จาก dates
						let finalPeriodOfStay = periodOfStay;
						if (periodStartDate && periodEndDate) {
							finalPeriodOfStay = `${formatDateDDMMYYYY(periodStartDate)} - ${formatDateDDMMYYYY(periodEndDate)}`;
						}
						const finalSource = (sourceOfBooking === "custom" || sourceOfBooking === "Other") ? customSource : sourceOfBooking;
						const baseGuest = guestName || editLog?.guestNameLocation || "";
						const guestNameLocation = [baseGuest, roomNumber ? `Room ${roomNumber}` : ""].filter(Boolean).join(" • ");
						onSubmit({ 
							title, 
							description, 
							category, 
                                status: (statusText as any) || undefined, 
							images,
							guestNameLocation,
							guestName,
							roomNumber,
							dmShift,
							incidentTime,
							actionTaken,
							periodOfStay: finalPeriodOfStay,
							sourceOfBooking: finalSource,
							moveTo
						});
							onClose();
						}}
					>
						{editLog ? t.update : t.create}
					</button>
				</div>
			</div>
		</div>
	);
}


