/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Inter"', 'sans-serif'],
                display: ['"Space Grotesk"', '"Inter"', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
            colors: {
                background: "#0F172A",
                surface: "#111827",
                border: "rgba(255, 255, 255, 0.06)",
                ink: {
                    DEFAULT: "#F8FAFC",
                    muted: "#94A3B8",
                    faint: "#475569",
                },
                canvas: "#0F172A",
                primary: {
                    DEFAULT: "#3B82F6",
                    hover: "#2563EB",
                    foreground: "#FFFFFF",
                },
                brand: {
                    DEFAULT: "#3B82F6",
                    hover: "#2563EB",
                    light: "rgba(59,130,246,0.12)",
                },
                secondary: {
                    DEFAULT: "#06B6D4",
                    foreground: "#FFFFFF",
                },
                danger: { DEFAULT: "#EF4444", foreground: "#ffffff" },
                success: { DEFAULT: "#10B981", foreground: "#ffffff" },
                warning: { DEFAULT: "#F59E0B", foreground: "#ffffff" },
            },
            boxShadow: {
                'card': 'none',
                'floating': 'none',
                'button': 'none',
                'input': 'none',
                'glow': 'none',
                'sm': 'none'
            },
            borderRadius: {
                'xl': '8px',
                '2xl': '8px',
                '3xl': '8px',
                'lg': '8px',
                'md': '8px',
                'sm': '4px'
            }
        },
    },
    plugins: [],
}
