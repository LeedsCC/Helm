/** @typedef {import("../models/types").Demographics} Demographics */
/** @typedef {import("moleculer").Context<any, any>} Context */

const { getFromBundle } = require("../models/bundle.helpers")
const { ResourceType } = require("../models/resourcetype.enum")
const { getResourceTypeReference, splitReference } = require("../models/resource.helpers")

/**
 * Checks if period for name/address is valid
 * @param {fhir.Period | null | undefined} period
 * @returns {boolean}
 */
function isActive(period) {
    if (!period) return true

    let valid = true

    const currentDate = new Date().getTime()

    if (period.start && new Date(period.start).getTime() > currentDate) {
        valid = false
    }

    if (period.end && new Date(period.end).getTime() < currentDate) {
        valid = false
    }

    return valid
}

/**
 *
 * @param {fhir.HumanName[] | undefined} name
 */
function parseName(name) {
    let primaryName = null

    if (Array.isArray(name) && name.length) {
        primaryName = name.find((nameItem) => {
            return nameItem.use === "official" && isActive(nameItem.period)
        })

        if (!primaryName) {
            primaryName = name.find((nameItem) => {
                return nameItem.use !== "old" && nameItem.use !== "temp" && isActive(nameItem.period)
            })
        }
    }

    if (!primaryName) return null

    let initName = primaryName && primaryName.text ? primaryName.text : null

    if (!initName) {
        if (primaryName.given) {
            initName = getName(primaryName.given)
        }

        if (primaryName.family) {
            initName = Array.isArray(primaryName.family)
                ? getName(primaryName.family)
                : `${initName} ${primaryName.family}`
        }
    }

    return initName
}

/**
 * @param {string | string[]} nameObj
 * @returns {string}
 */
function getName(nameObj) {
    let name

    Array.isArray(nameObj) ? nameObj.forEach((n) => (name = name ? `${name} ${n}` : `${n}`)) : (name = nameObj)

    return name || ""
}

/**
 *
 * @param {fhir.Address[] | undefined} addressArray
 * @param {string} addressUse
 * @returns {string | null}
 */
function parseAddress(addressArray, addressUse) {
    if (!addressArray || !addressArray.length) {
        return null
    }

    let mainAddress = addressArray.find((addr) => {
        return addr.use === addressUse && isActive(addr.period)
    })

    if (!mainAddress) {
        mainAddress = addressArray[0]
    }

    if (mainAddress) {
        if (mainAddress.text) {
            return mainAddress.text
        }

        const { line, city, district, state, postalCode, country } = mainAddress

        let addressComponents = []

        if (line && line.length) {
            addressComponents = addressComponents.concat(line.map((l) => String(l).trim()))
        }

        if (city) {
            addressComponents.push(String(city).trim())
        }

        if (district) {
            addressComponents.push(String(district).trim())
        }

        if (state) {
            addressComponents.push(String(state).trim())
        }

        if (country) {
            addressComponents.push(String(country).trim())
        }

        if (postalCode) {
            addressComponents.push(String(postalCode).trim())
        }

        if (addressComponents.length) {
            return addressComponents.join(", ")
        }
    }

    return null
}

function parseTelecom(telecomArray) {
    let blankTelecom = null

    if (!telecomArray || !Array.isArray(telecomArray)) return blankTelecom

    const filteredTelecoms = telecomArray.filter((tel) => {
        if (tel.system !== "phone" || tel.use === "old") return false

        return isActive(tel.period)
    })

    if (!filteredTelecoms.length) return blankTelecom

    let primaryTelecom = filteredTelecoms.find((tel) => tel.use === "home" && tel.value && tel.value !== "Not Recorded")

    if (!primaryTelecom) {
        primaryTelecom = filteredTelecoms.find(
            (tel) => tel.use === "mobile" && tel.value && tel.value !== "Not Recorded"
        )
    }

    if (!primaryTelecom) return blankTelecom

    return primaryTelecom.value
}

class DemographicsProvider {
    /**
     * @param {fhir.Reference[]} references
     * @param {Context} ctx
     * @returns {Promise<fhir.Practitioner | null>}
     */
    async getPractitioner(ctx, references) {
        const practitionerReference = getResourceTypeReference(references, ResourceType.Practitioner)

        if (!practitionerReference) {
            return null
        }

        /** @type {fhir.Practitioner | null} */
        const practitioner = await ctx.call("fhirservice.read", splitReference(practitionerReference))

        return practitioner
    }

    /**
     * @param {fhir.Reference[]} references
     * @param {Context} ctx
     * @returns {Promise<fhir.Organization | null>}
     */
    async getOrganisation(ctx, references) {
        const organisationReference = getResourceTypeReference(references, ResourceType.Organization)

        if (!organisationReference) {
            return null
        }

        /** @type {fhir.Organization | null} */
        const organisation = await ctx.call("fhirservice.read", splitReference(organisationReference))

        return organisation
    }

    /**
     *
     * @param {Context} ctx
     * @returns {Promise<Demographics>}
     */
    async demographics(ctx) {
        const { nhsNumber } = ctx.params

        /** @type {fhir.Bundle} */
        const patientBundle = await ctx.call("fhirservice.search", {
            resourceType: ResourceType.Patient,
            query: { identifier: `https://fhir.nhs.uk/Id/nhs-number|${nhsNumber}` },
        })

        /** @type {fhir.Patient[]} */
        const patients = getFromBundle(patientBundle, ResourceType.Patient)

        if (!patients.length) {
            throw Error("Patient not found")
        }

        const [patient] = patients

        if (!patient.generalPractitioner) {
            return this.formatDemographics(patient, null, null)
        }

        const practitionerPromise = this.getPractitioner(ctx, patient.generalPractitioner)
        const organisationPromise = this.getOrganisation(ctx, patient.generalPractitioner)

        const result = await Promise.all([practitionerPromise, organisationPromise])

        const [practitioner, organisation] = result

        return this.formatDemographics(patient, practitioner, organisation)
    }

    /**
     * @private
     * @param {fhir.Patient} patient
     * @param {?fhir.Practitioner} practitioner
     * @param {?fhir.Organization} organisation
     * @returns {Demographics} demographics
     */
    formatDemographics(patient, practitioner, organisation) {
        const { identifier, gender, address, telecom, name, birthDate } = patient

        const nhsIdentifier =
            identifier && identifier.find((ident) => ident.system === "https://fhir.nhs.uk/Id/nhs-number")

        if (!nhsIdentifier || !nhsIdentifier.value) {
            throw Error("NHS number not found for patient")
        }

        const gpAddress =
            (organisation && parseAddress(organisation.address, "work")) ||
            (practitioner && parseAddress(practitioner.address, "work")) ||
            "Not known"

        return {
            id: nhsIdentifier.value,
            nhsNumber: nhsIdentifier.value,
            gender: gender || "Not Known",
            telephone: parseTelecom(telecom) || "Not Known",
            name: parseName(name) || "Not Known",
            address: parseAddress(address, "home") || "Not Known",
            dateOfBirth: (birthDate && new Date(birthDate).getTime()) || null,
            gpName: (practitioner && parseName(practitioner.name)) || "Not known",
            gpAddress,
        }
    }
}

module.exports = DemographicsProvider