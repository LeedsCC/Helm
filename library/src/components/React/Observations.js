import React, { useEffect, useState } from "react"
import { Grid, Tabs, Tab, TextField, Button } from "@material-ui/core"

const ObservationInput = ({ definition, value, setValue }) => {
    const type = definition.permittedDataType === "integer" ? "number" : "text"
    const label = definition.code.text || definition.code.coding[0].display

    return <TextField type={type} value={value} onChange={(event) => setValue(event.target.value)} label={label} />
}

const ObservationTab = ({ tabIndex, currentIndex, tab, saveObservations }) => {
    const [observations, setObservations] = useState(/** @type {fhir.Observation[]} */ ([]))

    const definitions = tab.input.definitions

    function getObservationValue(definition) {
        // find observation that matches the coding of the definition
        const definitionCoding = definition.code.coding[0]
        /** @type {fhir.Observation | undefined} */
        const observation = observations.find((observation) => {
            return (observation.code.coding || []).some((coding) => {
                return coding.system === definitionCoding.system && coding.code === definitionCoding.code
            })
        })

        if (!observation) {
            return ""
        }

        const { permittedDataType } = definition

        // get the right observation value type for the data type
        switch (permittedDataType) {
            case "integer": {
                return (observation.valueQuantity && observation.valueQuantity.value) || ""
            }
            default: {
                throw Error(`Unknown data type ${permittedDataType}`)
            }
        }
    }

    function setObservationValue(value, definition) {
        // find observation that matches the coding of the definition
        const definitionCoding = definition.code.coding[0]
        /** @type {fhir.Observation | undefined} */
        let observation = observations.find((observation) => {
            return (observation.code.coding || []).some((coding) => {
                return coding.system === definitionCoding.system && coding.code === definitionCoding.code
            })
        })

        if (!observation) {
            observation = {
                resourceType: "Observation",
                status: "final",
                code: definition.code,
                category: definition.category,
            }
        }

        const { permittedDataType } = definition

        // set the right observation value type for the data type
        switch (permittedDataType) {
            case "integer": {
                const { system, unit } = definition.quantitativeDetails.unit.coding[0]

                observation.valueQuantity = {
                    value: Number(value),
                    system,
                    unit,
                    code: unit,
                }
                break
            }
            default: {
                throw Error(`Unknown data type ${permittedDataType}`)
            }
        }

        // filter the old observation and update
        const updatedObservations = observations.filter((observation) => {
            return !(observation.code.coding || []).some((coding) => {
                return coding.system === definitionCoding.system && coding.code === definitionCoding.code
            })
        })

        updatedObservations.push(observation)

        setObservations(updatedObservations)
    }

    return (
        <div hidden={currentIndex !== tabIndex}>
            <Grid item xs={12}>
                {definitions.map((definition) => {
                    return (
                        <ObservationInput
                            definition={definition}
                            value={getObservationValue(definition)}
                            setValue={(value) => setObservationValue(value, definition)}
                        />
                    )
                })}
            </Grid>
            <Grid item xs={12}>
                <Button
                    onClick={async () => {
                        const date = new Date().toISOString()

                        observations.forEach((observation) => {
                            observation.effectiveDateTime = date
                        })

                        await saveObservations(observations)

                        setObservations([])
                    }}
                >
                    SAVE
                </Button>
            </Grid>
        </div>
    )
}

export const Observations = ({ configuration, observations, getObservations, saveObservations }) => {
    const [tab, setTab] = useState(null)
    const [tabs, setTabs] = useState([])
    const [tabIndex, setTabIndex] = useState(0)

    useEffect(() => {
        // on loaded set first tab
        const observationConfigurations = (configuration && configuration.observations) || []

        setTab(observationConfigurations[0] || null)
        setTabs(observationConfigurations)
    }, [configuration])

    useEffect(() => {
        // when tab changes refresh resources

        if (!tab) {
            return
        }

        /** @type {fhir.Coding[]} */
        const codes = tab.display.definitions.map((definition) => {
            return definition.code.coding[0]
        })

        getObservations(codes)
    }, [tab])

    useEffect(() => {
        const newTab = tabs[tabIndex] || null

        setTab(newTab)
    }, [tabIndex])

    if (!configuration) {
        return null
    }

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <Tabs value={tabIndex} onChange={(_, tabIndex) => setTabIndex(tabIndex)}>
                    {tabs.map((tab, index) => (
                        <Tab value={index} key={index} label={tab.title} />
                    ))}
                </Tabs>

                {tabs.map((tab, index) => (
                    <>
                        <ObservationTab
                            currentIndex={tabIndex}
                            key={index}
                            tabIndex={index}
                            tab={tab}
                            saveObservations={async (observations) => {
                                await saveObservations(observations)

                                /** @type {fhir.Coding[]} */
                                const codes = tab.display.definitions.map((definition) => {
                                    return definition.code.coding[0]
                                })

                                await getObservations(codes)
                            }}
                        />

                        {JSON.stringify(observations)}
                    </>
                ))}
            </Grid>
        </Grid>
    )
}
