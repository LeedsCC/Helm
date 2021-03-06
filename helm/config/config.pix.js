/** @typedef {import("./types").FhirStoreConfig} FhirStoreConfig */

const SecretManager = require("./config.secrets")

const secretManager = new SecretManager(process.env.GCP_PROJECT_ID)

/** @returns {Promise<FhirStoreConfig>} */
async function getConfig() {
    return {
        host: await secretManager.getSecret("PIX_SOS_URL"),
        env: await secretManager.getSecret("FHIRSTORE_SOS_ENV"),
        agentHost: await secretManager.getSecret("FHIRSTORE_SOS_FHIR_HOST"),
        agentPort: await secretManager.getSecret("FHIRSTORE_SOS_FHIR_PORT"),
        passphrase: await secretManager.getSecret("SOS_DATAPROVIDER_CLIENT_PASSPHRASE"),
        certFile: await secretManager.getSecret("SOS_DATAPROVIDER_CLIENT_CERT", true),
        keyFile: await secretManager.getSecret("SOS_DATAPROVIDER_CLIENT_KEY", true),
        caFile: await secretManager.getSecret("SOS_CA_CERT", true),
    }
}

module.exports = getConfig
