import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FolderKanban, PenTool, CheckSquare, Download, Trash2, ArrowRight } from "lucide-react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { canSeeAnnotate, canSeeReview } from "../utils/projectRole";

const itemVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export const ProjectCard = ({ project, me, onDelete }) => {
    const effectiveRole = me?.global_role === "admin" ? "admin" : project.my_role;
    const isAdmin = me?.global_role === "admin";

    return (
        <motion.div variants={itemVariants} layoutId={`project-${project.id}`}>
            <Card className="h-full flex flex-col group hover:shadow-card-hover hover:border-brand/20 transition-all duration-300">
                <div className="p-5 border-b border-border/60 bg-surface flex justify-between items-start">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center flex-shrink-0 mt-0.5">
                            <FolderKanban className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-ink mb-0.5 font-display flex items-center gap-2 tracking-tight group-hover:text-brand transition-colors">
                                {project.name}
                            </h3>
                            <div className="font-mono text-[11px] text-ink-muted flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-success/80"></span>
                                id_{project.id.slice(0, 8)}
                            </div>
                        </div>
                    </div>
                    <Badge variant="brand" className="uppercase font-mono text-[10px] tracking-wider px-2 py-0.5">
                        {project.my_role}
                    </Badge>
                </div>

                <div className="p-5 flex-1 flex flex-col bg-surface">
                    <p className="text-sm text-ink-muted mb-6 flex-1 line-clamp-2 leading-relaxed">
                        {project.description || "No project parameters or description provided."}
                    </p>

                    <div className="flex items-center gap-3 mt-auto">
                        {canSeeAnnotate(effectiveRole) && (
                            <Button variant="brand" asChild className="flex-1 gap-2 h-10">
                                <Link to={`/projects/${project.id}/annotate`}>
                                    <PenTool className="w-4 h-4" /> Annotate
                                </Link>
                            </Button>
                        )}
                        {canSeeReview(effectiveRole) && (
                            <Button variant="outline" asChild className="flex-1 gap-2 h-10 shadow-sm bg-white hover:border-ink/20">
                                <Link to={`/projects/${project.id}/review`}>
                                    <CheckSquare className="w-4 h-4 text-ink-muted" /> Review
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="px-5 py-3 border-t border-border/60 bg-secondary/30 flex items-center justify-between gap-3 gap-y-2 mt-auto">
                    <Button variant="ghost" asChild className="flex-1 justify-start h-8 px-2 text-xs text-ink-muted hover:text-ink -ml-2">
                        <Link to={`/projects/${project.id}/exports`}>
                            <Download className="w-3.5 h-3.5 mr-1.5" /> Exports Pipeline <ArrowRight className="w-3 h-3 ml-auto opacity-50" />
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
        </motion.div>
    );
};
