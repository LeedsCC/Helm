import backgroundImage from "../../version/images/Artboard.png"
import cardBackgroundImage from "../../version/images/blue-ring-01.png"
import tableHeaderImage from "../../version/images/table-header.png"

import ThemeTopbar from "../common/Topbar"
import PatientSummary from "../../core/pages/PatientSummary"

export const themeShortMenu = [
  { url: "/summary", label: "Patient Summary" },
  // { url: "/top3Things", label: "TopThreeThings" },
  { url: "/nhs-resources", label: "NHS Resources" },
  { url: "/leeds-information", label: "Leeds Information" },
  { url: "/about-me", label: "About Me" },
  { url: "/observations", label: "Observations" },
]

export const themeFullMenu = [
  { url: "/summary", label: "Patient Summary" },
  // { url: "/top3Things", label: "TopThreeThings" },
  { url: "/nhs-resources", label: "NHS Resources" },
  { url: "/leeds-information", label: "Leeds Information" },
  { url: "/about-me", label: "About Me" },
  { url: "/observations", label: "Observations" },
]

export const themeCommonElements = {
  topbar: ThemeTopbar,
  homePage: PatientSummary,
  isFooterAbsent: true,
}

export const themeImages = {
  backgroundImage: backgroundImage,
  cardBackgroundImage: cardBackgroundImage,
  tableHeaderImage: tableHeaderImage,
}
