/** @typedef {import("./types").Settings} Settings */
/** @typedef {import("moleculer").ServiceSchema<Settings>} ServiceSchema */
/** @typedef {import("moleculer").Service<ServiceSchema>} Service */
/** @typedef {import("moleculer").Context<any, any>} Context */

const getFhirStoreConfig = require("../config/config.fhirstore")
const getFhirAuthConfig = require("../config/config.fhirauth")
const FhirStoreDataProvider = require("../providers/fhirstore.dataprovider")
const TokenProvider = require("../providers/fhirstore.tokenprovider")
const AuthProvider = require("../providers/fhirstore.authprovider")

/**
 * @this {Service}
 * @param {Context} ctx
 * @returns {Promise<fhir.Bundle>}
 * */
async function testActionHandler(ctx) {
    const { logger } = this

    const auth = new AuthProvider(getFhirAuthConfig(), logger)
    const tokenProvider = new TokenProvider(auth, logger)
    const fhirStore = new FhirStoreDataProvider(getFhirStoreConfig(), logger)

    const token = await tokenProvider.getAccessToken()

    const result = await fhirStore.search("Patient", { identifier: 9657702151 }, token)

    return result
}

/** @type {ServiceSchema} */
const FhirService = {
    name: "fhirservice",
    actions: {
        test: testActionHandler,
    },
}

module.exports = FhirService
