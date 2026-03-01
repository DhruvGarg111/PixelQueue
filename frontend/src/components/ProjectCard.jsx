import { Link } from "react-router-dom";
import { FolderKanban, PenTool, CheckSquare, Download, Trash2, ArrowRight } from "lucide-react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { canSeeAnnotate, canSeeReview } from "../utils/projectRole";

export const ProjectCard = ({ project, me, onDelete }) => {
    const effectiveRole = me?.global_role === "admin" ? "admin" : project.my_role;
    const isAdmin = me?.global_role === "admin";

    return (
        <Card className="h-full flex flex-col transition-colors duration-150 hover:border-[rgba(59,130,246,0.3)]">
            <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex justify-between items-start">
                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center flex-shrink-0">
                        <FolderKanban className="w-4 h-4 text-ink-muted" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-ink font-display flex items-center gap-2">
                            {project.name}
                        </h3>
                        <div className="font-mono text-[10px] text-ink-faint flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                            id_{project.id.slice(0, 8)}
                        </div>
                    </div>
                </div>
                <Badge className="font-mono text-[10px]">
                    {project.my_role}
                </Badge>
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <p className="text-sm text-ink-muted mb-4 flex-1 line-clamp-2 leading-relaxed">
                    {project.description || "No project parameters provided."}
                </p>

                <div className="flex items-center gap-2 mt-auto">
                    {canSeeAnnotate(effectiveRole) && (
                        <Button variant="default" asChild className="flex-1 gap-2">
                            <Link to={`/projects/${project.id}/annotate`}>
                                <PenTool className="w-3.5 h-3.5" /> Annotate
                            </Link>
                        </Button>
                    )}
                    {canSeeReview(effectiveRole) && (
                        <Button variant="outline" asChild className="flex-1 gap-2">
                            <Link to={`/projects/${project.id}/review`}>
                                <CheckSquare className="w-3.5 h-3.5 text-ink-muted" /> Review
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between gap-3">
                <Button variant="ghost" asChild className="h-8 px-2 text-xs text-ink-muted hover:text-ink -ml-2">
                    <Link to={`/projects/${project.id}/exports`}>
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Exports Pipeline <ArrowRight className="w-3 h-3 ml-1.5 opacity-50" />
                    </Link>
                </Button>
                {isAdmin && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-ink-faint hover:text-danger hover:bg-danger/10"
                        onClick={(e) => { e.preventDefault(); onDelete(project.id); }}
                        title="Delete Project"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
            </div>
        </Card>
    );
};
