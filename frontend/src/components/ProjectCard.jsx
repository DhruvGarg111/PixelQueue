import { useState } from "react";
import { Link } from "react-router-dom";
import { canSeeAnnotate, canSeeReview } from "../utils/projectRole";
import { ProjectTeamPanel } from "./ProjectTeamPanel";

export const ProjectCard = ({ project, me, onDelete }) => {
    const effectiveRole = me?.global_role === "admin" ? "admin" : project.my_role;
    const canManageTeam = effectiveRole === "admin";
    const [teamOpen, setTeamOpen] = useState(false);

    return (
        <div className="h-full flex flex-col transition-colors duration-150 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/40 group overflow-hidden">
            <div className="p-4 border-b border-primary/10 flex justify-between items-start bg-primary/5">
                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded bg-background-dark border border-primary/20 flex items-center justify-center flex-shrink-0 text-primary">
                        <span className="material-symbols-outlined text-[18px]">folder_open</span>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-100 font-display flex items-center gap-2 group-hover:text-primary transition-colors">
                            {project.name}
                        </h3>
                        <div className="font-mono text-[10px] text-primary/70 flex items-center gap-1.5 mt-0.5 font-bold tracking-widest uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                            NODE_{project.id.slice(0, 8)}
                        </div>
                    </div>
                </div>
                <div className="px-2 py-1 rounded bg-background-dark border border-primary/20 font-mono text-[10px] text-primary font-bold uppercase tracking-wider">
                    {effectiveRole}
                </div>
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <p className="text-sm text-slate-400 mb-4 flex-1 line-clamp-2 leading-relaxed">
                    {project.description || "No project parameters provided."}
                </p>

                <div className="flex items-center gap-2 mt-auto">
                    {canSeeAnnotate(effectiveRole) && (
                        <Link
                            to={`/projects/${project.id}/annotate`}
                            className="flex flex-1 items-center justify-center gap-2 rounded h-9 px-4 bg-primary text-background-dark text-xs font-bold uppercase tracking-wider transition-colors hover:bg-primary/80"
                        >
                            <span className="material-symbols-outlined text-[16px]">crop_free</span> Annotate
                        </Link>
                    )}
                    {canSeeReview(effectiveRole) && (
                        <Link
                            to={`/projects/${project.id}/review`}
                            className="flex flex-1 items-center justify-center gap-2 rounded h-9 px-4 bg-background-dark border border-primary/30 text-primary text-xs font-bold uppercase tracking-wider transition-colors hover:bg-primary/10"
                        >
                            <span className="material-symbols-outlined text-[16px]">checklist</span> Review
                        </Link>
                    )}
                </div>
            </div>

            <div className="px-4 py-3 border-t border-primary/10 flex items-center justify-between gap-3 bg-background-dark/30">
                <Link to={`/projects/${project.id}/exports`} className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-[16px]">download</span> Exports Pipeline <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className={`inline-flex items-center gap-2 rounded h-8 px-3 text-[10px] font-mono uppercase tracking-[0.3em] transition-colors ${
                            teamOpen
                                ? "bg-primary/15 text-primary border border-primary/30"
                                : "bg-background-dark text-slate-300 border border-primary/15 hover:border-primary/40 hover:text-primary"
                        }`}
                        aria-expanded={teamOpen}
                        onClick={(event) => {
                            event.preventDefault();
                            setTeamOpen((open) => !open);
                        }}
                        title="View project team"
                    >
                        <span className="material-symbols-outlined text-[14px]">group</span>
                        Team
                    </button>
                    {canManageTeam && (
                        <button
                            type="button"
                            className="w-8 h-8 rounded flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            onClick={(event) => { event.preventDefault(); onDelete(project.id); }}
                            title="Delete Project"
                        >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                    )}
                </div>
            </div>
            {teamOpen && (
                <ProjectTeamPanel projectId={project.id} canManage={canManageTeam} />
            )}
        </div>
    );
};
