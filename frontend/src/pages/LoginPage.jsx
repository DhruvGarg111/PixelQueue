import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, login } from "../api";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage } from "../utils/error";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function LoginPage() {
    const navigate = useNavigate();
    const setTokens = useAuthStore((s) => s.setTokens);
    const setMe = useAuthStore((s) => s.setMe);
    const [email, setEmail] = useState("admin@example.com");
    const [password, setPassword] = useState("admin123");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    async function onSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const tokens = await login(email, password);
            setTokens(tokens.access_token, tokens.refresh_token);
            const me = await getMe();
            setMe(me);
            navigate("/projects");
        } catch (err) {
            setError(getErrorMessage(err, "Login failed"));
        } finally {
            setLoading(false);
        }
    }

    const FEATURES = [
        {
            title: "Zero-Shot Auto-Labeling",
            desc: "Instantly generate segmentation masks using integrated YOLO models.",
            icon: "bolt",
        },
        {
            title: "Revision-Aware Queues",
            desc: "Human-in-the-loop review streams. Track every edit.",
            icon: "checklist",
        },
        {
            title: "Headless Dataset Compilation",
            desc: "Build massive COCO & YOLO archives as background tasks.",
            icon: "cloud",
        },
    ];

    return (
        <main className="min-h-screen flex bg-background-dark relative font-display text-slate-100 selection:bg-primary/30">
            <div className="absolute inset-0 bg-background-dark pointer-events-none z-0" style={{ backgroundImage: "linear-gradient(rgba(13,223,242,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(13,223,242,0.03) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
            <div className="w-full max-w-[1200px] mx-auto sm:h-screen sm:p-6 lg:p-8 flex items-center justify-center relative z-10">
                <div className="w-full h-full max-h-[850px] bg-background-dark/80 backdrop-blur sm:rounded-lg sm:border border-primary/20 flex flex-col md:flex-row overflow-hidden shadow-none">

                    {/* Left: Branding & Features */}
                    <div className="w-full md:w-[50%] lg:w-[55%] bg-[#0A1112] hidden md:flex flex-col justify-between p-12 lg:p-16 border-r border-primary/20 relative">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-10">
                                <span className="material-symbols-outlined text-[32px] text-primary">view_quilt</span>
                                <h1 className="text-xl font-bold tracking-tight text-slate-100 font-display">
                                    PixelQueue
                                </h1>
                            </div>

                            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-100 font-display leading-[1.15] mb-6">
                                Vision Intelligence <br />
                                <span className="text-primary drop-shadow-[0_0_8px_rgba(13,223,242,0.6)]">Infrastructure.</span>
                            </h2>

                            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                                The annotation toolchain built for high-velocity machine learning teams.
                            </p>
                        </div>

                        <div className="relative z-10 space-y-6 mt-16">
                            {FEATURES.map((f) => (
                                <div key={f.title} className="flex gap-5">
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="w-10 h-10 rounded border border-primary/20 bg-primary/5 text-primary/70 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[20px]">{f.icon}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-100 font-display mb-1">{f.title}</h3>
                                        <p className="text-xs text-slate-400 max-w-[360px]">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Login Form */}
                    <div className="w-full md:w-[50%] lg:w-[45%] p-8 sm:p-12 lg:p-16 flex items-center justify-center bg-background-dark relative z-10">
                        <div className="w-full max-w-sm">
                            <div className="md:hidden flex items-center gap-3 mb-12">
                                <span className="material-symbols-outlined text-[32px] text-primary">view_quilt</span>
                                <h1 className="text-xl font-bold tracking-tight text-slate-100 font-display">PixelQueue</h1>
                            </div>

                            <div className="mb-10 text-center md:text-left">
                                <h2 className="text-2xl font-bold text-slate-100 mb-2 font-display">Sign In</h2>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-primary mb-4 font-bold">
                                    Terminal Access
                                </p>
                            </div>

                            <form onSubmit={onSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-mono tracking-widest uppercase text-primary/70 font-bold">Email Address</label>
                                        <Input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="operator@pixelqueue.ai"
                                            autoComplete="email"
                                            className="h-10 text-sm font-bold bg-[#0A1112]"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-mono tracking-widest uppercase text-primary/70 font-bold">
                                            Password
                                        </label>
                                        <Input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                            className="h-10 text-sm tracking-widest font-bold bg-[#0A1112]"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded">
                                        <p className="text-[10px] font-mono tracking-widest uppercase text-red-500 text-center font-bold">
                                            {error}
                                        </p>
                                    </div>
                                )}

                                <Button disabled={loading} variant="default" type="submit" className="w-full mt-2 h-10 text-[10px] font-mono uppercase tracking-widest gap-2">
                                    {loading ? (
                                        <span className="material-symbols-outlined text-[16px] animate-spin">sync</span>
                                    ) : (
                                        <>Initialize <span className="material-symbols-outlined text-[16px]">arrow_forward</span></>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
