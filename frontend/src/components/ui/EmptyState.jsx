import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

/**
 * Reusable empty state component with consistent pixel-art styling.
 * Provides a dashed border container with icon, title, and description.
 *
 * @example
 *   <EmptyState
 *     icon={Database}
 *     title="No active queues"
 *     description="Initialize a new queue from the control panel to begin."
 *   />
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "flex flex-col items-center justify-center py-16 px-10 border-2 border-dashed border-border/5 rounded-xl bg-surface/20",
                className,
            )}
        >
            {Icon && <Icon className="w-16 h-16 text-gray-800 mb-6" />}
            {title && (
                <h3 className="text-lg font-medium text-ink mb-2 font-mono">
                    {title}
                </h3>
            )}
            {description && (
                <p className="text-gray-500 text-center max-w-sm text-sm">
                    {description}
                </p>
            )}
            {action && <div className="mt-6">{action}</div>}
        </motion.div>
    );
}
