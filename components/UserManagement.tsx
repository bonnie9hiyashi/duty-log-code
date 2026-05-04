import React, { useMemo, useState } from "react";

// Helper function to format date as dd/mm/yyyy
const formatDateDDMMYYYY = (date: Date | string): string => {
	const d = typeof date === 'string' ? new Date(date) : date;
	const day = String(d.getDate()).padStart(2, '0');
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const year = d.getFullYear();
	return `${day}/${month}/${year}`;
};

type User = {
	id: string;
	username: string;
	fullName: string;
	email?: string;
	role: "admin" | "staff" | "manager";
	roleName?: string;
	createdAt: string;
};

type UserManagementProps = {
    users: User[];
    roles?: string[];
    onAddRole?: (name: string) => void;
    onRemoveRole?: (name: string) => void;
    onCreateUser: (u: Omit<User, "id" | "createdAt">) => void;
    onUpdateUser: (id: string, u: Partial<User>) => void;
    onDeleteUser: (id: string) => void;
	language: "th" | "en";
	darkMode?: boolean;
};

const texts = {
	th: {
		title: "จัดการผู้ใช้",
		subtitle: "จัดการผู้ใช้ระบบและสิทธิ์",
		create: "+ สร้างผู้ใช้",
		username: "ชื่อผู้ใช้",
		fullName: "ชื่อ-สกุล",
		email: "อีเมล",
		role: "บทบาท",
		position: "ตำแหน่ง",
		created: "วันที่สร้าง",
		actions: "การทำงาน",
		admin: "ผู้ดูแล",
		staff: "พนักงาน",
		manager: "ผู้จัดการ",
		edit: "แก้ไข",
		delete: "ลบ",
		modalCreate: "สร้างผู้ใช้ใหม่",
		modalEdit: "แก้ไขผู้ใช้",
		password: "รหัสผ่าน",
		roleLabel: "บทบาท *",
		positionLabel: "ตำแหน่ง (กำหนดเอง)",
		add: "เพิ่ม",
		select: "เลือก…",
		save: "บันทึก",
		cancel: "ยกเลิก",
		usernamePh: "",
		passwordPh: "",
		fullNamePh: "",
		emailPh: "",
		addPositionPh: "",
		search: "ค้นหา...",
		searchPlaceholder: "",
		noResults: "ไม่พบผลลัพธ์",
		resultsCount: "พบ {count} รายการ",
	},
	en: {
		title: "User Management",
		subtitle: "Manage system users and permissions",
		create: "+ Create User",
		username: "Username",
		fullName: "Full Name",
		email: "Email",
		role: "Role",
		position: "Position",
		created: "Created",
		actions: "Actions",
		admin: "Admin",
		staff: "Staff",
		manager: "Manager",
		edit: "Edit",
		delete: "Delete",
		modalCreate: "Create New User",
		modalEdit: "Edit User",
		password: "Password",
		roleLabel: "Role *",
		positionLabel: "Position (custom role name)",
		add: "Add",
		select: "Select…",
		save: "Save",
		cancel: "Cancel",
		usernamePh: "",
		passwordPh: "",
		fullNamePh: "",
		emailPh: "",
		addPositionPh: "",
		search: "Search...",
		searchPlaceholder: "",
		noResults: "No results found",
		resultsCount: "Found {count} result(s)",
	},
};

export function UserManagement({ users, roles: externalRoles, onAddRole, onRemoveRole, onCreateUser, onUpdateUser, onDeleteUser, language, darkMode = false }: UserManagementProps) {
	const t = texts[language];
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState<{ username: string; password: string; fullName: string; email: string; role: "staff" | "admin" | "manager"; roleName: string }>({ username: "", password: "", fullName: "", email: "", role: "staff", roleName: "" });

	// role directory (custom names)
	const [roles, setRoles] = useState<string[]>(externalRoles ?? ["IT/Admin", "Staff"]);
	const [newRoleName, setNewRoleName] = useState<string>("");
	const [editId, setEditId] = useState<string | null>(null);
	
	// Search state
	const [searchQuery, setSearchQuery] = useState<string>("");

	// Filter users based on search query
	const rows = useMemo(() => {
		if (!searchQuery.trim()) {
			return users;
		}
		
		const query = searchQuery.toLowerCase().trim();
		return users.filter((user) => {
			// Search in username
			if (user.username.toLowerCase().includes(query)) return true;
			
			// Search in full name
			if (user.fullName.toLowerCase().includes(query)) return true;
			
			// Search in email
			if (user.email?.toLowerCase().includes(query)) return true;
			
			// Search in role (admin/staff/manager)
			const roleText = user.role === "admin" ? t.admin : 
			                 user.role === "manager" ? t.manager : t.staff;
			if (roleText.toLowerCase().includes(query)) return true;
			
			// Search in role name (position)
			const roleName = user.roleName ?? (user.role === "admin" ? "IT/Admin" : 
			                                    user.role === "manager" ? "Manager" : "Staff");
			if (roleName.toLowerCase().includes(query)) return true;
			
			return false;
		});
	}, [users, searchQuery, t.admin, t.staff]);

	return (
		<section className="px-4">
			<header className="mb-6 flex items-center justify-between">
				<div>
					<h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : ''}`}>{t.title}</h2>
					<p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-600'}`}>{t.subtitle}</p>
				</div>
				<button className={`rounded-lg px-3 py-2 text-white transition-colors ${darkMode ? 'bg-[#5865f2] hover:bg-[#4752c4]' : 'bg-[#5865f2] hover:bg-[#4752c4]'}`} onClick={() => setOpen(true)}>{t.create}</button>
			</header>

			{/* Search Bar */}
			<div className="mb-4">
				<div className="relative">
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder={t.searchPlaceholder}
						className={`w-full rounded-lg border px-4 py-2 pl-10 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500 focus:border-[#5865f2] focus:outline-none focus:ring-2 focus:ring-[#5865f2]/20' : 'bg-white border-gray-300 placeholder-gray-400 focus:border-[#5865f2] focus:outline-none focus:ring-2 focus:ring-[#5865f2]/20'}`}
					/>
					<svg
						className={`absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
					{searchQuery && (
						<button
							onClick={() => setSearchQuery("")}
							className={`absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 transition-colors ${darkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-[#40444b]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
						>
							<svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					)}
				</div>
				{searchQuery && (
					<p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
						{rows.length === 0 
							? t.noResults 
							: t.resultsCount.replace("{count}", rows.length.toString())
						}
					</p>
				)}
			</div>

			<div className={`overflow-hidden rounded-xl border ${darkMode ? 'bg-[#2f3136] border-[#40444b]' : 'bg-white border-gray-200'}`}>
				<table className="w-full text-left text-sm">
					<thead className={darkMode ? 'bg-[#36393f] text-gray-300' : 'bg-gray-50 text-gray-600'}>
						<tr>
							<th className="px-4 py-3">{t.username}</th>
							<th className="px-4 py-3">{t.fullName}</th>
							<th className="px-4 py-3">{t.email}</th>
							<th className="px-4 py-3">{t.role}</th>
							<th className="px-4 py-3">{t.position}</th>
							<th className="px-4 py-3">{t.created}</th>
							<th className="px-4 py-3">{t.actions}</th>
						</tr>
					</thead>
					<tbody>
						{rows.length === 0 ? (
							<tr>
								<td colSpan={7} className={`px-4 py-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
									{t.noResults}
								</td>
							</tr>
						) : (
							rows.map((u) => (
							<tr key={u.id} className={darkMode ? 'border-t border-[#40444b]' : 'border-t border-gray-200'}>
								<td className={`px-4 py-3 font-mono ${darkMode ? 'text-gray-300' : ''}`}>{u.username}</td>
								<td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : ''}`}>{u.fullName}</td>
								<td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : ''}`}>{u.email ?? "-"}</td>
								<td className="px-4 py-3">
									<span className={`rounded-full px-2 py-1 text-xs ${
										u.role === "admin" 
											? darkMode 
												? "bg-purple-900/50 text-purple-300" 
												: "bg-purple-100 text-purple-700"
											: u.role === "manager"
												? darkMode
													? "bg-green-900/50 text-green-300"
													: "bg-green-100 text-green-700"
												: darkMode
													? "bg-blue-900/50 text-blue-300"
													: "bg-blue-100 text-blue-700"
									}`}>
										{u.role === "admin" ? t.admin : u.role === "manager" ? t.manager : t.staff}
									</span>
								</td>
								<td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : ''}`}>
									{u.roleName ?? (u.role === "admin" ? "IT/Admin" : u.role === "manager" ? "Manager" : "Staff")}
								</td>
								<td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : ''}`}>{formatDateDDMMYYYY(u.createdAt)}</td>
								<td className="px-4 py-3">
                                    <div className="flex gap-2">
                                        <button className={`rounded px-2 py-1 text-xs transition-colors ${darkMode ? 'bg-[#36393f] text-gray-300 hover:bg-[#40444b]' : 'bg-gray-200 hover:bg-gray-300'}`} onClick={() => { setEditId(u.id); setDraft({ username: u.username, password: "", fullName: u.fullName, email: u.email ?? "", role: u.role, roleName: u.roleName ?? "" }); setOpen(true); }}>{t.edit}</button>
										<button className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 transition-colors" onClick={() => onDeleteUser(u.id)}>{t.delete}</button>
									</div>
								</td>
							</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{open && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
					<div className={`w-full max-w-2xl rounded-xl p-6 shadow ${darkMode ? 'bg-[#2f3136]' : 'bg-white'}`}>
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : ''}`}>{editId ? t.modalEdit : t.modalCreate}</h3>
							<button className={`rounded p-2 transition-colors ${darkMode ? 'text-gray-300 hover:bg-[#40444b]' : 'hover:bg-gray-100'}`} onClick={() => setOpen(false)}>✕</button>
						</div>
						<div className="grid gap-4">
							<label className={`block text-sm ${darkMode ? 'text-gray-200' : ''}`}>{t.username} *
								<input className={`mt-1 w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300'}`} value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} placeholder={t.usernamePh} />
							</label>
							<label className={`block text-sm ${darkMode ? 'text-gray-200' : ''}`}>{t.password} *
								<input className={`mt-1 w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300'}`} value={(draft as any).password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} placeholder={t.passwordPh} />
							</label>
							<label className={`block text-sm ${darkMode ? 'text-gray-200' : ''}`}>{t.fullName} *
								<input className={`mt-1 w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300'}`} value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} placeholder={t.fullNamePh} />
							</label>
							<label className={`block text-sm ${darkMode ? 'text-gray-200' : ''}`}>{t.email} *
								<input className={`mt-1 w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300'}`} value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder={t.emailPh} />
							</label>
							<label className={`block text-sm ${darkMode ? 'text-gray-200' : ''}`}>{t.roleLabel}
								<select className={`mt-1 w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white' : 'bg-gray-50 border-gray-300'}`} value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as any })}>
									<option value="staff">{t.staff}</option>
									<option value="manager">{t.manager}</option>
									<option value="admin">{t.admin}</option>
								</select>
							</label>

							<label className={`block text-sm ${darkMode ? 'text-gray-200' : ''}`}>{t.positionLabel}
								<div className="mt-1 flex gap-2">
									<input className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300'}`} value={draft.roleName} onChange={(e) => setDraft({ ...draft, roleName: e.target.value })} placeholder="" />
									<select className={`rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white' : 'bg-gray-50 border-gray-300'}`} value={draft.roleName} onChange={(e) => setDraft({ ...draft, roleName: e.target.value })}>
										<option value="">{t.select}</option>
										{roles.map((r) => (
											<option key={r} value={r}>{r}</option>
										))}
									</select>
								</div>
								<div className="mt-2 flex gap-2">
									<input
										className={`w-full rounded border px-3 py-2 ${darkMode ? 'bg-[#36393f] border-[#40444b] text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300'}`}
										placeholder={t.addPositionPh}
										value={newRoleName}
										onChange={(e) => setNewRoleName(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												const value = newRoleName.trim();
                                        if (value && !roles.includes(value)) {
                                            setRoles([...roles, value]);
                                            onAddRole?.(value);
													setDraft({ ...draft, roleName: value });
													setNewRoleName('');
												}
											}
										}}
									/>
                                <button
										type="button"
										className={`rounded px-3 py-2 text-sm transition-colors ${darkMode ? 'bg-[#36393f] text-gray-300 hover:bg-[#40444b]' : 'bg-gray-200 hover:bg-gray-300'}`}
										onClick={() => {
											const value = newRoleName.trim();
											if (value && !roles.includes(value)) {
                                                setRoles([...roles, value]);
                                                onAddRole?.(value);
												setDraft({ ...draft, roleName: value });
												setNewRoleName('');
											}
										}}
									>
										{t.add}
									</button>
								</div>
                            {roles.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {roles.map((r) => (
                                        <span key={r} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${darkMode ? 'bg-[#36393f] border-[#40444b] text-gray-300' : 'bg-gray-50 border-gray-300'}`}>
                                            {r}
                                            <button type="button" className={`transition-colors ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`} onClick={() => {
                                                setRoles(roles.filter((x) => x !== r));
                                                onRemoveRole?.(r);
                                                if (draft.roleName === r) setDraft({ ...draft, roleName: '' });
                                            }}>×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
							</label>
						</div>
                        <div className="mt-6 flex justify-end gap-2">
							<button className={`rounded px-3 py-2 transition-colors ${darkMode ? 'bg-[#36393f] text-gray-300 hover:bg-[#40444b]' : 'hover:bg-gray-100'}`} onClick={() => setOpen(false)}>{t.cancel}</button>
                            <button
                                className={`rounded px-3 py-2 text-white transition-colors ${darkMode ? 'bg-[#5865f2] hover:bg-[#4752c4]' : 'bg-[#5865f2] hover:bg-[#4752c4]'}`}
                                onClick={() => {
                                    if (editId) {
                                        onUpdateUser(editId, { username: draft.username, fullName: draft.fullName, email: draft.email, role: draft.role as any, roleName: draft.roleName });
                                    } else {
                                        onCreateUser({ username: draft.username, password: (draft as any).password, fullName: draft.fullName, email: draft.email, role: draft.role as any, roleName: draft.roleName } as any);
                                    }
                                    setOpen(false);
                                    setEditId(null);
                                }}
                            >
                                {editId ? t.edit : t.save}
                            </button>
						</div>
					</div>
				</div>
			)}
		</section>
	);
}


