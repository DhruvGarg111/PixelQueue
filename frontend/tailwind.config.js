/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Inter"', 'sans-serif'],
                display: ['"Space Grotesk"', '"Inter"', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
            colors: {
                // New Stitch theme colors
                "primary": "#0ddff2",
                "background-light": "#f5f8f8",
                "background-dark": "#102122",
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
                'sm': '4px',
                "DEFAULT": "0.25rem",
                "full": "9999px"
            }
        },
    },
    plugins: [],
}
