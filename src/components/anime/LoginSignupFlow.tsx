import React, { useState } from "react";
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signInWithGoogleRedirect,
  loginAsGuest,
  resetPassword,
} from "@/lib/firebase";
import { addExp } from "@/lib/gamification";
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LoginSignupFlowProps {
  onSuccess?: () => void;
  initialTab?: "login" | "register";
  className?: string;
  compact?: boolean;
}

export function LoginSignupFlow({
  onSuccess,
  initialTab = "login",
  className,
  compact = false,
}: LoginSignupFlowProps) {
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      addExp(50, "Login Berhasil");
      onSuccess?.();
    } catch (err: unknown) {
      console.error("Google login error:", err);
      let msg = "Gagal masuk dengan Google.";
      if (err instanceof Error) {
        if (err.message.includes("popup-closed-by-user")) {
          msg = "Jendela popup login Google ditutup sebelum selesai.";
        } else if (err.message.includes("unauthorized-domain")) {
          const domain = typeof window !== "undefined" ? window.location.hostname : "localhost";
          msg = `Domain (${domain}) belum diizinkan di Firebase Console. Tambahkan domain ke Authorized domains.`;
        } else if (err.message.includes("operation-not-allowed")) {
          msg = "Provider Google belum diaktifkan di Firebase Console.";
        } else if (err.message.includes("popup-blocked")) {
          msg = "Popup diblokir browser. Mengalihkan ke login Google...";
          try {
            await signInWithGoogleRedirect();
            return;
          } catch {
            // ignore
          }
        } else {
          msg = err.message;
        }
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest(displayName.trim() || (tab === "register" ? "Wibu Baru" : "Wibu Tamu"));
    addExp(30, "Masuk Mode Tamu");
    onSuccess?.();
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (forgotMode) {
      if (!email.trim()) {
        setErrorMsg("Harap masukkan alamat email Anda.");
        return;
      }
      setLoading(true);
      try {
        await resetPassword(email.trim());
        setSuccessMsg("Tautan reset kata sandi telah dikirim ke email Anda!");
      } catch (err: unknown) {
        let msg = "Gagal mengirim email reset.";
        if (err instanceof Error) {
          if (err.message.includes("user-not-found")) {
            msg = "Akun dengan email ini tidak ditemukan.";
          } else {
            msg = err.message;
          }
        }
        setErrorMsg(msg);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!email.trim() || !password) {
      setErrorMsg("Harap isi semua kolom formulir.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Kata sandi minimal 6 karakter.");
      return;
    }

    setLoading(true);
    try {
      if (tab === "login") {
        await signInWithEmail(email.trim(), password);
        addExp(30, "Login Akun");
      } else {
        await signUpWithEmail(email.trim(), password, displayName.trim() || "Wibu Baru");
        addExp(100, "Bonus Akun Baru (+100 XP) 🎉");
      }
      onSuccess?.();
    } catch (err: unknown) {
      console.error(err);
      let friendly = "Terjadi kesalahan saat memproses.";
      if (err instanceof Error) {
        if (err.message.includes("email-already-in-use")) {
          friendly = "Email ini sudah terdaftar. Silakan masuk menggunakan tab Masuk.";
        } else if (
          err.message.includes("wrong-password") ||
          err.message.includes("invalid-credential")
        ) {
          friendly = "Email atau kata sandi yang Anda masukkan salah.";
        } else if (err.message.includes("invalid-email")) {
          friendly = "Format alamat email tidak valid.";
        } else if (err.message.includes("user-not-found")) {
          friendly = "Akun belum terdaftar. Silakan buat akun baru.";
        } else {
          friendly = err.message;
        }
      }
      setErrorMsg(friendly);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-sm",
        className,
      )}
    >
      {/* Header Tabs */}
      {!forgotMode && (
        <div className="flex rounded-xl bg-secondary/80 p-1 border border-border/60 mb-5">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setErrorMsg(null);
            }}
            className={cn(
              "flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
              tab === "login"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LogIn className="h-4 w-4" />
            <span>Masuk Akun</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setErrorMsg(null);
            }}
            className={cn(
              "flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5",
              tab === "register"
                ? "bg-background text-primary shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <UserPlus className="h-4 w-4" />
            <span>Daftar (+100 XP)</span>
          </button>
        </div>
      )}

      {/* Google Provider Sign-in */}
      {!forgotMode && (
        <div className="space-y-3 mb-5">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-border/80 bg-background hover:bg-secondary/70 px-4 py-2.5 text-xs sm:text-sm font-bold text-foreground transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{tab === "login" ? "Masuk dengan Google" : "Daftar Cepat dengan Google"}</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <span className="relative bg-card px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              atau gunakan email
            </span>
          </div>
        </div>
      )}

      {/* Messages */}
      {errorMsg && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed flex-1">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="leading-relaxed flex-1">{successMsg}</div>
        </div>
      )}

      {/* Email / Password Form */}
      <form onSubmit={handleEmailSubmit} className="space-y-3.5">
        {tab === "register" && !forgotMode && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Nama Tampilan</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Contoh: Naruto Uzumaki"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground">Alamat Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              required
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {!forgotMode && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground">Kata Sandi</label>
              {tab === "login" && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotMode(true);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  Lupa sandi?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-9 pr-10 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary/90 px-4 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-sm shadow-primary/25 transition-all cursor-pointer disabled:opacity-50 mt-1"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : forgotMode ? (
            <Mail className="h-4 w-4" />
          ) : tab === "login" ? (
            <LogIn className="h-4 w-4" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          <span>
            {forgotMode
              ? "Kirim Link Reset Sandi"
              : tab === "login"
                ? "Masuk Akun"
                : "Daftar & Klaim +100 XP"}
          </span>
        </button>

        {forgotMode && (
          <button
            type="button"
            onClick={() => {
              setForgotMode(false);
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground cursor-pointer py-1"
          >
            ← Kembali ke halaman Masuk
          </button>
        )}
      </form>

      {/* Guest Mode option */}
      {!compact && !forgotMode && (
        <div className="mt-5 border-t border-border/60 pt-4 flex items-center justify-between">
          <div className="text-left">
            <p className="text-xs font-semibold text-foreground">Belum mau daftar?</p>
            <p className="text-[11px] text-muted-foreground">Jelajahi situs sebagai Tamu</p>
          </div>
          <button
            type="button"
            onClick={handleGuestLogin}
            className="rounded-xl border border-border bg-secondary/60 hover:bg-secondary px-3.5 py-1.5 text-xs font-bold text-foreground transition-colors cursor-pointer"
          >
            Mode Tamu
          </button>
        </div>
      )}
    </div>
  );
}
