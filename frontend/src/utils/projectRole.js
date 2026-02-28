export function resolveProjectRole(me, projectId) {
    if (!me) {
        return null;
    }
    if (me.global_role === "admin") {
        return "admin";
    }
    const membership = me.memberships?.find((item) => String(item.project_id) === String(projectId));
    return membership?.role ?? null;
}

export function canSeeAnnotate(role) {
    return role === "annotator" || role === "admin";
}

export function canSeeReview(role) {
    return role === "reviewer" || role === "admin";
}
