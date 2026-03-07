import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useProjectList } from "../hooks/useProjectList";
import { ProjectCard } from "../components/ProjectCard";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";

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
        <div className="flex flex-col gap-6">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-100 font-display mb-2">Workspace Dashboard</h1>
                    <p className="text-sm text-slate-400">
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

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <div className="flex flex-col gap-2 rounded-lg p-6 border border-primary/20 bg-primary/5">
                    <p className="text-primary/70 text-xs font-mono font-medium leading-normal uppercase tracking-wider">SYS.RDY</p>
                    <p className="text-slate-100 tracking-tight text-xl font-bold leading-tight">Asynchronous Workloads</p>
                    <p className="text-slate-400 text-sm mt-2 font-mono">Active Queues: {projects.length}</p>
                </div>
                <div className="flex flex-col gap-2 rounded-lg p-6 border border-primary/20 bg-primary/5">
                    <p className="text-primary/70 text-xs font-mono font-medium leading-normal uppercase tracking-wider">COORD.X</p>
                    <p className="text-slate-100 tracking-tight text-xl font-bold leading-tight">Zero-Defect Annotations</p>
                    <p className="text-slate-400 text-sm mt-2 font-mono">Managed by You: {projects.filter((p) => p.my_role === "manager").length}</p>
                </div>
                <div className="flex flex-col gap-2 rounded-lg p-6 border border-primary/20 bg-primary/5">
                    <p className="text-primary/70 text-xs font-mono font-medium leading-normal uppercase tracking-wider">NET.TX</p>
                    <p className="text-slate-100 tracking-tight text-xl font-bold leading-tight">Seamless Collaboration</p>
                    <p className="text-[#10B981] text-sm mt-2 font-mono flex items-center gap-2">
                        System Healthy <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-8 items-start pt-2">
                {/* Left Column: Project Grid */}
                <div className="w-full relative min-h-[500px]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-primary/70 uppercase tracking-wider font-mono">Active Projects</h2>
                    </div>

                    {projects.length === 0 && !loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 border border-primary/20 rounded-lg bg-primary/5">
                            <div className="w-16 h-16 flex items-center justify-center mb-4 text-primary/50">
                                <span className="material-symbols-outlined text-[32px]">database</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-100 mb-2">No active projects</h3>
                            <p className="text-slate-400 text-center max-w-sm text-sm">
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
                <div className="w-full lg:sticky lg:top-8 flex flex-col gap-4">
                    <h2 className="text-sm font-semibold text-primary/70 uppercase tracking-wider font-mono mb-1 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px]">add_box</span> Create New
                    </h2>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
                        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                            Deploy a new annotation pipeline cluster with immediate scaling.
                        </p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-mono font-bold text-primary/70 uppercase">Project Designation</label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Autonomous Driving v2"
                                    className="bg-background-dark border-primary/30 focus:border-primary text-slate-100 placeholder:text-slate-600 rounded"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-mono font-bold text-primary/70 uppercase">Objective Parameters</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Labeling ontology and context..."
                                    className="w-full rounded border border-primary/30 bg-background-dark px-3 py-2 text-sm text-slate-100 outline-none transition-colors duration-150 focus:border-primary min-h-[100px] resize-y placeholder:text-slate-600"
                                />
                            </div>
                            <Button disabled={loading || !name} type="submit" variant="default" className="w-full mt-2 bg-primary text-background-dark hover:bg-primary/90 font-bold border-none">
                                {loading ? "Deploying..." : "Launch Project"}
                            </Button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
}
