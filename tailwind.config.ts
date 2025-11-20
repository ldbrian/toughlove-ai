import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    // 告诉 Tailwind 去哪里找类名
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}", // 关键：必须包含 src/app
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      // 如果需要自定义动画，可以在这里加，目前默认即可
    },
  },
  plugins: [],
};
export default config;