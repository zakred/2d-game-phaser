const path = require("path");
const webpack = require("webpack");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: "./src/game.ts",
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
    },
    output: {
        filename: "game.js",
        path: path.resolve(__dirname, "dist"),
    },
    mode: "development",
    plugins: [
        new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: JSON.stringify("development"),
                BACKEND_FQDN: JSON.stringify("http://localhost:3000"),
            },
        }),
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            filename: "index.html",
            inject: true,
            template: path.resolve(__dirname, "src", "index.html"),
        }),
        new CopyPlugin({
            patterns: [{from: "assets", to: "assets"}],
        }),
    ],
};
