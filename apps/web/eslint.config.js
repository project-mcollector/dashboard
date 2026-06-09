import js from "@eslint/js";

const browserGlobals = {
    window: "readonly",
    document: "readonly",
    console: "readonly",
    fetch: "readonly",
    localStorage: "readonly",
    sessionStorage: "readonly",
    FormData: "readonly",
    URLSearchParams: "readonly",
    setTimeout: "readonly",
    clearTimeout: "readonly",
    setInterval: "readonly",
    clearInterval: "readonly",
    alert: "readonly",
    confirm: "readonly",
    location: "readonly",
    history: "readonly",
    navigator: "readonly",
};

// Globals defined in main.js and shared across all page scripts via the browser global scope
const projectGlobals = {
    AUTH_URL: "readonly",
    getToken: "readonly",
    setToken: "readonly",
    getRefreshToken: "readonly",
    setRefreshToken: "readonly",
    clearAuth: "readonly",
    logout: "readonly",
    getQueryParam: "readonly",
    showError: "readonly",
    hideError: "readonly",
    setupPasswordToggle: "readonly",
    copyToClipboard: "readonly",
    authFetch: "readonly",
};

export default [
    js.configs.recommended,
    {
        files: ["src/js/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "script",
            globals: browserGlobals,
        },
    },
    // Page scripts can use globals exported from main.js
    {
        files: ["src/js/**/*.js"],
        ignores: ["src/js/main.js"],
        languageOptions: {
            globals: projectGlobals,
        },
    },
    // main.js defines globals consumed by other scripts — not visible to ESLint cross-file
    {
        files: ["src/js/main.js"],
        rules: {
            "no-unused-vars": "off",
        },
    },
];
