import { Component } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "./Button";

/**
 * React error boundary that catches rendering errors in child components
 * and displays a styled fallback UI with retry capability.
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
            <div className="flex flex-col items-center justify-center p-12 m-8 border border-dashed border-[rgba(239,68,68,0.3)] rounded-[8px] bg-[#111827]">
                <div className="relative mb-6">
                    <AlertTriangle className="w-12 h-12 text-danger" />
                </div>

                <h3 className="text-base font-bold text-ink font-mono mb-2 uppercase tracking-wider">
                    Runtime Exception
                </h3>
                <p className="text-ink-muted text-sm text-center max-w-md mb-2">
                    A rendering error crashed this component tree.
                </p>

                {this.state.error && (
                    <pre className="mt-2 mb-6 px-4 py-3 bg-[#020617] border border-[rgba(239,68,68,0.2)] rounded-[8px] text-danger text-[10px] font-mono max-w-lg overflow-x-auto whitespace-pre-wrap break-all">
                        {this.state.error.message || String(this.state.error)}
                    </pre>
                )}

                <Button onClick={this.handleRetry} className="gap-2 font-mono text-[10px] tracking-widest uppercase">
                    <RefreshCcw className="w-4 h-4" />
                    Reboot Component
                </Button>
            </div>
        );
    }
}
