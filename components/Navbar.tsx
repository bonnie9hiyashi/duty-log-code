import React from "react";

type NavbarProps = {
	user: { fullName?: string } | null;
	onLogout: () => void;
	onNavigate?: (view: "logs" | "users") => void;
	currentView: "logs" | "users";
	language: "th" | "en";
	onToggleLanguage: () => void;
	darkMode: boolean;
	onToggleDarkMode: () => void;
};

export function Navbar({ user, onLogout, onNavigate, currentView, language, onToggleLanguage, darkMode, onToggleDarkMode }: NavbarProps) {
	const t = language === "th"
		? { 
			logs: "บันทึก", 
			users: "ผู้ใช้", 
			logout: "ออกจากระบบ", 
			user: "ผู้ใช้ระบบ",
			theme: "ธีม",
			light: "สว่าง",
			dark: "มืด"
		}
		: { 
			logs: "Logs", 
			users: "Users", 
			logout: "Logout", 
			user: "User",
			theme: "Theme",
			light: "Light",
			dark: "Dark"
		};

	return (
		<aside className={`flex h-screen w-52 flex-col border-r ${darkMode ? 'bg-[#2f3136] border-[#202225]' : 'bg-white border-gray-200'} px-4 py-6`}>
			<div className="mb-6">
				<div className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Duty Log</div>
				<div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{t.user}: {user?.fullName ?? "Guest"}</div>
			</div>

			<nav className="flex flex-col gap-2">
				{onNavigate && (
					<>
						<button
							className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
								currentView === "logs" 
									? darkMode
										? "bg-[#5865f2] text-white hover:bg-[#4752c4]"
										: "bg-black text-white hover:bg-gray-800"
									: darkMode
										? "bg-[#36393f] text-gray-300 hover:bg-[#40444b]"
										: "bg-gray-100 text-gray-800 hover:bg-gray-200"
							}`}
							onClick={() => onNavigate("logs")}
						>
							{t.logs}
						</button>
						<button
							className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
								currentView === "users" 
									? darkMode
										? "bg-[#5865f2] text-white hover:bg-[#4752c4]"
										: "bg-black text-white hover:bg-gray-800"
									: darkMode
										? "bg-[#36393f] text-gray-300 hover:bg-[#40444b]"
										: "bg-gray-100 text-gray-800 hover:bg-gray-200"
							}`}
							onClick={() => onNavigate("users")}
						>
							{t.users}
						</button>
					</>
				)}
				<div className="mt-auto space-y-2">
					<button
						className={`w-full rounded border px-3 py-2 text-left text-sm transition-colors ${
							darkMode 
								? 'border-[#40444b] bg-[#36393f] text-gray-300 hover:bg-[#40444b]' 
								: 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
						}`}
						onClick={onToggleLanguage}
						title="Switch language"
					>
						{language === "th" ? "TH → EN" : "EN → TH"}
					</button>
					<button
						className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
							darkMode 
								? 'bg-[#36393f] text-gray-300 hover:bg-[#40444b] border border-[#40444b]' 
								: 'bg-gray-200 text-gray-800 hover:bg-gray-300'
						}`}
						onClick={onToggleDarkMode}
						title={darkMode ? t.light : t.dark}
					>
						{darkMode ? "☀️ " + t.light : "🌙 " + t.dark}
					</button>
					<button
						className={`w-full rounded px-3 py-2 text-left text-sm transition-colors ${
							darkMode 
								? 'bg-[#36393f] text-gray-300 hover:bg-[#40444b]' 
								: 'bg-gray-200 text-gray-800 hover:bg-gray-300'
						}`}
						onClick={onLogout}
					>
						{t.logout}
					</button>
				</div>
			</nav>
		</aside>
	);
}


