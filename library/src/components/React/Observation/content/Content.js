import { Divider, Grid, Typography } from "@material-ui/core"
import React, { useEffect } from "react"
import ObservationForm from "../form/ObservationForm"
import ObeservationGraph from "../graph/ObservationGraph"
import Table from "../table/Table"

import { useSelector, useDispatch } from "react-redux"
import { populateInformation, selectInformation } from "./ContentSlice"
import { selectValue } from "../tabs/ObservationTabsSlice"
import { selectObservations } from "../ObservationSlice"

export default function content(props) {
    const informationArray = useSelector(selectInformation)
    const value = useSelector(selectValue)
    const observations = useSelector(selectObservations)
    const dispatch = useDispatch()

    const { saveObservations, getObservations, sendMessage } = props

    useEffect(() => {
        dispatch(populateInformation(observations))
    }, [observations])

    return (
        <Grid container direction="column" justify="flex-start" alignItems="stretch" spacing={2}>
            <Grid item xs={12}>
                <Grid container direction="row" justify="space-evenly" alignItems="stretch" spacing={2}>
                    <Grid item xs={12} md={6}>
                        <ObservationForm
                            sendMessage={sendMessage}
                            saveObservations={saveObservations}
                            getObservations={getObservations}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h4">
                            {informationArray.length > 0 ? informationArray[value].header : null}
                        </Typography>
                        <Typography variant="subtitle1">
                            {informationArray.length > 0 ? (
                                <ul>
                                    {informationArray[value].body.map((point) => (
                                        <li dangerouslySetInnerHTML={{ __html: point }}></li>
                                    ))}
                                </ul>
                            ) : null}
                        </Typography>
                    </Grid>
                </Grid>
            </Grid>
            <Divider />
            <Grid item xs={12}>
                <Grid container direction="row" justify="space-evenly" alignItems="stretch" spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Table />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <ObeservationGraph />
                    </Grid>
                </Grid>
            </Grid>
            <Grid item xs={12}>
                <Grid container direction="row" justify="space-evenly" alignItems="stretch" spacing={2}>
                    <Grid item xs={12}>
                        {informationArray.length > 0 ? (
                            <div>
                                <Typography>{informationArray[value].footer.header}</Typography>
                                <Typography>
                                    <ul>
                                        {informationArray[value].footer.body.map((point) => (
                                            <li>{point}</li>
                                        ))}
                                    </ul>
                                </Typography>
                            </div>
                        ) : null}
                    </Grid>
                </Grid>
            </Grid>
        </Grid>
    )
}
