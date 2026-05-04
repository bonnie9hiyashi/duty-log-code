import React, { useState } from "react";

type LoginPageProps = {
	onLogin: (username: string, password: string) => boolean;
	language: "th" | "en";
};

const texts = {
	th: {
		title: "Duty Log",
		subtitle: "ลงชื่อเข้าใช้เพื่อจัดการงานประจำวัน",
		username: "ชื่อผู้ใช้",
		usernamePh: "",
		password: "รหัสผ่าน",
		passwordPh: "",
		signIn: "เข้าสู่ระบบ",
		error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
	},
	en: {
		title: "Hotel Duty Log System",
		subtitle: "Sign in to manage your daily operations",
		username: "Username",
		usernamePh: "",
		password: "Password",
		passwordPh: "",
		signIn: "Sign In",
		error: "Invalid credentials",
	},
};

export function LoginPage({ onLogin, language }: LoginPageProps) {
	const t = texts[language];
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		const ok = onLogin(username, password);
		if (!ok) setError(t.error);
	};

	return (
		<div className="min-h-screen bg-[linear-gradient(180deg,#eef3ff,transparent)]">
			<div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-10">
				<form onSubmit={handleSubmit} className="w-full rounded-2xl border bg-white p-8 shadow-md sm:p-10">
					<div className="mx-auto mb-6 h-16 w-16 rounded-full bg-blue-600/95 p-3 text-white">
						<div className="flex h-full w-full items-center justify-center rounded-full bg-blue-600">
							<span className="text-2xl">🏨</span>
						</div>
					</div>
					<h1 className="text-center text-2xl font-semibold">{t.title}</h1>
					<p className="mt-1 text-center text-sm text-gray-600">{t.subtitle}</p>

					<div className="mt-8 space-y-4">
						<div>
							<label className="mb-1 block text-sm font-medium">{t.username}</label>
							<div className="flex items-center rounded-lg border bg-gray-100 px-3 py-2">
								<span className="mr-2 text-gray-500">👤</span>
								<input
									type="text"
									className="w-full bg-transparent outline-none"
									placeholder={t.usernamePh}
									value={username}
									onChange={(e) => setUsername(e.target.value)}
								/>
							</div>
						</div>
						<div>
							<label className="mb-1 block text-sm font-medium">{t.password}</label>
							<div className="flex items-center rounded-lg border bg-gray-100 px-3 py-2">
								<span className="mr-2 text-gray-500">🔒</span>
								<input
									type={showPassword ? "text" : "password"}
									className="w-full bg-transparent outline-none"
									placeholder={t.passwordPh}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="ml-2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
									title={showPassword ? (language === "th" ? "ซ่อนรหัสผ่าน" : "Hide password") : (language === "th" ? "แสดงรหัสผ่าน" : "Show password")}
								>
									{showPassword ? (
										<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
											<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
											<path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
										</svg>
									) : (
										<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
											<path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
											<path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.064 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
										</svg>
									)}
								</button>
							</div>
						</div>
					</div>

					{error && <p className="mt-3 text-sm text-red-600">{error}</p>}

					<button type="submit" className="mt-5 w-full rounded-lg bg-black py-3 font-medium text-white hover:bg-black/90">
						{t.signIn}
					</button>

					{/* helper section removed per requirements */}
				</form>
			</div>
		</div>
	);
}


