const path = require("path")
const CopyPlugin = require("copy-webpack-plugin")
const TerserPlugin = require("terser-webpack-plugin")
const { merge } = require("webpack-merge")

module.exports = (env) => {
  env = env || {}

  const webpackConfigurations = [
    {
      target: "web",
      mode: "development",
      entry: {
        uuid: "./node_modules/uuid/dist/esm-browser/index.js",
        "synrb-canvas-library": "./node_modules/synrb-canvas-library/src/index.js",
        "synrb-panel-library": "./node_modules/synrb-panel-library/src/index.js",
        react: "./node_modules/react/index.js",
        "react-dom": "./node_modules/react-dom/index.js",
        app: "./src/index.js",
        "@material-ui/core": "./node_modules/@material-ui/core/index.js",
      },
      devtool: env.NODE_ENV === "production" ? false : "source-map",
      resolve: {
        extensions: [".js", ".jsx"],
      },
      node: {
        fs: "empty",
      },
      output: {
        path: path.join(__dirname, "/dist"),
        filename: "[name].js",
        libraryTarget: "system",
      },
      watchOptions: {
        ignored: "**/node_modules",
      },
      module: {
        rules: [
          {
            test: /\.css$/,
            use: ["style-loader", "css-loader"],
          },
          {
            test: /\.svg$/,
            use: ["@svgr/webpack", "url-loader"],
          },
          {
            test: /\.(PNG|png|jpg|gif)$/,
            use: ["file-loader"],
          },
          {
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            use: {
              loader: "babel-loader",
              options: {
                presets: [
                  [
                    "@babel/preset-env",
                    {
                      useBuiltIns: false,
                    },
                  ],
                  "@babel/preset-react",
                ],
              },
            },
          },
          {
            test: /\.(woff|woff2|eot|ttf|otf)$/,
            use: ["file-loader"],
          },
        ],
      },
      plugins: [
        new CopyPlugin({
          patterns: [
            { from: "./src/index.html", to: "" },
            { from: "./importmap.json", to: "" },
            { from: "./importmapie.json", to: "" },
            { from: "./src/config/observations.json", to: "" },
            // ###ADD JSON FILE for configuration for each observation
          ],
        }),
      ],
      externals: {
        uuid: "uuid",
        "synrb-canvas-library": "synrb-canvas-library",
        "synrb-panel-library": "synrb-panel-library",
        react: "react",
        "react-dom": "react-dom",
        fhirpath: "fhirpath",
      },
    },
    {
      target: "web",
      mode: "development",
      entry: {
        "ie/uuid": "./node_modules/uuid/dist/esm-browser/index.js",
        "ie/synrb-canvas-library": "./node_modules/synrb-canvas-library/src/index.js",
        "ie/synrb-panel-library": "./node_modules/synrb-panel-library/src/index.js",
        "ie/react": "./node_modules/react/index.js",
        "ie/react-dom": "./node_modules/react-dom/index.js",
        "ie/app": "./src/index.js",
        "ie/@material-ui/core": "./node_modules/@material-ui/core/index.js",
      },
      devtool: env.NODE_ENV === "production" ? false : "source-map",
      resolve: {
        extensions: [".js", ".jsx"],
      },
      node: {
        fs: "empty",
      },
      output: {
        path: path.join(__dirname, "/dist"),
        filename: "[name].js",
        libraryTarget: "system",
      },
      watchOptions: {
        ignored: "**/node_modules",
      },
      module: {
        rules: [
          {
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            use: {
              loader: "babel-loader",
              options: {
                presets: [
                  [
                    "@babel/preset-env",
                    {
                      useBuiltIns: false,
                      targets: { ie: "11" },
                    },
                  ],
                  "@babel/preset-react",
                ],
              },
            },
          },
          {
            test: /\.css$/,
            use: ["style-loader", "css-loader"],
          },
          {
            test: /\.svg$/,
            use: ["@svgr/webpack", "url-loader"],
          },
          {
            test: /\.(PNG|png|jpg|gif)$/,
            use: ["file-loader"],
          },
          {
            test: /\.(woff|woff2|eot|ttf|otf)$/,
            use: ["file-loader"],
          },
        ],
      },
      externals: {
        uuid: "uuid",
        "synrb-canvas-library": "synrb-canvas-library",
        "synrb-panel-library": "synrb-panel-library",
        react: "react",
        "react-dom": "react-dom",
        "@material-ui/core": "@material-ui/core",
        fhirpath: "fhirpath",
      },
    },
    {
      target: "web",
      mode: "development",
      entry: {
        bootstrapie: "./src/bootstrapie.js",
        bootstrap: "./src/bootstrap.js",
      },
      watchOptions: {
        ignored: "**/node_modules",
      },
      devtool: "source-map",
      resolve: {
        extensions: [".js", ".jsx"],
      },
      output: {
        path: path.join(__dirname, "/dist"),
        filename: "[name].js",
      },
      module: {
        rules: [{}],
      },
    },
  ]

  if (env.NODE_ENV !== "production") {
    return webpackConfigurations
  }

  const [base, ie, polyfills] = webpackConfigurations

  return [
    merge(base, {
      optimization: {
        minimize: true,
        minimizer: [
          new TerserPlugin({
            extractComments: "all",
            parallel: true,
          }),
        ],
      },
    }),
    merge(ie, {
      optimization: {
        minimize: true,
        minimizer: [
          new TerserPlugin({
            extractComments: "all",
            parallel: true,
          }),
        ],
      },
    }),
    polyfills,
  ]
}
