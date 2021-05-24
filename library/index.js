function getManifest(env) {
    const version = env.NODE_ENV === "local" ? "0.0.0" : require("./package.json").version

    const manifest = { panels: {}, libraries: {} }

    const dependencies = {
        "synrb-panel-library": {
            index: "./node_modules/synrb-panel-library/src/index.js",
            package: "./node_modules/synrb-panel-library/package.json",
        },
        react: {
            index: "./node_modules/react/index.js",
            package: "./node_modules/react/package.json",
        },
        "react-dom": {
            index: "./node_modules/react-dom/index.js",
            package: "./node_modules/react-dom/package.json",
        },
        uuid: {
            index: "./node_modules/uuid/dist/esm-browser/index.js",
            package: "./node_modules/uuid/package.json",
        },
        fhirpath: {
            index: "./node_modules/fhirpath/src/fhirpath.js",
            package: "./node_modules/fhirpath/package.json",
        },
        "@material-ui/core": {
            index: "./node_modules/@material-ui/core/index.js",
            package: "./node_modules/@material-ui/core/package.json",
        },
        "@material-ui/styles": {
            index: "./node_modules/@material-ui/styles/index.js",
            package: "./node_modules/@material-ui/styles/package.json",
        },
        "@material-ui/icons": {
            index: "./node_modules/@material-ui/icons/index.js",
            package: "./node_modules/@material-ui/icons/package.json",
        },
    }

    const libraries = {}

    Object.keys(dependencies).forEach((dep) => {
        const packageDetails = require(dependencies[dep].package)

        //libraries[`${dep}/${packageDetails.version}`] = dependencies[dep].index
        libraries[`${dep}`] = dependencies[dep].index
    })

    const entryPoints = {
        panels: {
            QuestionnaireComponent: {
                webpackPath: "./src/components/CustomElements/QuestionnaireComponent.js",
                metadataPath: "",
                tagName: "helm-questionnaire-component",
            },
            ObservationComponent: {
                webpackPath: "./src/components/CustomElements/ObservationComponent.js",
                metadataPath: "",
                tagName: "helm-observations",
            },
        },
        libraries,
    }

    Object.keys(entryPoints.panels).forEach((panelName) => {
        const details = entryPoints.panels[panelName]

        let attributes = []

        if (details.metadataPath) {
            attributes = require(details.metadataPath)
        }

        manifest.panels[panelName] = {}

        manifest.panels[panelName][version] = {
            path: `dist/${panelName}.js`,
            mapPath: `dist/${panelName}.js.map`,
            panelTag: details.tagName,
            description: details.description,
            attributes,
            configurationTag: (details.configuration && details.configuration.tagName) || null,
            configurationPath:
                (details.configuration &&
                    details.configuration.webpackName &&
                    `dist/${details.configuration.webpackName}.js`) ||
                null,
        }
    })

    Object.keys(entryPoints.libraries).forEach((libraryName) => {
        manifest.libraries[libraryName] = {}

        manifest.libraries[libraryName] = {
            path: `dist/${libraryName}.js`,
            mapPath: `dist/${libraryName}.js.map`,
            webpackPath: entryPoints.libraries[libraryName],
        }
    })

    return { manifest, entryPoints: entryPoints.panels, dependencies }
}

module.exports = getManifest
