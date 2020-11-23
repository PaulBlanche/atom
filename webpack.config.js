const path = require('path');

module.exports = {
    entry: './index.tsx',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
            { test: /\.tsx?$/, use: 'ts-loader' }
        ]
    },
    resolve: {
        extensions: ['.wasm', '.mjs', '.js', '.json', '.jsx', '.ts', '.tsx']
    },
    optimization: {
        minimize: false
    },
    /*externals: {
        react: 'react'
    }*/
};