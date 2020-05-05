/**
 * @typedef {Object} FhirStoreConfig
 * @property {string} host
 */

/**
 * @typedef {Object} FhirAuthConfig
 * @property {string} host
 * @property {string} clientId
 * @property {string} clientSecret
 * @property {string} grantType
 */

/**
 * @typedef {Object} OidcUrlConfiguration
 * @property {string} issuer
 * @property {string} authorizationEndpoint
 * @property {string} tokenEndpoint
 * @property {string} userInfoEndpoint
 * @property {string} introspectionEndpoint
 * @property {string} jwksEndpoint
 * @property {string} endSessionEndpoint
 */

/**
 * @typedef {Object} OidcScopeConfiguration
 * @property {string} login
 */

/**
 * @typedef {Object} OidcHttpOptions
 * @property {boolean} rejectUnauthorized
 * @property {number} timeout
 */

/**
 * @typedef {Object} OidcClientConfiguration
 * @property {string} oidcProviderHost
 * @property {OidcUrlConfiguration} urls
 * @property {string} typedef
 * @property {string} clientId
 * @property {string} clientSecret
 * @property {OidcScopeConfiguration} scope
 * @property {OidcHttpOptions} defaultHttpOptions
 * @property {string} tokenEndpointAuthMethod
 * @property {string} tokenEndpointAuthSigningAlg
 * @property {string} privateKeyFilePath
 * @property {string} redirectUrl
 */

module.exports = {}