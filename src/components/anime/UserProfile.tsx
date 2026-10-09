import React, { useState, useRef, useEffect } from "react";
import {
  useAuth,
  useFirestoreUserProfile,
  updateUserProfileData,
  uploadAvatar,
  signOutUser,
  type FirestoreUserProfile,
} from "@/lib/firebase";
import { LoginSignupFlow } from "./LoginSignupFlow";
import { addExp } from "@/lib/gamification";
import {
  User as UserIcon,
  Camera,
  Upload,
  Check,
  X,
  Edit3,
  LogOut,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
  Users,
  Flame,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  AtSign,
  FileText,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { uploadBanner } from "@/lib/firebase";
import { getBorder } from "@/lib/profile-style";
import { displayLevel, resolveRole } from "@/lib/roles";
import { ProfileCustomizer } from "@/components/social/ProfileCustomizer";
import { LevelBadge, OwnerBadge } from "@/components/social/UserBadges";

interface UserProfileProps {
  onOpenAuth?: (tab: "login" | "register") => void;
  className?: string;
  defaultEditing?: boolean;
}

const AVATAR_PRESETS = [
  {
    name: "Luffy (Pirate King)",
    url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&auto=format&fit=crop&q=80",
  },
  {
    name: "Anya (Telepath)",
    url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80",
  },
  {
    name: "Gojo (Six Eyes)",
    url: "https://images.unsplash.com/photo-1563089145-599997674d42?w=200&auto=format&fit=crop&q=80",
  },
  {
    name: "Tanjiro (Demon Slayer)",
    url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&auto=format&fit=crop&q=80",
  },
  {
    name: "Frieren (Mage)",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
  },
  {
    name: "Ninja Shinobi",
    url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=200&auto=format&fit=crop&q=80",
  },
];

const CLAN_OPTIONS = [
  "Konohagakure",
  "Akatsuki",
  "Straw Hat Pirates",
  "Survey Corps",
  "Jujutsu High",
  "Demon Slayer Corps",
  "Gotei 13",
  "Chunibyo Squad",
  "Wibu Santai",
];

export function UserProfile({ onOpenAuth, className, defaultEditing = false }: UserProfileProps) {
  const { user, loading: authLoading } = useAuth();
  const { profile, gamification, loading: profileLoading } = useFirestoreUserProfile(user?.uid);

  const [isEditing, setIsEditing] = useState(defaultEditing);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [clan, setClan] = useState("");
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState("");
  const [selectedBannerUrl, setSelectedBannerUrl] = useState("");
  const [selectedBorder, setSelectedBorder] = useState("none");
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize form fields when profile or user changes
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || user?.displayName || "");
      setUsername(
        profile.username ||
          (user?.displayName
            ? user.displayName
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "")
                .slice(0, 20)
            : "") ||
          (user?.email
            ? user.email
                .split("@")[0]
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "")
            : "") ||
          "wibu_" + (user?.uid.slice(0, 5) || "san"),
      );
      setBio(profile.bio || "Pencinta anime & petualangan seru.");
      setClan(profile.clan || "Konohagakure");
      setSelectedAvatarUrl(profile.avatarUrl || profile.photoURL || user?.photoURL || "");
      setSelectedBannerUrl(profile.bannerUrl || "");
      setSelectedBorder(profile.borderStyle || "none");
    } else if (user) {
      setDisplayName(user.displayName || user.email?.split("@")[0] || "Wibu Nontonime");
      setUsername(
        (user.displayName
          ? user.displayName
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, "")
              .slice(0, 20)
          : "") ||
          (user.email
            ? user.email
                .split("@")[0]
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "")
            : "") ||
          "wibu_" + user.uid.slice(0, 5),
      );
      setBio("Pencinta anime & petualangan seru.");
      setClan("Konohagakure");
      setSelectedAvatarUrl(user.photoURL || "");
    }
  }, [profile, user]);

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Avatar upload handler using Firebase Storage
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("File harus berupa gambar (JPG, PNG, WebP, GIF).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg("Ukuran avatar maksimal 8MB (otomatis dikompres sebelum diunggah).");
      return;
    }

    setErrorMsg(null);
    setUploadingAvatar(true);

    try {
      // Dikompres di browser lalu disimpan di Supabase Storage lewat server
      const downloadUrl = await uploadAvatar(file, user.uid);
      setSelectedAvatarUrl(downloadUrl);
      setSuccessMsg("Foto avatar berhasil diunggah. Tekan Simpan untuk menerapkannya.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error("Failed to upload avatar:", err);
      const msg = err instanceof Error ? err.message : "Gagal mengunggah avatar.";
      setErrorMsg(msg);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleBannerFile = async (file: File) => {
    if (!user) return;
    setErrorMsg(null);
    setUploadingBanner(true);
    try {
      const url = await uploadBanner(file, user.uid);
      setSelectedBannerUrl(url);
      setSuccessMsg("Banner berhasil diunggah. Tekan Simpan untuk menerapkannya.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error("Failed to upload banner:", err);
      setErrorMsg(err instanceof Error ? err.message : "Gagal mengunggah banner.");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setErrorMsg("Nama tampilan tidak boleh kosong.");
      return;
    }

    const cleanUsername = username
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 25);
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMsg("Username minimal 3 karakter (hanya huruf, angka, underscore).");
      return;
    }

    setSavingProfile(true);
    setErrorMsg(null);

    try {
      await updateUserProfileData(user.uid, {
        displayName: trimmedName,
        username: cleanUsername,
        bio: bio.trim(),
        clan: clan.trim(),
        avatarUrl: selectedAvatarUrl,
        photoURL: selectedAvatarUrl,
        bannerUrl: selectedBannerUrl,
        borderStyle: selectedBorder,
      });

      addExp(25, "Memperbarui Profil");
      setSuccessMsg("Profil pengguna berhasil disimpan ke Cloud!");
      setTimeout(() => setSuccessMsg(null), 3000);
      setIsEditing(false);
    } catch (err: unknown) {
      console.error("Save profile error:", err);
      const msg = err instanceof Error ? err.message : "Gagal menyimpan profil.";
      setErrorMsg(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setDisplayName(profile.displayName || user?.displayName || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setClan(profile.clan || "");
      setSelectedAvatarUrl(profile.avatarUrl || profile.photoURL || user?.photoURL || "");
      setSelectedBannerUrl(profile.bannerUrl || "");
      setSelectedBorder(profile.borderStyle || "none");
    }
    setErrorMsg(null);
    setIsEditing(false);
  };

  // Loading skeleton
  if (authLoading || (user && profileLoading)) {
    return (
      <div
        className={cn(
          "rounded-3xl border border-border bg-card p-6 shadow-sm animate-pulse space-y-4",
          className,
        )}
      >
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-2xl bg-muted" />
          <div className="space-y-2 flex-1">
            <div className="h-6 w-48 rounded bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-4 w-64 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  // Not signed in state
  if (!user) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6 shadow-sm space-y-6",
          className,
        )}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserIcon className="h-8 w-8" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-black text-foreground">
                Profil Pengguna & Karakter Wibu
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mt-0.5">
                Masuk untuk kustomisasi Avatar, Banner, Username unik, pilih Clan anime, dan pantau
                EXP tontonanmu.
              </p>
            </div>
          </div>
        </div>

        {/* Embedded Login / Signup Flow */}
        <div className="max-w-md mx-auto pt-2">
          <LoginSignupFlow />
        </div>
      </div>
    );
  }

  const isGuest = user.uid.startsWith("guest_") || (user as { isGuest?: boolean })?.isGuest;
  const currentAvatar =
    selectedAvatarUrl || user.photoURL || profile?.avatarUrl || profile?.photoURL;
  const myRole = isGuest
    ? "member"
    : resolveRole(
        (user as { email?: string | null }).email,
        (user as { emailVerified?: boolean }).emailVerified,
      );
  const myLevel = displayLevel(myRole, gamification.level);
  const activeBorder = getBorder(
    myRole === "owner" && selectedBorder === "none" ? "royal" : selectedBorder,
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-all",
        className,
      )}
    >
      {/* Decorative banner top backdrop */}
      <div
        className="h-28 sm:h-36 w-full bg-gradient-to-r from-primary/30 via-accent/20 to-primary/10 bg-cover bg-center relative overflow-hidden"
        style={selectedBannerUrl ? { backgroundImage: `url("${selectedBannerUrl}")` } : undefined}
      >
        <div className="absolute inset-0 bg-radial-[circle_at_top_right] from-white/10 to-transparent pointer-events-none" />
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {isGuest ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-white shadow-sm">
              <UserCheck className="h-3.5 w-3.5" />
              Mode Tamu
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-white shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Firebase Cloud Terhubung
            </span>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-7 pt-0 relative">
        {/* Avatar positioned overlapping banner */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-5">
          <div className="flex items-end gap-4">
            <div className="relative group shrink-0">
              <div
                className={cn("nt-frame shadow-md", activeBorder.className)}
                style={
                  {
                    "--nt-frame-w": activeBorder.id === "none" ? "4px" : "3px",
                    "--nt-frame-r": "20px",
                  } as React.CSSProperties
                }
              >
                <div className="nt-frame-inner h-[88px] w-[88px] sm:h-[104px] sm:w-[104px] bg-muted flex items-center justify-center">
                  {currentAvatar ? (
                    <img
                      src={currentAvatar}
                      alt={displayName || "User Avatar"}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-tr from-primary to-primary/80 text-3xl font-black text-primary-foreground">
                      {(displayName || user.displayName || user.email || "W")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-2xl bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-1 text-white opacity-90 hover:opacity-100 transition-opacity cursor-pointer border-2 border-primary"
                  title="Unggah Foto Avatar dari HP / Komputer"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : (
                    <>
                      <Camera className="h-6 w-6" />
                      <span className="text-[10px] font-bold">Ganti Foto</span>
                    </>
                  )}
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="pb-1">
              <div className="flex items-center gap-2">
                <h1
                  className={cn(
                    "font-display text-xl sm:text-2xl font-black text-foreground",
                    myRole === "owner" && "nt-owner-name",
                  )}
                >
                  {displayName || user.displayName || "Pengguna Nontonime"}
                </h1>
                {myRole === "owner" && <OwnerBadge />}
                <LevelBadge role={myRole} level={gamification.level} />
              </div>
              <p className="text-xs sm:text-sm font-mono text-muted-foreground flex items-center gap-1">
                <AtSign className="h-3.5 w-3.5 text-primary" />
                <span>{username || "wibu_user"}</span>
                {!isGuest && (
                  <Link
                    to="/u/$userId"
                    params={{ userId: user.uid }}
                    className="ml-2 font-sans text-[11px] font-semibold text-primary hover:underline"
                  >
                    Lihat profil publik
                  </Link>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {!isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-bold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90 transition-all cursor-pointer"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Profil</span>
                </button>
                {isGuest && onOpenAuth && (
                  <button
                    type="button"
                    onClick={() => onOpenAuth("login")}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3.5 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer"
                  >
                    <span>Hubungkan Akun</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-background px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors cursor-pointer"
                  title="Keluar Akun"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={savingProfile || uploadingAvatar}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3.5 py-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-secondary cursor-pointer disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  <span>Batal</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile || uploadingAvatar}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-bold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90 cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notifications and Feedback */}
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

        {/* EDIT MODE FORM */}
        {isEditing ? (
          <form
            onSubmit={handleSaveProfile}
            className="space-y-5 rounded-2xl border border-border/70 bg-card p-4 sm:p-6"
          >
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-primary" />
                <span>Pengaturan Data Profil & Avatar</span>
              </h3>
              <span className="text-xs text-muted-foreground">
                Data di Firestore, gambar di Supabase
              </span>
            </div>

            {/* Avatar Upload Feature using Firebase Storage */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-foreground">Foto Avatar</label>
                  <p className="text-[11px] text-muted-foreground">
                    Unggah gambar dari perangkat atau pilih karakter anime di bawah.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer w-fit"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>
                    {uploadingAvatar ? "Mengunggah..." : "Pilih File Gambar (otomatis dikompres)"}
                  </span>
                </button>
              </div>

              {/* Avatar Presets Selection */}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-2">
                  Preset Karakter Cepat:
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = selectedAvatarUrl === preset.url;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setSelectedAvatarUrl(preset.url)}
                        className={cn(
                          "relative rounded-xl overflow-hidden border-2 p-1 text-center group transition-all cursor-pointer bg-secondary/40",
                          isSelected
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border hover:border-border/80",
                        )}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="h-14 w-full object-cover rounded-lg"
                        />
                        <p className="text-[9px] font-bold truncate mt-1 text-card-foreground">
                          {preset.name.split(" ")[0]}
                        </p>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 rounded-full bg-primary text-primary-foreground p-0.5">
                            <Check className="h-2.5 w-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {!isGuest && (
              <ProfileCustomizer
                bannerUrl={selectedBannerUrl}
                uploadingBanner={uploadingBanner}
                onBannerFile={handleBannerFile}
                onBannerClear={() => setSelectedBannerUrl("")}
                borderId={selectedBorder}
                onBorderChange={setSelectedBorder}
                level={myLevel}
                role={myRole}
                avatarUrl={currentAvatar || ""}
                name={displayName || "Aku"}
              />
            )}

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Nama Tampilan (Display Name) <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    maxLength={40}
                    placeholder="Contoh: Naruto Uzumaki"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Username Unik <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    required
                    maxLength={25}
                    placeholder="naruto_hokage"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                    }
                    className="w-full rounded-xl border border-border bg-background pl-9 pr-3 py-2 text-xs sm:text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Hanya huruf kecil, angka, dan garis bawah (_).
                </p>
              </div>
            </div>

            {/* Clan / Faksi Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>Clan / Faksi Anime</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {CLAN_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setClan(c)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer border",
                      clan === c
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary/60 text-muted-foreground border-border hover:bg-secondary",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Atau ketik nama clan kustom..."
                value={clan}
                onChange={(e) => setClan(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Bio textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>Bio / Status Wibu</span>
              </label>
              <textarea
                rows={3}
                maxLength={200}
                placeholder="Tulis anime favorit atau kata mutiara wibu kamu..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-xl border border-border bg-background p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
              <p className="text-[10px] text-right text-muted-foreground">
                {bio.length}/200 karakter
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={savingProfile || uploadingAvatar}
                className="rounded-xl border border-border bg-background px-4 py-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:bg-secondary cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingProfile || uploadingAvatar}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-xs sm:text-sm font-bold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90 cursor-pointer disabled:opacity-50"
              >
                {savingProfile ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </form>
        ) : (
          /* VIEW MODE */
          <div className="space-y-5">
            {/* Bio & Clan badge */}
            <div className="space-y-2">
              <p className="text-sm text-card-foreground leading-relaxed">
                {profile?.bio || bio || "Penggemar anime & petualangan seru."}
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {(profile?.clan || clan) && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-bold text-primary">
                    <Users className="h-3 w-3" />
                    Clan: {profile?.clan || clan}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-extrabold text-amber-600 dark:text-amber-400">
                  <Trophy className="h-3 w-3" />
                  Lv. {gamification.level} • {gamification.rankTitle}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-secondary border border-border/70 px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  <Zap className="h-3 w-3 text-amber-500 fill-current" />
                  {(gamification.totalExp ?? gamification.exp ?? 0).toLocaleString()} Total XP
                </span>
              </div>
            </div>

            {/* Email info */}
            <div className="rounded-2xl border border-border/60 bg-secondary/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="text-muted-foreground">
                <span>Alamat Akun: </span>
                <strong className="text-foreground">
                  {isGuest ? "Sesi Tamu Lokal" : user.email}
                </strong>
              </div>
              <div className="text-[11px] text-muted-foreground font-mono">
                UID: {user.uid.slice(0, 10)}...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
