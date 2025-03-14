/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

//@ts-check
"use strict";

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

const path = require("path");
const webpack = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

/** @type WebpackConfig */
const webExtensionConfig = {
    mode: "none",
    target: "web",
    entry: {
        extension: "./src/web/extension.ts",
        "graph-viewer": "./src/view/graph-viewer.tsx",
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, "./dist"),
        libraryTarget: "commonjs",
        devtoolModuleFilenameTemplate: "../../[resource-path]",
    },
    resolve: {
        extensions: [".ts", ".js", ".tsx", ".css"],
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                use: [
                    {
                        loader: "ts-loader",
                    },
                ],
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader", "postcss-loader"],
            },
            {
                test: /\.svg$/,
                use: ["@svgr/webpack"],
                generator: {
                    cache: false,
                },
            },
        ],
    },
    plugins: [
        // fix "process is not defined" error:
        new webpack.ProvidePlugin({
            process: "process/browser",
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: "src/view/triskel",
                    to: "",
                },
            ],
        }),
    ],
    externals: {
        vscode: "commonjs vscode", // ignored because it doesn't exist
    },
    performance: {
        hints: false,
    },
    devtool: "nosources-source-map", // create a source map that points to the original source file
    infrastructureLogging: {
        level: "log", // enables logging required for problem matchers
    },
    cache: {
        type: "filesystem", // Enables persistent caching
    },
};

module.exports = [webExtensionConfig];
