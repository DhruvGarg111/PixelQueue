import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createProject, deleteProject, getMe, listProjects } from "../api";
import { useAuthStore } from "../store/authStore";
import { canSeeAnnotate, canSeeReview } from "../utils/projectRole";
import { getErrorMessage } from "../utils/error";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Activity, Database, LayoutTemplate, Plus, Trash2, PenTool, CheckSquare, Download } from "lucide-react";

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function ProjectsPage() {
    const navigate = useNavigate();
    const clear = useAuthStore((s) => s.clear);
    const me = useAuthStore((s) => s.me);
    const setMe = useAuthStore((s) => s.setMe);
    const [projects, setProjects] = useState([]);
    const [name, setName] = useState("Sample Annotation Project");
    const [description, setDescription] = useState("Project seeded from frontend");
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const isErrorStatus = status ? /fail|error/i.test(status) : false;

    async function load() {
        const [meData, projectData] = await Promise.all([getMe(), listProjects()]);
        setMe(meData);
        setProjects(projectData);
    }

    useEffect(() => {
        load().catch((err) => setStatus(getErrorMessage(err, "Load failed")));
    }, []);

    async function onCreate(e) {
        e.preventDefault();
        setLoading(true);
        setStatus(null);
        try {
            await createProject(name, description);
            await load();
            setStatus("Project created");
            setName("");
            setDescription("");
        } catch (err) {
            setStatus(getErrorMessage(err, "Create failed"));
        } finally {
            setLoading(false);
        }
    }

    async function onDelete(projectId) {
        if (!window.confirm("Are you sure you want to absolute delete this queue? This action cannot be undone.")) return;
        setLoading(true);
        setStatus(null);
        try {
            await deleteProject(projectId);
            await load();
            setStatus("Queue terminated");
        } catch (err) {
            setStatus(getErrorMessage(err, "Delete failed"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border/50">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">Workspace Overview</h1>
                    <div className="flex items-center gap-3 text-gray-400">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                            Operator: <strong className="text-primary font-mono">{me?.full_name || "Agent"}</strong>
                        </span>
                        <Badge variant="outline" className="border-primary/30 text-primary uppercase font-mono text-[10px] tracking-wider">
                            {me?.global_role || "unknown"}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {status && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center">
                            <Badge variant={isErrorStatus ? "destructive" : "success"} className="px-3 py-1 font-mono uppercase text-xs">
                                {status}
                            </Badge>
                        </motion.div>
                    )}
                </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                    {/* Metrics Panel */}
                    <Card className="p-5 bg-gradient-to-br from-surface/80 to-surface/40 border-primary/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                        <h2 className="text-xs uppercase tracking-widest text-primary font-mono font-semibold mb-4 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            System Telemetry
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-lg bg-black/40 border border-white/5 flex flex-col items-center justify-center relative group overflow-hidden">
                                <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <strong className="text-3xl font-mono text-white relative z-10">{projects.length}</strong>
                                <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-1 relative z-10">Active Queues</span>
                            </div>
                            <div className="p-4 rounded-lg bg-black/40 border border-white/5 flex flex-col items-center justify-center relative group overflow-hidden">
                                <div className="absolute inset-0 bg-secondary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                <strong className="text-3xl font-mono text-white relative z-10">{projects.filter(p => p.my_role === "manager").length}</strong>
                                <span className="text-[10px] uppercase tracking-wider text-gray-500 mt-1 relative z-10">Managed</span>
                            </div>
                        </div>
                    </Card>

                    {/* Creation Panel */}
                    <Card className="p-5 bg-surface/60 border-t-2 border-t-primary/30">
                        <h2 className="text-lg font-semibold text-white mb-1">Initialize Queue</h2>
                        <p className="text-sm text-gray-400 mb-5">Deploy a new annotation pipeline cluster.</p>
                        <form onSubmit={onCreate} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Designation</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Urban Aerial v2"
                                    className="bg-black/50 border-white/10"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Objective Parameters</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Labeling ontology and context..."
                                    className="w-full rounded-md border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary min-h-[100px] resize-y placeholder:text-gray-600 transition-colors"
                                />
                            </div>
                            <Button disabled={loading} type="submit" className="w-full text-xs font-mono tracking-widest uppercase mt-4">
                                {loading ? "Deploying..." : (
                                    <span className="flex items-center gap-2"><Plus className="w-4 h-4" /> Launch Queue</span>
                                )}
                            </Button>
                        </form>
                    </Card>
                </div>

                <div className="flex-1 w-full relative min-h-[500px]">
                    {projects.length === 0 && !loading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center p-10 border-2 border-dashed border-white/5 rounded-xl bg-surface/20">
                            <Database className="w-16 h-16 text-gray-600 mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">No active queues</h3>
                            <p className="text-gray-400 text-center max-w-sm">The workspace is currently empty. Initialize a new queue from the control panel to begin processing.</p>
                        </motion.div>
                    )}

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 xl:grid-cols-2 gap-4"
                    >
                        <AnimatePresence>
                            {projects.map((p) => (
                                <motion.div key={p.id} variants={itemVariants} layoutId={`project-${p.id}`}>
                                    <Card className="h-full flex flex-col hover:border-primary/30 transition-colors duration-300 group overflow-hidden relative">
                                        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />

                                        <div className="p-5 border-b border-border/50 flex justify-between items-start bg-black/20">
                                            <div>
                                                <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                                                    <LayoutTemplate className="w-4 h-4 text-primary" />
                                                    {p.name}
                                                </h3>
                                                <div className="font-mono text-[10px] text-gray-500 tracking-wider">ID: {p.id.slice(0, 8)}</div>
                                            </div>
                                            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 uppercase font-mono tracking-wider text-[10px]">
                                                {p.my_role}
                                            </Badge>
                                        </div>

                                        <div className="p-5 flex-1 flex flex-col">
                                            <p className="text-sm text-gray-400 mb-6 flex-1 line-clamp-3 leading-relaxed">
                                                {p.description || "No parameters provided."}
                                            </p>

                                            <div className="space-y-3 mt-auto">
                                                <div className="grid grid-cols-2 gap-2">
                                                    {canSeeAnnotate(p.my_role) && (
                                                        <Button variant="secondary" asChild className="w-full text-xs gap-2">
                                                            <Link to={`/projects/${p.id}/annotate`}><PenTool className="w-3.5 h-3.5" /> Annotate</Link>
                                                        </Button>
                                                    )}
                                                    {canSeeReview(p.my_role) && (
                                                        <Button variant="outline" asChild className="w-full text-xs gap-2 hover:bg-white/5 border-white/10">
                                                            <Link to={`/projects/${p.id}/review`}><CheckSquare className="w-3.5 h-3.5" /> Review</Link>
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    <Button variant="ghost" asChild className="flex-1 text-xs gap-2 border border-dashed border-white/10 hover:border-white/20">
                                                        <Link to={`/projects/${p.id}/exports`}><Download className="w-3.5 h-3.5" /> Data Pipeline</Link>
                                                    </Button>
                                                    {me?.global_role === "admin" && (
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            className="w-10 flex-shrink-0"
                                                            onClick={(e) => { e.preventDefault(); onDelete(p.id); }}
                                                            title="Terminate Pipeline"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
