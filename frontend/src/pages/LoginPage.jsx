import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMe, login } from "../api";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage } from "../utils/error";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Zap, CheckSquare, Cloud, ArrowRight } from "lucide-react";

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
            icon: Zap,
        },
        {
            title: "Revision-Aware Queues",
            desc: "Human-in-the-loop review streams. Track every edit.",
            icon: CheckSquare,
        },
        {
            title: "Headless Dataset Compilation",
            desc: "Build massive COCO & YOLO archives as background tasks.",
            icon: Cloud,
        },
    ];

    return (
        <main className="min-h-screen flex bg-[#0F172A] relative">
            <div className="absolute inset-0 bg-[#0F172A] pointer-events-none z-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
            <div className="w-full max-w-[1200px] mx-auto sm:h-screen sm:p-6 lg:p-8 flex items-center justify-center relative z-10">
                <div className="w-full h-full max-h-[850px] bg-[#0F172A] sm:rounded-[8px] sm:border border-[rgba(255,255,255,0.06)] flex flex-col md:flex-row overflow-hidden shadow-none">

                    {/* Left: Branding & Features */}
                    <div className="w-full md:w-[50%] lg:w-[55%] bg-[#020617] hidden md:flex flex-col justify-between p-12 lg:p-16 border-r border-[rgba(255,255,255,0.06)] relative">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-10">
                                <div className="w-10 h-10 rounded-[8px] bg-[#3B82F6] flex items-center justify-center">
                                    <span className="w-4 h-4 rounded-[2px] bg-white" />
                                </div>
                                <h1 className="text-xl font-bold tracking-tight text-ink font-display">
                                    PixelQueue
                                </h1>
                            </div>

                            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-ink font-display leading-[1.15] mb-6">
                                Vision Intelligence <br />
                                <span className="text-[#3B82F6]">Infrastructure.</span>
                            </h2>

                            <p className="text-sm text-ink-muted leading-relaxed max-w-md">
                                The annotation toolchain built for high-velocity machine learning teams.
                            </p>
                        </div>

                        <div className="relative z-10 space-y-6 mt-16">
                            {FEATURES.map((f) => (
                                <div key={f.title} className="flex gap-5">
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="w-10 h-10 rounded-[8px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-ink-faint flex items-center justify-center">
                                            <f.icon className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-ink font-display mb-1">{f.title}</h3>
                                        <p className="text-xs text-ink-muted max-w-[360px]">{f.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Login Form */}
                    <div className="w-full md:w-[50%] lg:w-[45%] p-8 sm:p-12 lg:p-16 flex items-center justify-center bg-[#111827] relative z-10">
                        <div className="w-full max-w-sm">
                            <div className="md:hidden flex items-center gap-3 mb-12">
                                <div className="w-8 h-8 rounded-[8px] bg-[#3B82F6] flex items-center justify-center">
                                    <span className="w-3 h-3 rounded-[2px] bg-white" />
                                </div>
                                <h1 className="text-xl font-bold tracking-tight text-ink font-display">PixelQueue</h1>
                            </div>

                            <div className="mb-10 text-center md:text-left">
                                <h2 className="text-2xl font-bold text-ink mb-2 font-display">Sign In</h2>
                                <p className="text-[10px] font-mono uppercase tracking-widest text-[#3B82F6] mb-4">
                                    Terminal Access
                                </p>
                            </div>

                            <form onSubmit={onSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-mono tracking-widest uppercase text-ink-faint">Email Address</label>
                                        <Input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="operator@pixelqueue.ai"
                                            autoComplete="email"
                                            className="h-10 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-mono tracking-widest uppercase text-ink-faint">
                                            Password
                                        </label>
                                        <Input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                            className="h-10 text-sm tracking-widest"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-[8px]">
                                        <p className="text-[10px] font-mono tracking-widest uppercase text-danger text-center">
                                            {error}
                                        </p>
                                    </div>
                                )}

                                <Button disabled={loading} variant="default" type="submit" className="w-full mt-2 h-10 text-[10px] font-mono uppercase tracking-widest gap-2 bg-[#2563EB] text-white hover:bg-[#3B82F6] border-none">
                                    {loading ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>Initialize <ArrowRight className="w-4 h-4" /></>
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
