import { useEffect, useState } from "react";
import { listProjectMembers, searchUsers, upsertProjectMember } from "../api";
import { getErrorMessage } from "../utils/error";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Badge } from "./ui/Badge";

export function ProjectTeamPanel({ projectId, canManage }) {
    const [members, setMembers] = useState([]);
    const [lookup, setLookup] = useState("");
    const [role, setRole] = useState("annotator");
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null);

    async function loadMembers() {
        setLoading(true);
        try {
            const rows = await listProjectMembers(projectId);
            setMembers(rows);
            setStatus(null);
        } catch (error) {
            setStatus(getErrorMessage(error, "Failed to load project members"));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadMembers().catch(() => undefined);
    }, [projectId]);

    useEffect(() => {
        if (!canManage || lookup.trim().length < 2) {
            setMatches([]);
            return;
        }

        let cancelled = false;
        const timeout = setTimeout(() => {
            searchUsers(lookup)
                .then((rows) => {
                    if (!cancelled) {
                        setMatches(rows);
                    }
                })
                .catch(() => {
                    if (!cancelled) {
                        setMatches([]);
                    }
                });
        }, 220);

        return () => {
            cancelled = true;
            clearTimeout(timeout);
        };
    }, [canManage, lookup]);

    async function handleInvite(event) {
        event.preventDefault();
        const email = lookup.trim();
        if (!email) {
            setStatus("Enter an email address to add a collaborator");
            return;
        }

        setSaving(true);
        try {
            await upsertProjectMember(projectId, { email, role });
            setLookup("");
            setMatches([]);
            setStatus("Collaborator access updated");
            await loadMembers();
        } catch (error) {
            setStatus(getErrorMessage(error, "Failed to update collaborator access"));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="border-t border-primary/10 bg-[#081214] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-mono uppercase tracking-[0.32em] text-primary/60">Project team</p>
                    <p className="mt-1 text-sm text-slate-300">
                        {loading ? "Syncing collaborator roster..." : `${members.length} active member${members.length === 1 ? "" : "s"}`}
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => loadMembers()} className="w-auto text-[10px] font-mono uppercase tracking-[0.25em]">
                    Refresh
                </Button>
            </div>

            <div className="mt-4 grid gap-3">
                {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between gap-3 rounded-2xl border border-primary/10 bg-background-dark/70 px-4 py-3">
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-100">{member.full_name || member.email}</p>
                            <p className="truncate text-[11px] text-slate-400">{member.email}</p>
                        </div>
                        <Badge variant={member.role === "admin" ? "success" : "secondary"} className="px-3 py-1">
                            {member.role}
                        </Badge>
                    </div>
                ))}

                {!loading && members.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 px-4 py-5 text-sm text-slate-400">
                        No collaborators assigned yet.
                    </div>
                )}
            </div>

            {canManage && (
                <form onSubmit={handleInvite} className="mt-5 rounded-[22px] border border-primary/10 bg-primary/5 p-4">
                    <p className="text-[10px] font-mono uppercase tracking-[0.32em] text-primary/60">Invite or update access</p>
                    <div className="mt-3 grid gap-3">
                        <Input
                            value={lookup}
                            onChange={(event) => setLookup(event.target.value)}
                            placeholder="teammate@pixelqueue.ai"
                            className="h-11 rounded-xl bg-background-dark/80"
                        />
                        <div className="grid gap-3 sm:grid-cols-[1fr,140px]">
                            <div className="rounded-xl border border-primary/20 bg-background-dark/80 px-3">
                                <select
                                    value={role}
                                    onChange={(event) => setRole(event.target.value)}
                                    className="h-11 w-full bg-transparent text-sm text-slate-100 outline-none"
                                >
                                    <option value="annotator">Annotator</option>
                                    <option value="reviewer">Reviewer</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="h-11 rounded-xl text-[10px] font-mono uppercase tracking-[0.28em]"
                            >
                                {saving ? "Updating..." : "Grant access"}
                            </Button>
                        </div>
                    </div>

                    {matches.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {matches.map((user) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => setLookup(user.email)}
                                    className="rounded-full border border-primary/20 bg-background-dark px-3 py-2 text-xs text-slate-300 transition-colors hover:border-primary/40 hover:text-primary"
                                >
                                    {user.email}
                                </button>
                            ))}
                        </div>
                    )}
                </form>
            )}

            {status && (
                <p className="mt-4 text-sm text-slate-400">{status}</p>
            )}
        </div>
    );
}
