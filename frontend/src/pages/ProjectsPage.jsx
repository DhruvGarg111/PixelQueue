import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { useProjectList } from "../hooks/useProjectList";
import { ProjectCard } from "../components/ProjectCard";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Database, Plus, Layers, ShieldCheck, Activity } from "lucide-react";

const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

export function ProjectsPage() {
    const me = useAuthStore((s) => s.me);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const { projects, status, loading, isErrorStatus, onCreate, onDelete } = useProjectList();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name) return;
        await onCreate(name, description || "Project seeded from workspace panel.");
        setName("");
        setDescription("");
    };

    return (
        <div className="max-w-[1400px] mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border/60">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-ink font-display mb-2">Projects</h1>
                    <p className="text-sm text-ink-muted">
                        Manage your annotation queues and export data pipelines.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {status && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <Badge variant={isErrorStatus ? "destructive" : "success"} className="px-3 py-1 shadow-sm">
                                {status}
                            </Badge>
                        </motion.div>
                    )}
                </div>
            </header>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-5 flex items-center gap-4 hover:shadow-card-hover transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-ink-muted">Active Queues</p>
                        <h4 className="text-2xl font-bold text-ink mt-0.5 font-mono tracking-tight">{projects.length}</h4>
                    </div>
                </Card>
                <Card className="p-5 flex items-center gap-4 hover:shadow-card-hover transition-shadow">
                    <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-ink-muted">Managed by You</p>
                        <h4 className="text-2xl font-bold text-ink mt-0.5 font-mono tracking-tight">{projects.filter((p) => p.my_role === "manager").length}</h4>
                    </div>
                </Card>
                <Card className="p-5 flex items-center gap-4 hover:shadow-card-hover transition-shadow relative overflow-hidden">
                    <div className="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center border border-border">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-ink-muted">System Status</p>
                        <h4 className="text-2xl font-bold text-ink mt-0.5 flex items-center gap-2">
                            Healthy <span className="w-2 h-2 rounded-full bg-success animate-pulse mt-0.5"></span>
                        </h4>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-8 items-start pt-2">

                {/* Left Column: Project Grid */}
                <div className="w-full relative min-h-[500px]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-ink font-display">Active Projects</h2>
                    </div>

                    {projects.length === 0 && !loading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-2xl bg-surface/50">
                            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                                <Database className="w-8 h-8 text-ink-faint" />
                            </div>
                            <h3 className="text-lg font-semibold text-ink mb-2">No active projects</h3>
                            <p className="text-ink-muted text-center max-w-sm text-sm">
                                Your workspace is currently empty. Initialize a new project queue from the control panel to begin processing data.
                            </p>
                        </motion.div>
                    )}

                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 xl:grid-cols-2 gap-5 pb-12">
                        <AnimatePresence>
                            {projects.map((p) => (
                                <ProjectCard key={p.id} project={p} me={me} onDelete={onDelete} />
                            ))}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Right Column: Creation Panel */}
                <div className="w-full lg:sticky lg:top-8">
                    <Card className="p-6">
                        <h2 className="text-base font-semibold text-ink mb-1 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-brand" /> Create New
                        </h2>
                        <p className="text-xs text-ink-muted mb-5 leading-relaxed">
                            Deploy a new annotation pipeline cluster. Projects act as namespaces for your datasets.
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-ink">Project Designation</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Autonomous Driving v2"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-ink">Objective Parameters (Optional)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Labeling ontology and context..."
                                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink shadow-input focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand min-h-[100px] resize-y placeholder:text-ink-faint transition-shadow"
                                />
                            </div>
                            <Button disabled={loading || !name} type="submit" variant="brand" className="w-full mt-2 h-10 shadow-glow shadow-brand/20">
                                {loading ? "Deploying..." : "Launch Project"}
                            </Button>
                        </form>
                    </Card>
                </div>

            </div>
        </div>
    );
}
