/** @typedef {import("./types").Settings} Settings */
/** @typedef {import("moleculer").ServiceSchema<Settings>} ServiceSchema */
/** @typedef {import("moleculer").Service<ServiceSchema>} Service */
/** @typedef {import("moleculer").Context<any, any>} Context */

const fhirservice = require("./fhir.service")
const { MoleculerError } = require("moleculer").Errors

/**
 * @typedef {Object} PatientFhirResourceConfig
 * @property {Array<string>} allowedResources
 * @property {string} patientIdentifierSystem
 */

/**
 * @typedef {Object} ResourceWithSubject
 * @property {fhir.Reference} [subject]
 */

/**
 * Checks two FHIR identifiers match
 * @param {fhir.Identifier} sourceIdentifier
 * @param {fhir.Identifier} targetIdentifier
 * @returns {boolean}
 */
function matchIdentifier(sourceIdentifier, targetIdentifier) {
    return !!(
        sourceIdentifier.system &&
        targetIdentifier.value &&
        sourceIdentifier.system === targetIdentifier.system &&
        sourceIdentifier.value === targetIdentifier.value
    )
}

/**
 * @typedef {Object} PatientResourceChecker
 * @property {(resource: fhir.Resource & ResourceWithSubject, reference: string, identifier: fhir.Identifier) => boolean} isAccessibleResource
 * @property {(resource: fhir.Resource & ResourceWithSubject, reference: string, identifier: fhir.Identifier) => fhir.Resource & ResourceWithSubject} setAsPatientResource
 * @property {(params: any, reference: string, identifier: fhir.Identifier) => any} applyIdentifierToSearch
 */

/** @type {PatientResourceChecker} */
class PatientSubjectResourceChecker {
    /**
     * @param {fhir.Resource & ResourceWithSubject} resource
     * @param {fhir.Identifier} patientIdentifier
     * @returns {boolean}
     */
    isAccessibleResource(resource, patientReference, patientIdentifier) {
        // resource has no subject
        if (!resource.subject) {
            throw new MoleculerError(`Resource ${resource.resourceType} has no subject`, 400)
        }

        const { subject } = resource

        const { identifier, reference } = subject

        // check the identifier
        if (identifier && !matchIdentifier(identifier, patientIdentifier)) {
            return false
        }

        if (reference && reference === patientReference) {
            return true
        }

        // return false
        return false
    }

    /**
     * @param {fhir.Resource & ResourceWithSubject} resource
     * @param {fhir.Identifier} patientIdentifier
     * @returns {fhir.Resource & ResourceWithSubject}
     */
    setAsPatientResource(resource, patientReference, patientIdentifier) {
        resource.subject = {
            reference: patientReference,
            identifier: patientIdentifier,
        }

        return resource
    }

    applyIdentifierToSearch(params, patientReference, patientIdentifier) {
        params.subject = patientReference

        return params
    }
}

/** @type {PatientResourceChecker} */
class PatientObservationResourceChecker {
    /**
     * @param {fhir.Resource & ResourceWithSubject} resource
     * @param {fhir.Identifier} patientIdentifier
     * @returns {boolean}
     */
    isAccessibleResource(resource, patientReference, patientIdentifier) {
        // resource has no subject
        if (!resource.subject) {
            throw new MoleculerError(`Resource ${resource.resourceType} has no subject`, 400)
        }

        const { subject } = resource

        const { identifier, reference } = subject

        // check the identifier
        if (identifier && !matchIdentifier(identifier, patientIdentifier)) {
            return false
        }

        if (reference && reference === patientReference) {
            return true
        }

        // return false
        return false
    }

    /**
     * @param {fhir.Observation & ResourceWithSubject} resource
     * @param {fhir.Identifier} patientIdentifier
     * @returns {fhir.Resource & ResourceWithSubject}
     */
    setAsPatientResource(resource, patientReference, patientIdentifier) {
        resource.subject = {
            reference: patientReference,
            identifier: patientIdentifier,
        }

        resource.performer = [{
            reference: patientReference,
            identifier: patientIdentifier,
        }]

        return resource
    }

    applyIdentifierToSearch(params, patientReference, patientIdentifier) {
        params.subject = patientReference

        return params
    }
}

class NonPatientCentricResourceChecker {
    /**
     * @param {fhir.Resource} resource
     * @param {fhir.Identifier} patientIdentifier
     * @returns {boolean}
     */
    isAccessibleResource(resource, patientReference, patientIdentifier) {
        return true
    }

    /**
     * @param {fhir.Resource & ResourceWithSubject} resource
     * @param {fhir.Identifier} patientIdentifier
     * @returns {fhir.Resource & ResourceWithSubject}
     */
    setAsPatientResource(resource, patientReference, patientIdentifier) {
        return resource
    }

    applyIdentifierToSearch(params, patientReference, patientIdentifier) {
        return params
    }
}

class PatientFhirResourceChecker {
    /**
     * @param {PatientFhirResourceConfig} configuration
     * @param {{ [resourceType: string]: PatientResourceChecker }} resourceCheckers
     */
    constructor(configuration, resourceCheckers) {
        this.configuration = configuration
        this.resourceCheckers = resourceCheckers
    }

    /**
     * @param {Context} ctx
     * @returns {fhir.Identifier}
     */
    identifierFromContext(ctx) {
        return {
            system: this.configuration.patientIdentifierSystem,
            value: ctx.meta.user.sub,
        }
    }

    /**
     * Checks if patient is allowed to interact with the resource
     * @public
     * @param {string} resourceType
     * @returns {boolean}
     */
    isAllowedResource(resourceType) {
        const { allowedResources } = this.configuration
        console.log("allowedResources: ", allowedResources)
        console.log("resourceType: ", resourceType)

        return allowedResources.some((allowedResource) => allowedResource === resourceType)
    }

    isAccessibleResource(resource, patientReference, patientIdentifier) {
        // is the resource type allowed to patients?
        if (!this.isAllowedResource(resource.resourceType)) {
            return false
        }

        const resourceChecker = this.getResourceChecker(resource.resourceType)

        return resourceChecker.isAccessibleResource(resource, patientReference, patientIdentifier)
    }

    setAsPatientResource(resource, patientReference, patientIdentifier) {
        const checker = this.getResourceChecker(resource.resourceType)

        return checker.setAsPatientResource(resource, patientReference, patientIdentifier)
    }

    /**
     *
     * @param {fhir.Bundle} bundle
     */
    checkBundle(bundle, patientReference, patientIdentifier) {
        if (bundle.entry) {
            bundle.entry = bundle.entry.filter((entry) => {
                if (!entry.resource) {
                    return true
                } else {
                    return this.isAccessibleResource(entry.resource, patientReference, patientIdentifier)
                }
            })
        }

        return bundle
    }

    applyIdentifierToSearch(params, patientReference, patientIdentifier) {
        if (!params.resourceType) {
            throw new MoleculerError("No resourceType found in params", 400)
        }

        const checker = this.getResourceChecker(params.resourceType)

        return checker.applyIdentifierToSearch(params, patientReference, patientIdentifier)
    }

    checkResource(resource, patientReference, patientIdentifier) {
        if (!this.isAccessibleResource(resource, patientReference, patientIdentifier)) {
            return null
        }

        return resource
    }

    getResourceChecker(resourceType) {
        const checker = this.resourceCheckers[resourceType]

        if (!checker) {
            throw new MoleculerError(`No resource checker defined for resource ${resourceType}`, 400)
        }

        return checker
    }
}

const nonPatientCentricResourceChecker = new NonPatientCentricResourceChecker()
const subjectResourceChecker = new PatientSubjectResourceChecker()
const observationResourceChecker = new PatientObservationResourceChecker()

const patientResourceChecker = new PatientFhirResourceChecker(
    {
        allowedResources: ["Composition", "Questionnaire", "QuestionnaireResponse", "Observation"],
        patientIdentifierSystem: "https://fhir.nhs.uk/Id/nhs-number",
    },
    {
        Composition: subjectResourceChecker,
        QuestionnaireResponse: subjectResourceChecker,
        Questionnaire: nonPatientCentricResourceChecker,
        Observation: observationResourceChecker
    }
)

function buildSearchQuery(params) {
    const { resourceType } = params

    delete params.resourceType

    return {
        resourceType,
        query: {
            ...params,
        },
    }
}

/** @type {ServiceSchema} */
const PatientFhirService = {
    name: "patientfhirservice",
    mixins: [fhirservice],
    methods: {
        async searchActionHandler(ctx) {
            const { reference } = ctx.meta.user

            if (!reference) {
                throw new MoleculerError(`User ${ctx.meta.user.sub} has no reference`, 400)
            }

            const identifier = patientResourceChecker.identifierFromContext(ctx)

            if (!patientResourceChecker.isAllowedResource(ctx.params.resourceType)) {
                throw new MoleculerError(`Attempt to access blocked resource`, 400)
            }

            let sanitisedQuery = null

            if (ctx.params._queryId) {
                /** @todo need to check query id */
                sanitisedQuery = buildSearchQuery(ctx.params)
            } else {
                sanitisedQuery = buildSearchQuery(
                    patientResourceChecker.applyIdentifierToSearch(ctx.params, reference, identifier)
                )
            }

            /** @type {fhir.Bundle} */
            const searchResult = await ctx.call("internalfhirservice.search", sanitisedQuery)

            return patientResourceChecker.checkBundle(searchResult, reference, identifier)
        },
        async readActionHandler(ctx) {
            const { reference } = ctx.meta.user

            if (!reference) {
                throw new MoleculerError(`User ${ctx.meta.user.sub} has no reference`, 400)
            }

            const identifier = patientResourceChecker.identifierFromContext(ctx)

            if (!patientResourceChecker.isAllowedResource(ctx.params.resourceType)) {
                throw new MoleculerError(`Attempt to access blocked resource`, 403)
            }

            /** @type {fhir.Resource} */
            const searchResult = await ctx.call("internalfhirservice.read", ctx.params)

            return patientResourceChecker.checkResource(searchResult, reference, identifier)
        },
        async createActionHandler(ctx) {
            console.log("patientFhirService.create ctx: ", ctx)
            const { reference } = ctx.meta.user

            if (!reference) {
                throw new MoleculerError(`User ${ctx.meta.user.sub} has no reference`, 400)
            }

            const identifier = patientResourceChecker.identifierFromContext(ctx)

            if (!patientResourceChecker.isAllowedResource(ctx.params.resourceType)) {
                throw new MoleculerError(`Attempt to create blocked resource`, 403)
            }

            let { resource } = ctx.params

            if (!resource) {
                throw new MoleculerError("No resource", 400)
            }

            resource = patientResourceChecker.setAsPatientResource(resource, reference, identifier)


            return await ctx.call("internalfhirservice.create", { ...ctx.params, resource })
        },
    },
}

module.exports = PatientFhirService
