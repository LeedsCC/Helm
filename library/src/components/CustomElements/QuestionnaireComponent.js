import React from "react"
import { ThemeProvider, Typography } from "@material-ui/core"
import { getCurrentTheme } from "./Styles"
import { Provider } from "react-redux"
import { store } from "../app/store"
import { withCanvas, withResource, withSubmit, withResourceRoot } from "synrb-panel-library"
import { ReactMaterialComponentBase } from "./ReactMaterialComponentBase"
import Questionnaire from "./Questionnaire/Questionnaire"

class QuestionnaireComponent extends ReactMaterialComponentBase {
    constructor() {
        super()

        this.jsxRootComponent = () => {
            console.log(this.resources)
            const questionnaireList = this.resources.Questionnaire
            return (
                <Provider store={store}>
                    <ThemeProvider theme={getCurrentTheme()}>
                        <Questionnaire
                            // questionnaireList={this.resources.Questionnaire}
                            resources={this.resources}
                            submit={(changedResource) => this.submit([changedResource])}
                            requestResources={(questionResponse, queryParams, bodyParams) =>
                                this.requestResources(questionResponse, queryParams, bodyParams)
                            }
                        />
                    </ThemeProvider>
                </Provider>
            )
        }
    }
}

customElements.define(
    "helm-questionnaire-component",
    withResourceRoot(
        withSubmit(withResource(withCanvas(QuestionnaireComponent), "Questionnaire")),
        "QuestionnaireResponse"
    )
)
