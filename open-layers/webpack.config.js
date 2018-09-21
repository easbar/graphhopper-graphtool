const path = require('path');
const webpack = require('webpack');
const distFolder = './dist';

module.exports = {
    entry: './src/index.js',
    devtool: 'source-map',
    devServer: {
        contentBase: distFolder,
        watchContentBase: true
    },
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, distFolder)
    },
    optimization: {
        // disable minimization, because it takes forever and has no benefits during development
        minimize: false,
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery'
        })
    ]
};
