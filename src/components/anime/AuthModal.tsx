import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  User,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AuthModal({
  open,
  onOpenChange,
  initialTab = "login",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "login" | "register";
}) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setErrorMsg(null);
      setSuccessMsg(null);
      setForgotMode(false);
    }
  }, [open, initialTab]);

  const handleGuestLogin = () => {
    loginAsGuest(displayName.trim() || (tab === "register" ? "Wibu Baru" : "Wibu Tamu"));
    addExp(30, "Masuk Mode Tamu");
    onOpenChange(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      addExp(50, "Login Berhasil");
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Google login error:", err);
      let msg = "Gagal masuk dengan Google.";
      if (err instanceof Error) {
        if (err.message.includes("popup-closed-by-user")) {
          msg = "Jendela popup login Google ditutup sebelum proses selesai.";
        } else if (err.message.includes("unauthorized-domain")) {
          const domain =
            typeof window !== "undefined" ? window.location.hostname : "nontonime.vercel.app";
          msg = `Domain (${domain}) belum diizinkan di Firebase Console. Tambahkan domain '${domain}' ke daftar Authorized domains di Firebase Console.`;
        } else if (err.message.includes("operation-not-allowed")) {
          msg =
            "Metode login Google belum diaktifkan di Firebase Console. Aktifkan provider 'Google' di Sign-in method Firebase Console.";
        } else if (err.message.includes("popup-blocked")) {
          msg =
            "Jendela popup diblokir oleh browser. Gunakan opsi 'Login Google via Redirect' di bawah.";
        } else {
          msg = err.message;
        }
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRedirect = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogleRedirect();
    } catch (err: unknown) {
      console.error("Google redirect login error:", err);
      let msg = "Gagal mengalihkan ke Google.";
      if (err instanceof Error) {
        if (err.message.includes("unauthorized-domain")) {
          const domain =
            typeof window !== "undefined" ? window.location.hostname : "nontonime.vercel.app";
          msg = `Domain (${domain}) belum diizinkan di Firebase Console. Tambahkan domain '${domain}' ke daftar Authorized domains.`;
        } else {
          msg = err.message;
        }
      }
      setErrorMsg(msg);
      setLoading(false);
    }
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
        setSuccessMsg("Tautan pemulihan kata sandi telah dikirim ke email Anda!");
      } catch (err: unknown) {
        let msg = "Gagal mengirim email pemulihan.";
        if (err instanceof Error) {
          if (err.message.includes("user-not-found")) {
            msg = "Akun dengan email tersebut tidak ditemukan.";
          } else if (err.message.includes("unauthorized-domain")) {
            const domain = typeof window !== "undefined" ? window.location.hostname : "";
            msg = `Domain (${domain}) belum diizinkan di Firebase Console > Settings > Authorized domains.`;
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
      setErrorMsg("Harap lengkapi seluruh kolom.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Kata sandi harus minimal 6 karakter.");
      return;
    }

    setLoading(true);
    try {
      if (tab === "login") {
        await signInWithEmail(email.trim(), password);
        addExp(30, "Login Akun");
      } else {
        await signUpWithEmail(email.trim(), password, displayName.trim() || "Wibu Baru");
        addExp(100, "Bonus Daftar Akun Baru 🎉");
      }
      onOpenChange(false);
    } catch (err: unknown) {
      console.error(err);
      let friendly = "Terjadi kesalahan saat memproses.";
      if (err instanceof Error) {
        if (err.message.includes("unauthorized-domain")) {
          const domain = typeof window !== "undefined" ? window.location.hostname : "";
          friendly = `Domain (${domain}) belum didaftarkan di Firebase Console. Buka Firebase Console > Authentication > Settings > Authorized domains dan tambahkan '${domain}'.`;
        } else if (err.message.includes("operation-not-allowed")) {
          friendly =
            "Metode Email/Password belum diaktifkan di Firebase Console. Buka Firebase Console > Authentication > Sign-in method dan aktifkan 'Email/Password'.";
        } else if (err.message.includes("email-already-in-use")) {
          friendly = "Email ini sudah terdaftar. Silakan pilih tab Masuk.";
        } else if (
          err.message.includes("wrong-password") ||
          err.message.includes("invalid-credential")
        ) {
          friendly = "Email atau kata sandi yang Anda masukkan salah.";
        } else if (err.message.includes("invalid-email")) {
          friendly = "Format alamat email tidak valid.";
        } else if (err.message.includes("user-not-found")) {
          friendly = "Akun belum terdaftar. Silakan daftar terlebih dahulu.";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md overflow-hidden border border-border/80 bg-background/98 p-0 sm:rounded-3xl shadow-2xl">
        {/* Header styling */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-5 sm:p-6 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
              {tab === "login" ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            </div>
            <div>
              <DialogTitle className="font-display text-lg sm:text-xl font-black text-foreground">
                {forgotMode
                  ? "Lupa Kata Sandi"
                  : tab === "login"
                    ? "Masuk ke Nontonime"
                    : "Buat Akun Nontonime"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {forgotMode
                  ? "Masukkan email akun Anda untuk menerima tautan reset kata sandi."
                  : tab === "login"
                    ? "Masuk untuk sinkronisasi watchlist, riwayat, dan naikkan level rank!"
                    : "Daftar sekarang dan dapatkan bonus +100 EXP langsung!"}
              </DialogDescription>
            </div>
          </div>

          {/* Mode Tabs */}
          {!forgotMode && (
            <div className="mt-4 flex rounded-xl bg-secondary/80 p-1 border border-border/60">
              <button
                type="button"
                onClick={() => {
                  setTab("login");
                  setErrorMsg(null);
                }}
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  tab === "login"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("register");
                  setErrorMsg(null);
                }}
                className={cn(
                  "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer",
                  tab === "register"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span>Daftar</span>
                <span className="rounded-full bg-primary/20 text-primary px-1.5 py-0.2 text-[9px] font-extrabold">
                  +100 EXP
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="rounded-2xl bg-destructive/10 border border-destructive/25 p-3.5 text-xs text-destructive space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
                <div className="space-y-1">
                  <p className="font-bold text-destructive">Gagal Memproses Autentikasi</p>
                  <p className="leading-relaxed opacity-90">{errorMsg}</p>
                </div>
              </div>

              {/* Special interactive guide for unauthorized-domain or operation-not-allowed */}
              {typeof window !== "undefined" &&
                (errorMsg.includes("Authorized domains") ||
                  errorMsg.includes("diizinkan di Firebase") ||
                  errorMsg.includes("Sign-in method") ||
                  errorMsg.includes("belum diaktifkan")) && (
                  <div className="rounded-xl bg-background/90 p-3 border border-border/80 text-foreground space-y-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-500">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>Langkah Memperbaiki di Firebase Console:</span>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-muted-foreground">
                      <div className="flex items-center justify-between gap-2 bg-secondary/60 px-2.5 py-1.5 rounded-lg border border-border/60">
                        <span className="font-mono text-[10px] text-foreground truncate select-all">
                          {window.location.hostname}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.hostname);
                            setCopiedDomain(true);
                            setTimeout(() => setCopiedDomain(false), 2000);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded transition-colors shrink-0 cursor-pointer"
                        >
                          {copiedDomain ? (
                            <Check className="h-2.5 w-2.5" />
                          ) : (
                            <Copy className="h-2.5 w-2.5" />
                          )}
                          <span>{copiedDomain ? "Tersalin!" : "Salin Domain"}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        <a
                          href="https://console.firebase.google.com/project/gen-lang-client-0276722527/authentication/settings"
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold border border-primary/20 transition-colors"
                        >
                          <span>1. Authorized Domains</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                        <a
                          href="https://console.firebase.google.com/project/gen-lang-client-0276722527/authentication/providers"
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold border border-primary/20 transition-colors"
                        >
                          <span>2. Aktifkan Provider</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground">Atau lewati login:</span>
                      <button
                        type="button"
                        onClick={handleGuestLogin}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        <span>Masuk Mode Tamu (Offline)</span>
                        <ArrowRight className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                )}
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google 1-Click Login */}
          {!forgotMode && (
            <>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border/80 bg-card p-2.5 text-xs font-bold text-foreground shadow-xs hover:bg-secondary transition-all cursor-pointer disabled:opacity-60"
              >
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
                <span>
                  {tab === "login" ? "Lanjut dengan Akun Google" : "Daftar Cepat dengan Google"}
                </span>
              </button>

              <div className="flex items-center justify-center -mt-1">
                <button
                  type="button"
                  onClick={handleGoogleRedirect}
                  disabled={loading}
                  className="text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  Popup diblokir? Klik untuk Login Google via Pengalihan (Redirect)
                </button>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/60" />
                </div>
                <span className="relative bg-background px-3 text-[11px] font-semibold text-muted-foreground uppercase">
                  Atau via Email
                </span>
              </div>
            </>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {tab === "register" && !forgotMode && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">
                  Nama Panggilan / Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Contoh: Rian Otaku"
                    className="w-full rounded-xl border border-border/80 bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-foreground">Alamat Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full rounded-xl border border-border/80 bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            {!forgotMode && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-foreground">Kata Sandi</label>
                  {tab === "login" && (
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="text-[11px] text-primary hover:underline cursor-pointer"
                    >
                      Lupa kata sandi?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full rounded-xl border border-border/80 bg-background py-2 pl-9 pr-9 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {tab === "register" && !forgotMode && (
              <div className="rounded-xl bg-primary/10 p-2.5 flex items-center gap-2 text-xs text-primary border border-primary/20">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span className="text-[11px]">
                  Akun baru otomatis mendapatkan <strong>Rank Penonton Pemula</strong> +{" "}
                  <strong>100 EXP</strong>!
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-md shadow-primary/30 transition-all hover:bg-primary/90 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : forgotMode ? (
                <span>Kirim Link Reset Sandi</span>
              ) : tab === "login" ? (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Masuk Sekarang</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Daftar & Ambil +100 EXP</span>
                </>
              )}
            </button>
          </form>

          {!forgotMode && (
            <div className="pt-2 border-t border-border/60 text-center space-y-2">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                <span>Mau coba langsung tanpa akun cloud?</span>
                <span className="text-emerald-500 font-semibold">Tersimpan di browser</span>
              </div>
              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-dashed border-border/90 hover:border-primary/50 bg-secondary/40 hover:bg-secondary/70 text-xs font-bold text-foreground transition-all cursor-pointer"
              >
                <User className="h-4 w-4 text-primary" />
                <span>Masuk sebagai Akun Tamu / Offline (+30 EXP)</span>
              </button>
            </div>
          )}

          {forgotMode && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ← Kembali ke Halaman Masuk
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
