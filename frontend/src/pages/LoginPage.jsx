import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getMe, login } from "../api";
import { useAuthStore } from "../store/authStore";
import { getErrorMessage } from "../utils/error";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Zap, CheckSquare, Cloud } from "lucide-react";

const FEATURES = [
    {
        title: "Auto-Labeling",
        desc: "Generate starter annotations with YOLO segmentation and then edit them on canvas.",
        icon: Zap,
    },
    {
        title: "Review Queue",
        desc: "Approve or reject annotations with revision-aware updates.",
        icon: CheckSquare,
    },
    {
        title: "Dataset Exports",
        desc: "Create COCO or YOLO archives in the background.",
        icon: Cloud,
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
}

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

    return (
        <main className="min-h-screen relative flex items-center justify-center p-4">
            {/* Animated glowing orb behind the card */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                className="absolute w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-5xl grid md:grid-cols-[1.2fr,0.8fr] gap-6"
            />

            <div className="w-full max-w-5xl grid md:grid-cols-[1.2fr,0.8fr] gap-6 z-10 relative">
                {/* Left Panel */}
                <Card className="p-8 md:p-12 flex flex-col justify-between bg-gradient-to-br from-surface/80 to-background/90 border-primary/10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 22h20L12 2z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                            <path d="M12 8L6 20h12L12 8z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
                        </svg>
                    </div>

                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
                        <motion.div variants={itemVariants} className="inline-flex py-1 px-3 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono mb-4 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                            <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse" />
                            System Active
                        </motion.div>
                        <motion.h1 variants={itemVariants} className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                            Pixel<span className="text-primary drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">Queue</span>
                        </motion.h1>
                        <motion.p variants={itemVariants} className="text-gray-400 text-lg max-w-md leading-relaxed">
                            A state-of-the-art vision intelligence platform combining AI auto-labeling with human-in-the-loop review queues.
                        </motion.p>
                    </motion.div>

                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="mt-12 space-y-4">
                        {FEATURES.map((f, i) => (
                            <motion.div key={f.title} variants={itemVariants} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-colors group">
                                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                    <f.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white mb-1 group-hover:text-primary transition-colors">{f.title}</h3>
                                    <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </Card>

                {/* Right Panel / Login Form */}
                <Card className="p-8 relative bg-surface/90 border-t-2 border-t-primary/50 shadow-2xl flex flex-col justify-center">
                    <motion.form
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        onSubmit={onSubmit}
                        className="space-y-8"
                    >
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Workspace Access</h2>
                            <p className="text-gray-400 text-sm">Secure entry via credentials provided by your administrator.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-mono font-medium text-gray-400 uppercase tracking-wider">Email Sequence</label>
                                <Input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="operator@pixelqueue.ai"
                                    autoComplete="email"
                                    className="h-12 bg-black/50 border-gray-800 focus:border-primary/50 text-white placeholder:text-gray-600 font-mono text-sm shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-mono font-medium text-gray-400 uppercase tracking-wider">Passcode</label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    className="h-12 bg-black/50 border-gray-800 focus:border-primary/50 text-white placeholder:text-gray-600 font-mono text-xl tracking-widest shadow-inner"
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-3 bg-danger/10 border border-danger/20 rounded-lg">
                                <p className="text-sm text-danger font-medium flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-danger inline-block" />
                                    {error}
                                </p>
                            </motion.div>
                        )}

                        <div className="pt-2">
                            <Button disabled={loading} type="submit" className="w-full h-12 text-sm uppercase tracking-widest gap-2">
                                {loading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                        Authenticating...
                                    </>
                                ) : "Initialize Session"}
                            </Button>
                        </div>

                        <div className="text-center">
                            <span className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-500 font-mono">
                                [ Demo credentials pre-loaded ]
                            </span>
                        </div>
                    </motion.form>
                </Card>
            </div>
        </main>
    );
}
