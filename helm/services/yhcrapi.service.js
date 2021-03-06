/**
 * The yhcrapiservice's sole purpose is to provide DataProvider capability to Helm
 * to surface resources to the YHCR.
 *
 * Because of the nature of the endpoint, it has been separated out from the rest of
 * the services to make sure adequate security is always provided.
 */

/** @typedef {import("./types").Settings} Settings */
/** @typedef {import("moleculer-web")} MoleculerWeb */
/** @typedef {import("moleculer").ServiceSchema<Settings>} ServiceSchema */

const ApiService = require("moleculer-web")
const request = require("request-promise-native")
const https = require("https")
const jwt = require("jsonwebtoken")
const getYhcrAuthConfig = require("../config/config.yhcrauth")
const SiteTokenProvider = require("../providers/siteauth.tokenprovider")
const getSiteAuthConfiguration = require("../config/config.siteauth")

const yhcrAuthHandler = async (req, res, next) => {
    const unauthorised = (response) => {
        response.writeHead(403)
        response.end()
    }

    try {
        const configuration = await getYhcrAuthConfig()

        const auth = req.headers["authorization"]

        if (!auth) {
            return unauthorised(res)
        }

        const access_token = auth.split("Bearer ")[1]

        if (!access_token) {
            return unauthorised(res)
        }

        const { verifyUrl, clientId, clientSecret, env } = configuration

        const options = {
            method: "GET",
            uri: verifyUrl,
            json: true,
            body: {
                access_token: auth,
            },
            simple: false,
            resolveWithFullResponse: true,
            auth: {
                user: clientId,
                pass: clientSecret,
            },
        }

        if (configuration.env !== "local") {
            options.agent = new https.Agent({
                host: configuration.agentHost,
                port: configuration.agentPort,
                passphrase: configuration.passphrase,
                rejectUnauthorized: true,
                cert: configuration.certFile,
                key: configuration.keyFile,
                ca: configuration.caFile,
            })
        } else {
            options.rejectUnauthorized = false
        }

        const result = await request(options)

        const certificate = result.body

        const decoded = jwt.verify(access_token, certificate)

        req.user = decoded

        // const authConfig = await getSiteAuthConfiguration()

        // const tokenProvider = new SiteTokenProvider(authConfig)

        // req.fhirToken = await tokenProvider.generateSiteTokenYhcr(decoded)

        return next()
    } catch (error) {
        return unauthorised(res)
    }
}

/** @type {ServiceSchema} */
const ApiGateway = {
    name: "yhcrapiservice",
    mixins: [ApiService],
    settings: {
        port: 8090,
        routes: [
            {
                path: "/fhir/stu3",
                use: [yhcrAuthHandler],
                aliases: {
                    "GET /Composition": "yhcrfhirservice.topThreeThingsCompositionSearch",
                    "GET /Composition/:resourceId": "yhcrfhirservice.topThreeThingsCompositionRead",
                    "GET /AuditEvent": "yhcrfhirservice.auditEventSearch",
                    "GET /AuditEvent/:resourceId": "yhcrfhirservice.auditEventRead",
                    "GET /:resourceType": "yhcrfhirservice.search",
                    "GET /:resourceType/:resourceId": "yhcrfhirservice.read",
                },
                onBeforeCall(ctx, route, req, res) {
                    ctx.meta.user = req.user

                    req.$params = {
                        resource: req.$params.body,
                        ...req.$params.params,
                        query: req.$params.query,
                    }
                },
                mergeParams: false,
            },
        ],
        onError(req, res, err) {
            this.logger.error(err.stack || err.message)

            res.writeHead(500, { "Content-Type": "application/json" })
            res.end(JSON.stringify({ error: "Error" }))
        },
    },
}

module.exports = ApiGateway
