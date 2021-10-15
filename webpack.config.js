const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const copyFrom = [
    'node_modules/webextension-polyfill/dist/browser-polyfill.min.js',
    'static',
];

const common = {
    entry: {
        background: './src/background/index.ts',
        content: './src/content/index.ts',
        popup: './src/popup/index.ts',
    },
    module: {
        rules: [{
            test: /.ts$/,
            use: 'ts-loader',
            exclude: /node_modules/,
        }],
    },
    resolve: {
        extensions: ['.ts'],
    },
    plugins: [
        new CopyPlugin({patterns: copyFrom.map(from => ({from}))}),
    ],
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
    },
};

module.exports = ((mode) => {
    switch (mode) {
        case "development":
            return {
                ...common,
                mode,
                devtool: 'inline-source-map',
            };
        case "production":
            return {
                ...common,
                mode,
            };
        default:
            throw new Error(`Unknown mode: '${mode}'`);
    }
})(process.env.NODE_ENV);
