/** @typedef {import("./types").FhirAuthConfig} FhirAuthConfig */

const SecretManager = require("./config.secrets")

const secretManager = new SecretManager(process.env.GCP_PROJECT_ID)

/** @returns {Promise<FhirAuthConfig>} */
async function getConfig() {
    return {
        host: await secretManager.getSecret("PIX_SOS_AUTH_URL"),
        clientId: await secretManager.getSecret("SOS_DATAPROVIDER_CLIENTID"),
        clientSecret: await secretManager.getSecret("SOS_DATAPROVIDER_CLIENTSECRET"),
        grantType: await secretManager.getSecret("PIX_SOS_AUTH_GRANTTYPE"),
        scope: await secretManager.getSecret("PIX_SOS_AUTH_SCOPE"),
        ods: await secretManager.getSecret("PIX_SOS_AUTH_ODS"),
        aud: await secretManager.getSecret("PIX_SOS_AUTH_AUD"),
        sub: await secretManager.getSecret("SOS_DATAPROVIDER_CLIENTID"),
        iss: await secretManager.getSecret("SOS_DATAPROVIDER_CLIENTID"),
        rol: await secretManager.getSecret("PIX_SOS_AUTH_ROL"),
        env: await secretManager.getSecret("PIX_SOS_ENV"),
        agentHost: await secretManager.getSecret("PIX_SOS_IAM_HOST"),
        agentPort: await secretManager.getSecret("PIX_SOS_IAM_PORT"),
        passphrase: await secretManager.getSecret("SOS_DATAPROVIDER_CLIENT_PASSPHRASE"),
        certFile: await secretManager.getSecret("SOS_DATAPROVIDER_CLIENT_CERT", true),
        keyFile: await secretManager.getSecret("SOS_DATAPROVIDER_CLIENT_KEY", true),
        signingKeyFile: await secretManager.getSecret("SOS_DATAPROVIDER_SIGNING_KEY", true),
        signingPassphrase: await secretManager.getSecret("SOS_DATAPROVIDER_SIGNING_PASSPHRASE"),
        caFile: await secretManager.getSecret("SOS_CA_CERT", true),
    }
}

module.exports = getConfig
