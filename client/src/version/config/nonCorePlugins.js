// NON-CORE PLUGINS CONFIGURATION LIST

// TOP THREE THINGS
import TopThreeThingsCreate from "../plugins/TopThreeThings/TopThreeThingsCreate"

// LEEDS REPOSITORY
import Directory from "../pages/Directory"
// NHS WIDGETS
import NhsWidgets from "../plugins/NhsWidgets/NhsWidgets"
import AboutMe from "../plugins/AboutMe/AboutMe"
import Observations from "../plugins/Observations/Observations"

export default [
  {
    name: "leeds-information",
    label: "Leeds Information",
    list: Directory,
  },
  {
    name: "nhs-resources",
    label: "NHS Resources",
    list: NhsWidgets,
  },
  {
    name: "about-me",
    label: "About Me",
    list: AboutMe,
  },
  {
    name: "observations",
    label: "Observations",
    list: Observations,
  },
]
