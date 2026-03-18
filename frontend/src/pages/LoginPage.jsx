import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { getMe, login, register } from "../api";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage } from "../utils/error";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

const ACCESS_PANELS = [
    {
        label: "Cookie-backed sessions",
        value: "No browser token vault",
        detail: "Authentication now lives in secure HTTP-only cookies instead of localStorage copies.",
    },
    {
        label: "Open team onboarding",
        value: "Register, create, invite",
        detail: "Every new account can open a workspace immediately and bring collaborators in by email.",
    },
    {
        label: "Live workstreams",
        value: "Annotate, review, export",
        detail: "One control plane for image intake, revisioned QA, and dataset delivery.",
    },
];

const PASSWORD_RULES = [
    "At least 8 characters",
    "One uppercase letter",
    "One lowercase letter",
    "One number",
];

function validateAuthForm(mode, fields) {
    if (mode === "register" && !fields.fullName.trim()) {
        return "Full name is required";
    }
    if (!fields.email.trim()) {
        return "Email address is required";
    }
    if (!fields.password) {
        return "Password is required";
    }
    if (mode === "register") {
        if (fields.password.length < 8) {
            return "Password must be at least 8 characters";
        }
        if (!/[A-Z]/.test(fields.password)) {
            return "Password must include an uppercase letter";
        }
        if (!/[a-z]/.test(fields.password)) {
            return "Password must include a lowercase letter";
        }
        if (!/\d/.test(fields.password)) {
            return "Password must include a number";
        }
    }
    return null;
}

export function LoginPage({ mode = "login" }) {
    const navigate = useNavigate();
    const me = useAuthStore((s) => s.me);
    const bootstrapped = useAuthStore((s) => s.bootstrapped);
    const setMe = useAuthStore((s) => s.setMe);
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    if (bootstrapped && me) {
        return <Navigate to="/projects" replace />;
    }

    const isRegister = mode === "register";
    const eyebrow = isRegister ? "Open the command center" : "Return to the command center";
    const title = isRegister ? "Register a new operator account" : "Sign in to the PixelQueue control plane";
    const actionLabel = isRegister ? "Create Workspace Access" : "Authenticate Session";
    const switchHref = isRegister ? "/login" : "/register";
    const switchLabel = isRegister ? "Already have access?" : "Need an account?";
    const switchCta = isRegister ? "Sign in" : "Register";

    function updateField(key, value) {
        setForm((current) => ({ ...current, [key]: value }));
    }

    async function onSubmit(event) {
        event.preventDefault();
        const validationError = validateAuthForm(mode, form);
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            if (isRegister) {
                await register(form.fullName.trim(), form.email.trim(), form.password);
            } else {
                await login(form.email.trim(), form.password);
            }
            const profile = await getMe();
            setMe(profile);
            navigate("/projects", { replace: true });
        } catch (err) {
            setError(getErrorMessage(err, isRegister ? "Registration failed" : "Login failed"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-background-dark font-display text-slate-100 selection:bg-primary/25">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(13,223,242,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.16),transparent_25%)]" />
            <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "linear-gradient(rgba(13,223,242,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(13,223,242,0.06) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
            <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1360px] items-center px-4 py-6 sm:px-6 lg:px-8">
                <div className="grid w-full gap-6 lg:grid-cols-[1.15fr,0.85fr]">
                    <section className="relative overflow-hidden rounded-[28px] border border-primary/15 bg-[#07171a]/90 p-8 shadow-[0_0_60px_rgba(13,223,242,0.05)] lg:p-10">
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(13,223,242,0.06),transparent_30%,rgba(245,158,11,0.05))]" />
                        <div className="relative flex h-full flex-col">
                            <div className="mb-10 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                                        <span className="material-symbols-outlined text-[28px]">view_quilt</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-mono uppercase tracking-[0.35em] text-primary/70">PixelQueue</p>
                                        <h1 className="text-xl font-bold text-slate-100">Vision workflow control</h1>
                                    </div>
                                </div>
                                <div className="rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.35em] text-amber-300">
                                    First-party auth
                                </div>
                            </div>

                            <div className="max-w-2xl space-y-6">
                                <p className="text-[11px] font-mono uppercase tracking-[0.4em] text-primary/65">{eyebrow}</p>
                                <h2 className="max-w-3xl text-4xl font-bold leading-[1.02] text-slate-50 sm:text-5xl xl:text-6xl">
                                    Register operators, launch projects, and keep the annotation floor moving.
                                </h2>
                                <p className="max-w-xl text-base leading-7 text-slate-300">
                                    PixelQueue now opens with a cleaner, safer access path: secure browser sessions, no third-party dependency, and a self-serve workspace model built for small vision teams that move fast.
                                </p>
                            </div>

                            <div className="mt-10 grid gap-4 md:grid-cols-3">
                                {ACCESS_PANELS.map((panel) => (
                                    <div key={panel.label} className="rounded-2xl border border-primary/15 bg-background-dark/60 p-4">
                                        <p className="text-[10px] font-mono uppercase tracking-[0.32em] text-primary/55">{panel.label}</p>
                                        <h3 className="mt-3 text-lg font-bold text-slate-100">{panel.value}</h3>
                                        <p className="mt-2 text-sm leading-6 text-slate-400">{panel.detail}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-auto pt-10">
                                <div className="rounded-[24px] border border-primary/15 bg-[#081214]/90 p-5">
                                    <div className="mb-4 flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary text-[20px]">hub</span>
                                        <p className="text-sm font-bold text-slate-100">Control plane notes</p>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                                            <p className="text-[10px] font-mono uppercase tracking-[0.32em] text-primary/60">Onboarding</p>
                                            <p className="mt-2 text-sm leading-6 text-slate-300">New users can create projects immediately and invite teammates from the project surface.</p>
                                        </div>
                                        <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                                            <p className="text-[10px] font-mono uppercase tracking-[0.32em] text-primary/60">Sessions</p>
                                            <p className="mt-2 text-sm leading-6 text-slate-300">Access is refreshed through HTTP-only cookies instead of browser-stored tokens.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="relative overflow-hidden rounded-[28px] border border-primary/15 bg-[#061214]/90 p-7 shadow-[0_0_50px_rgba(0,0,0,0.25)] sm:p-8 lg:p-10">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                        <div className="relative mx-auto flex h-full w-full max-w-md flex-col">
                            <div className="mb-8 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[11px] font-mono uppercase tracking-[0.35em] text-primary/60">{eyebrow}</p>
                                    <h2 className="mt-3 text-3xl font-bold text-slate-100">{isRegister ? "Create account" : "Sign in"}</h2>
                                </div>
                                <div className="rounded-2xl border border-primary/15 bg-primary/10 px-3 py-2 text-right">
                                    <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-primary/60">Mode</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-100">{isRegister ? "Registration" : "Authentication"}</p>
                                </div>
                            </div>

                            <div className="mb-8 grid grid-cols-2 gap-2 rounded-2xl border border-primary/10 bg-background-dark/70 p-2">
                                <Link
                                    to="/login"
                                    className={`rounded-xl px-4 py-3 text-center text-sm font-bold transition-colors ${!isRegister ? "bg-primary text-background-dark" : "text-slate-300 hover:bg-primary/10 hover:text-primary"}`}
                                >
                                    Sign in
                                </Link>
                                <Link
                                    to="/register"
                                    className={`rounded-xl px-4 py-3 text-center text-sm font-bold transition-colors ${isRegister ? "bg-primary text-background-dark" : "text-slate-300 hover:bg-primary/10 hover:text-primary"}`}
                                >
                                    Register
                                </Link>
                            </div>

                            <div className="mb-8 rounded-2xl border border-primary/10 bg-primary/5 p-4">
                                <p className="text-sm leading-6 text-slate-300">{title}</p>
                                {isRegister && (
                                    <ul className="mt-4 grid gap-2 text-xs text-slate-400">
                                        {PASSWORD_RULES.map((rule) => (
                                            <li key={rule} className="flex items-center gap-2">
                                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-300" />
                                                {rule}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <form onSubmit={onSubmit} className="space-y-5">
                                {isRegister && (
                                    <div className="space-y-1.5">
                                        <label htmlFor="auth-full-name" className="text-[10px] font-mono uppercase tracking-[0.32em] text-primary/65">Full name</label>
                                        <Input
                                            id="auth-full-name"
                                            value={form.fullName}
                                            onChange={(event) => updateField("fullName", event.target.value)}
                                            placeholder="Avery Stone"
                                            autoComplete="name"
                                            className="h-12 rounded-xl border-primary/20 bg-[#091719] px-4 text-sm font-medium"
                                        />
                                    </div>
                                )}
                                <div className="space-y-1.5">
                                    <label htmlFor="auth-email" className="text-[10px] font-mono uppercase tracking-[0.32em] text-primary/65">Email address</label>
                                    <Input
                                        id="auth-email"
                                        value={form.email}
                                        onChange={(event) => updateField("email", event.target.value)}
                                        placeholder="operator@pixelqueue.ai"
                                        autoComplete="email"
                                        className="h-12 rounded-xl border-primary/20 bg-[#091719] px-4 text-sm font-medium"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="auth-password" className="text-[10px] font-mono uppercase tracking-[0.32em] text-primary/65">Password</label>
                                    <Input
                                        id="auth-password"
                                        type="password"
                                        value={form.password}
                                        onChange={(event) => updateField("password", event.target.value)}
                                        placeholder="Enter your password"
                                        autoComplete={isRegister ? "new-password" : "current-password"}
                                        className="h-12 rounded-xl border-primary/20 bg-[#091719] px-4 text-sm font-medium"
                                    />
                                </div>

                                {error && (
                                    <div className="rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3">
                                        <p className="text-sm font-medium text-red-300">{error}</p>
                                    </div>
                                )}

                                <Button
                                    disabled={loading}
                                    variant="default"
                                    type="submit"
                                    className="h-12 rounded-xl text-[11px] font-mono uppercase tracking-[0.3em]"
                                >
                                    {loading ? "Synchronizing..." : actionLabel}
                                </Button>
                            </form>

                            <div className="mt-8 border-t border-primary/10 pt-6 text-sm text-slate-400">
                                <span>{switchLabel} </span>
                                <Link to={switchHref} className="font-bold text-primary hover:text-primary/80">
                                    {switchCta}
                                </Link>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
