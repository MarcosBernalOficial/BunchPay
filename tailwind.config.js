/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    theme: {
        extend: {
        colors: {
            black: '#121213',
            grayDark: '#1B1813',
            white: '#F1F2EE',
            grayLight: '#D1D0CE'

        }
        },
    },
    plugins: [],
}