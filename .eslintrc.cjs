module.exports = {
    extends: '@adonisjs/eslint-config/app',
    rules: {
        'prettier/prettier': [
            'off',
            {
                jsxSingleQuote: false,
                endOfLine: 'auto',
                semi: false,
            },
        ],
    },
}
