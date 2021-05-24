import React from "react"
import { withCanvas, withConfiguration, withSubmit, withResourceRoot } from "synrb-panel-library"
import { ReactMaterialComponentBase } from "./ReactMaterialComponentBase"
import { Observations } from "../React/Observations"

class ObservationComponent extends ReactMaterialComponentBase {
    constructor() {
        super()

        this.jsxRootComponent = () => {
            const configuration = this.configuration || null
            const observations = this.resources["Observation"] || []

            return (
                <Observations
                    configuration={configuration}
                    observations={observations}
                    getObservations={(codes) => this.refreshResources(codes)}
                    saveObservations={(observations) => this.saveResources(observations)}
                />
            )
        }
    }

    /**
     * @param {fhir.Coding[]} codes
     * @returns {Promise<void>}
     */
    refreshResources(codes) {
        const codeString = codes.map((code) => (code.system ? `${code.system}|${code.code}` : code)).join(",")

        return this.requestResources("Observation", `code=${codeString}`, {})
    }

    /**
     * @param {fhir.Observation[]} observations
     * @returns {Promise<void>}
     */
    saveResources(observations) {
        const changeRequests = observations.map((observation) => ({
            changeOperation: "POST",
            changedResource: observation,
        }))

        return this.submit(changeRequests)
    }

    // called whenever the configuration changes
    configurationChangedCallback() {
        this.render()
    }
}

customElements.define(
    "helm-observations",
    withResourceRoot(withConfiguration(withSubmit(withCanvas(ObservationComponent))), "Observation")
)
