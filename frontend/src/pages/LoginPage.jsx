import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
            desc: "Instantly generate segmentation masks using integrated YOLO models, mapped directly to your canvas.",
            icon: Zap,
        },
        {
            title: "Revision-Aware Queues",
            desc: "Human-in-the-loop review streams. Track every edit, approve high-confidence data, and reject anomalies.",
            icon: CheckSquare,
        },
        {
            title: "Headless Dataset Compilation",
            desc: "Build massive COCO & YOLO archives as background tasks via our dedicated worker node pool.",
            icon: Cloud,
        },
    ];

    return (
        <main className="min-h-screen flex bg-surface sm:bg-background">
            {/* Split Layout */}
            <div className="w-full max-w-[1200px] mx-auto sm:h-screen sm:p-6 lg:p-8 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full h-full max-h-[850px] bg-surface sm:rounded-[2rem] sm:shadow-floating sm:border border-border flex flex-col md:flex-row overflow-hidden"
                >

                    {/* Left: Branding & Features (Soft Gradient) */}
                    <div className="w-full md:w-[50%] lg:w-[55%] bg-gradient-to-br from-brand-light/40 to-white hidden md:flex flex-col justify-between p-12 lg:p-16 border-r border-border relative">
                        {/* Decorative Graphic */}
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-10">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand to-brand-hover shadow-glow flex items-center justify-center border border-white/20">
                                    <span className="w-4 h-4 rounded-sm bg-white" />
                                </div>
                                <h1 className="text-2xl font-bold tracking-tight text-ink font-display">
                                    PixelQueue
                                </h1>
                            </div>

                            <motion.h2
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                className="text-4xl lg:text-5xl font-bold tracking-tight text-ink font-display leading-[1.15] mb-6"
                            >
                                Vision Intelligence <br />
                                <span className="text-brand">Infrastructure.</span>
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                                className="text-lg text-ink-muted leading-relaxed max-w-md"
                            >
                                The annotation toolchain built for high-velocity machine learning teams.
                            </motion.p>
                        </div>

                        <div className="relative z-10 space-y-6 mt-16">
                            {FEATURES.map((f, i) => (
                                <motion.div
                                    key={f.title}
                                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + (i * 0.1) }}
                                    className="flex gap-5"
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center border border-brand/20">
                                            <f.icon className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-ink font-display mb-1">{f.title}</h3>
                                        <p className="text-sm text-ink-muted leading-relaxed max-w-[360px]">{f.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Login Form */}
                    <div className="w-full md:w-[50%] lg:w-[45%] p-8 sm:p-12 lg:p-16 flex items-center justify-center bg-surface relative z-10">
                        <div className="w-full max-w-sm">
                            <div className="md:hidden flex items-center gap-3 mb-12">
                                <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center shadow-glow">
                                    <span className="w-3 h-3 rounded-sm bg-white" />
                                </div>
                                <h1 className="text-xl font-bold tracking-tight text-ink font-display">PixelQueue</h1>
                            </div>

                            <div className="mb-10 text-center md:text-left">
                                <h2 className="text-3xl font-bold text-ink mb-2 font-display">Sign In</h2>
                                <p className="text-sm text-ink-muted">
                                    Access your workspace to continue editing.
                                </p>
                            </div>

                            <form onSubmit={onSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-ink">Email Address</label>
                                        <Input
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="operator@pixelqueue.ai"
                                            autoComplete="email"
                                            className="h-11 shadow-sm px-4 text-base"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-ink flex justify-between">
                                            Password
                                        </label>
                                        <Input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                            className="h-11 shadow-sm px-4 tracking-widest text-lg"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-danger/10 border border-danger/20 rounded-md">
                                        <p className="text-sm text-danger font-medium text-center">
                                            {error}
                                        </p>
                                    </div>
                                )}

                                <Button disabled={loading} variant="brand" type="submit" size="lg" className="w-full mt-2 h-11 text-[15px]">
                                    {loading ? (
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>Sign In <ArrowRight className="w-4 h-4 ml-2" /></>
                                    )}
                                </Button>

                                <div className="text-center pt-6">
                                    <span className="inline-block px-3 py-1 bg-secondary rounded-full text-[11px] text-ink-muted font-medium font-mono uppercase tracking-wider">
                                        Demo Credentials Pre-loaded
                                    </span>
                                </div>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
