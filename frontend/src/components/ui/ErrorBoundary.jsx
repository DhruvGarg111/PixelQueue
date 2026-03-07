import { Component } from "react";
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
            <div className="flex flex-col items-center justify-center p-12 m-8 border border-dashed border-red-500/30 rounded bg-background-dark/80 backdrop-blur">
                <div className="relative mb-6">
                    <span className="material-symbols-outlined text-[48px] text-red-500">warning</span>
                </div>

                <h3 className="text-base font-bold text-slate-100 font-mono mb-2 uppercase tracking-wider">
                    Runtime Exception
                </h3>
                <p className="text-slate-400 text-sm text-center max-w-md mb-2 font-bold">
                    A rendering error crashed this component tree.
                </p>

                {this.state.error && (
                    <pre className="mt-2 mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-[10px] font-mono max-w-lg overflow-x-auto whitespace-pre-wrap break-all font-bold">
                        {this.state.error.message || String(this.state.error)}
                    </pre>
                )}

                <Button onClick={this.handleRetry} className="gap-2 font-mono text-[10px] tracking-widest uppercase font-bold">
                    <span className="material-symbols-outlined text-[14px]">sync</span>
                    Reboot Component
                </Button>
            </div>
        );
    }
}
