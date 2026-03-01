import { Component } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "./Button";

/**
 * React error boundary that catches rendering errors in child components
 * and displays a pixel-art styled fallback UI with retry capability.
 *
 * @example
 *   <ErrorBoundary>
 *     <AnnotatePage />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error("[ErrorBoundary]", error, info.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center p-12 m-8 border-2 border-dashed border-danger/30 rounded-xl bg-surface/40 backdrop-blur-sm"
            >
                <div className="relative mb-6">
                    <AlertTriangle className="w-16 h-16 text-danger" />
                    <motion.div
                        className="absolute inset-0 bg-danger/20 rounded-full blur-xl"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    />
                </div>

                <h3 className="text-xl font-bold text-ink font-mono mb-2">
                    RUNTIME EXCEPTION
                </h3>
                <p className="text-gray-600 text-sm text-center max-w-md mb-2">
                    A rendering error crashed this component tree.
                </p>

                {this.state.error && (
                    <pre className="mt-2 mb-6 px-4 py-3 bg-white/30 border border-danger/20 rounded-lg text-danger text-xs font-mono max-w-lg overflow-x-auto whitespace-pre-wrap break-all">
                        {this.state.error.message || String(this.state.error)}
                    </pre>
                )}

                <Button onClick={this.handleRetry} className="gap-2 font-mono text-xs tracking-widest uppercase">
                    <RefreshCcw className="w-4 h-4" />
                    Reboot Component
                </Button>
            </motion.div>
        );
    }
}
