// If you want to use Phoenix channels, run `mix help phx.gen.channel`
// to get started and then uncomment the line below.
// import "./user_socket.js"

// You can include dependencies in two ways.
//
// The simplest option is to put them in assets/vendor and
// import them using relative paths:
//
//     import "../vendor/some-package.js"
//
// Alternatively, you can `npm install some-package --prefix assets` and import
// them using a path starting with the package name:
//
//     import "some-package"
//
// If you have dependencies that try to import CSS, esbuild will generate a separate `app.css` file.
// To load it, simply add a second `<link>` to your `root.html.heex` file.

// Include phoenix_html to handle method=PUT/DELETE in forms and buttons.
import "phoenix_html"
// Establish Phoenix Socket and LiveView configuration.
import {Socket} from "phoenix"
import {LiveSocket} from "phoenix_live_view"
import {hooks as colocatedHooks} from "phoenix-colocated/school"
import topbar from "../vendor/topbar"

const networkCopyReplacements = [
  ["Mail Verification Bureau", "Firewall Verification Node"],
  ["Postal Inspector Training Division", "Firewall Operations Division"],
  ["Senior Postal Officer", "Network Security Operator"],
  ["Package Inspection Form", "Packet Inspection Form"],
  ["Package Type", "Packet Type"],
  ["Shipping Class", "Traffic Class"],
  ["Declared Value", "Payload Value"],
  ["Customs Form", "ACL Rule"],
  ["Fragile Sticker", "Quarantine Tag"],
  ["Postal Regulations", "Network Rules"],
  ["Inspector Rankings", "Firewall Rankings"],
  ["Inspector Name", "Firewall Name"],
  ["Report for Duty", "Bring Firewall Online"],
  ["Match time remaining", "Scan time remaining"],
  ["Inspector Wazowski", "Firewall Atlas"],
  ["Inspector", "Firewall"],
  ["Postal", "Network"],
  ["postal", "network"],
  ["packages", "packets"],
  ["Packages", "Packets"],
  ["package", "packet"],
  ["Package", "Packet"],
  ["shipping", "routing"],
  ["Shipping", "Routing"],
  ["Postage", "Signal"],
  ["Paid", "Open"],
  ["PKG-", "PKT-"],
  ["Approved", "Allowed"],
  ["Approve", "Allow"],
  ["Rejected", "Blocked"],
  ["Decline", "Block"],
  ["You were attacked!", "Packet attack detected"],
  ["Insurance", "TLS"],
  ["✉", "FW"],
]

const decorateInterceptedPacketForm = () => {
  document.querySelectorAll("form[phx-submit='attack']").forEach(form => {
    form.classList.add("intercept-panel")
    form.setAttribute("aria-label", "Intercepted packet attack panel")

    if (!form.querySelector(".intercept-panel-header")) {
      const header = document.createElement("div")
      header.className = "intercept-panel-header"
      header.innerHTML = `
        <span class="intercept-panel-kicker">Intercepted Packet</span>
        <span class="intercept-panel-id">PKT-LIVE</span>
      `
      form.prepend(header)
    }

    if (!form.querySelector(".intercept-panel-warning")) {
      const warning = document.createElement("p")
      warning.className = "intercept-panel-warning"
      warning.textContent = "If you attack another player you lose a random value between 0 and 3 points"
      form
        .querySelector(".intercept-panel-header")
        ?.insertAdjacentElement("afterend", warning)
    }

    const label = form.querySelector("label[for='victim-name']")
    if (label) label.textContent = "Target Firewall"

    const input = form.querySelector("#victim-name")
    if (input) {
      input.placeholder = "e.g. Firewall Atlas"
      input.setAttribute("aria-label", "Target firewall name")
    }

    const button = form.querySelector("button")
    if (button) button.textContent = "Attack Player"
  })
}

const decorateAttackNotification = () => {
  document.querySelectorAll(".notification").forEach(notification => {
    notification.classList.add("attack-notification")
    notification.setAttribute("role", "alert")
    notification.setAttribute("aria-live", "assertive")

    if (notification.dataset.enhanced === "true") return

    notification.dataset.enhanced = "true"
    notification.innerHTML = `
      <span class="attack-notification-pulse"></span>
      <span class="attack-notification-copy">
        <strong>Packet attack detected</strong>
        <span>New hostile rule injected into your firewall.</span>
      </span>
    `
  })
}

const applyNetworkCopy = () => {
  if (!document.body) return

  const skipTags = new Set(["SCRIPT", "STYLE", "TEXTAREA"])
  const replaceCopy = value =>
    networkCopyReplacements.reduce(
      (text, [from, to]) => text.split(from).join(to),
      value
    )

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: node => {
        const parent = node.parentElement
        if (!parent || skipTags.has(parent.tagName) || !node.nodeValue.trim()) {
          return NodeFilter.FILTER_REJECT
        }

        return NodeFilter.FILTER_ACCEPT
      },
    }
  )

  const textNodes = []
  while (walker.nextNode()) textNodes.push(walker.currentNode)

  textNodes.forEach(node => {
    const updated = replaceCopy(node.nodeValue)
    if (updated !== node.nodeValue) node.nodeValue = updated
  })

  document
    .querySelectorAll("[placeholder], [aria-label], [title]")
    .forEach(element => {
      ;["placeholder", "aria-label", "title"].forEach(attribute => {
        const value = element.getAttribute(attribute)
        if (!value) return

        const updated = replaceCopy(value)
        if (updated !== value) element.setAttribute(attribute, updated)
      })
    })

  decorateInterceptedPacketForm()
  decorateAttackNotification()
}

let networkCopyPending = false
const scheduleNetworkCopy = () => {
  if (networkCopyPending) return

  networkCopyPending = true
  requestAnimationFrame(() => {
    networkCopyPending = false
    applyNetworkCopy()
  })
}

new MutationObserver(scheduleNetworkCopy).observe(document.documentElement, {
  childList: true,
  subtree: true,
  characterData: true,
})
document.addEventListener("DOMContentLoaded", scheduleNetworkCopy)
window.addEventListener("phx:page-loading-stop", scheduleNetworkCopy)

const csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content")
const liveSocket = new LiveSocket("/live", Socket, {
  longPollFallbackMs: 2500,
  params: {_csrf_token: csrfToken},
  hooks: {...colocatedHooks},
})

// Show progress bar on live navigation and form submits
topbar.config({barColors: {0: "#29d"}, shadowColor: "rgba(0, 0, 0, .3)"})
window.addEventListener("phx:page-loading-start", _info => topbar.show(300))
window.addEventListener("phx:page-loading-stop", _info => topbar.hide())

// connect if there are any LiveViews on the page
liveSocket.connect()
scheduleNetworkCopy()

// expose liveSocket on window for web console debug logs and latency simulation:
// >> liveSocket.enableDebug()
// >> liveSocket.enableLatencySim(1000)  // enabled for duration of browser session
// >> liveSocket.disableLatencySim()
window.liveSocket = liveSocket

// The lines below enable quality of life phoenix_live_reload
// development features:
//
//     1. stream server logs to the browser console
//     2. click on elements to jump to their definitions in your code editor
//
if (process.env.NODE_ENV === "development") {
  window.addEventListener("phx:live_reload:attached", ({detail: reloader}) => {
    // Enable server log streaming to client.
    // Disable with reloader.disableServerLogs()
    reloader.enableServerLogs()

    // Open configured PLUG_EDITOR at file:line of the clicked element's HEEx component
    //
    //   * click with "c" key pressed to open at caller location
    //   * click with "d" key pressed to open at function component definition location
    let keyDown
    window.addEventListener("keydown", e => keyDown = e.key)
    window.addEventListener("keyup", _e => keyDown = null)
    window.addEventListener("click", e => {
      if(keyDown === "c"){
        e.preventDefault()
        e.stopImmediatePropagation()
        reloader.openEditorAtCaller(e.target)
      } else if(keyDown === "d"){
        e.preventDefault()
        e.stopImmediatePropagation()
        reloader.openEditorAtDef(e.target)
      }
    }, true)

    window.liveReloader = reloader
  })
}
