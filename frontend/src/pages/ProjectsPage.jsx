import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useProjectList } from "../hooks/useProjectList";
import { ProjectCard } from "../components/ProjectCard";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Database, Plus, Layers, ShieldCheck, Activity } from "lucide-react";

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
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[rgba(255,255,255,0.06)]">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-ink font-display mb-2">Projects</h1>
                    <p className="text-sm text-ink-muted">
                        Manage your annotation queues and export data pipelines.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {status && (
                        <div>
                            <Badge variant={isErrorStatus ? "destructive" : "success"} className="px-3 py-1">
                                {status}
                            </Badge>
                        </div>
                    )}
                </div>
            </header>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[8px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-ink-faint flex items-center justify-center">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-mono tracking-wider font-semibold uppercase text-ink-faint">Active Queues</p>
                        <h4 className="text-xl font-bold text-ink mt-0.5 font-mono">{projects.length}</h4>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[8px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-ink-faint flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-mono tracking-wider font-semibold uppercase text-ink-faint">Managed by You</p>
                        <h4 className="text-xl font-bold text-ink mt-0.5 font-mono">{projects.filter((p) => p.my_role === "manager").length}</h4>
                    </div>
                </Card>
                <Card className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[8px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-ink-faint flex items-center justify-center">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-mono tracking-wider font-semibold uppercase text-ink-faint">System Status</p>
                        <h4 className="text-xl font-bold text-ink mt-0.5 flex items-center gap-2 font-display">
                            Healthy <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                        </h4>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-8 items-start pt-2">

                {/* Left Column: Project Grid */}
                <div className="w-full relative min-h-[500px]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-ink-faint uppercase tracking-wider font-mono">Active Projects</h2>
                    </div>

                    {projects.length === 0 && !loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 border border-[rgba(255,255,255,0.06)] rounded-[8px] bg-[#111827]">
                            <div className="w-16 h-16 flex items-center justify-center mb-4">
                                <Database className="w-8 h-8 text-ink-faint" />
                            </div>
                            <h3 className="text-lg font-semibold text-ink mb-2">No active projects</h3>
                            <p className="text-ink-muted text-center max-w-sm text-sm">
                                Your workspace is currently empty. Initialize a new project queue from the control panel.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-12">
                        {projects.map((p) => (
                            <ProjectCard key={p.id} project={p} me={me} onDelete={onDelete} />
                        ))}
                    </div>
                </div>

                {/* Right Column: Creation Panel */}
                <div className="w-full lg:sticky lg:top-8">
                    <Card className="p-5">
                        <h2 className="text-sm font-semibold text-ink-faint uppercase tracking-wider font-mono mb-1 flex items-center gap-2">
                            <Plus className="w-4 h-4 text-primary" /> Create New
                        </h2>
                        <p className="text-xs text-ink-muted mb-5 leading-relaxed">
                            Deploy a new annotation pipeline cluster.
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-mono font-semibold text-ink-faint uppercase">Project Designation</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Autonomous Driving v2"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-mono font-semibold text-ink-faint uppercase">Objective Parameters</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Labeling ontology and context..."
                                    className="w-full rounded-[8px] border border-[rgba(255,255,255,0.06)] bg-[#020617] px-3 py-2 text-sm text-ink outline-none transition-colors duration-150 focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px] resize-y placeholder:text-ink-faint"
                                />
                            </div>
                            <Button disabled={loading || !name} type="submit" variant="default" className="w-full mt-2">
                                {loading ? "Deploying..." : "Launch Project"}
                            </Button>
                        </form>
                    </Card>
                </div>

            </div>
        </div>
    );
}
