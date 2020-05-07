/** @typedef {import("moleculer").Context<any, any>} Context */

const { ResourceType } = require("../models/resourcetype.enum")
const { getFromBundle } = require("../models/bundle.helpers")

/**
 * get policies
 * @param {Context} ctx
 * @param {Array<string>} policyNames
 * @returns {Promise<fhir.Resource[]>} policy resources
 */
const getPolicies = async (policyNames, ctx) => {
    const policyBundle = await ctx.call("fhirservice.search", {
        resourceType: ResourceType.Policy,
        query: { "name:exact": policyNames.join(",") },
    })

    const policies = /** @type {fhir.Resource[]} */ (getFromBundle(policyBundle, ResourceType.Policy))

    if (!policies.length) {
        throw Error("Site policies have not been set")
    }

    return policies
}

/**
 * @param {number | string} nhsNumber
 * @param {Context} ctx
 * @returns {Promise<fhir.Patient>} the patient
 */
const getPatientByNhsNumber = async (nhsNumber, ctx) => {
    /** @type {fhir.Bundle} */
    const patientsBundle = await ctx.call("fhirservice.search", {
        resourceType: ResourceType.Patient,
        query: { identifier: nhsNumber },
    })

    const patients = /** @type {fhir.Patient[]} */ (getFromBundle(patientsBundle, ResourceType.Patient))

    if (!patients.length) {
        throw Error("Patient not found")
    }

    return patients[0]
}

/**
 * Request creation of fhir resource
 * @param {fhir.Resource} resource
 * @param {Context} ctx
 * @returns {Promise<void>}
 */
const createResource = async (resource, ctx) => {
    await ctx.call("fhirservice.create", { resource })
}

module.exports = { getPolicies, getPatientByNhsNumber, createResource }