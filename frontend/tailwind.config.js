/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#050505", // deep graphite / near black
                surface: "#111111", // slightly lighter panel background
                primary: {
                    DEFAULT: "#00f0ff", // neon cyan
                    foreground: "#000000",
                    glow: "rgba(0, 240, 255, 0.5)",
                },
                secondary: {
                    DEFAULT: "#7B61FF", // violet / indigo
                    foreground: "#ffffff",
                    glow: "rgba(123, 97, 255, 0.5)",
                },
                success: {
                    DEFAULT: "#00ff66", // neon green
                    foreground: "#000000",
                },
                warning: {
                    DEFAULT: "#ffb800", // amber
                    foreground: "#000000",
                },
                danger: {
                    DEFAULT: "#ff003c", // neon red
                    foreground: "#ffffff",
                },
                border: "#222222",
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['"Fira Code"', 'monospace'],
            },
            boxShadow: {
                'neon-primary': '0 0 10px rgba(0, 240, 255, 0.3), 0 0 20px rgba(0, 240, 255, 0.2)',
                'neon-secondary': '0 0 10px rgba(123, 97, 255, 0.3), 0 0 20px rgba(123, 97, 255, 0.2)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            },
            backdropBlur: {
                'xs': '2px',
            }
        },
    },
    plugins: [],
}
