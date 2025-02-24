class Option {
  constructor(name, type, defaultValue) {
    this.name = name
    this.type = type
    this.defaultValue = defaultValue
  }

  setValue(value) {
    switch (this.type) {
      case "radio":
        Array.prototype.forEach.call(document.getElementsByName(this.name), (el) => {
          el.checked = el.value === value
        })
        break
      case "checkbox":
        document.getElementsByName(this.name).forEach(el => el.checked = value)
        break
      case "select":
        document.getElementsByName(this.name).forEach(el => el.value = value)
        break
      case "text":
        document.getElementsByName(this.name).forEach(el => el.value = value)
        break
    }
  }

  getValue() {
    switch (this.type) {
      case "radio":
        return document.querySelector(`input[name="${this.name}"]:checked`).value
      case "checkbox":
        return document.querySelector(`input[name="${this.name}"]`).checked
      case "select":
        return document.querySelector(`select[name="${this.name}"]`).value
      case "text":
        return document.querySelector(`input[name="${this.name}"]`).value
    }
  }
}

const _options = [
  new Option("iconAction", "radio", "clickOnly"),
  new Option("iconActionOption", "radio", "direct"),
  new Option("mpvPlayer", "select", "mpv"),
  new Option("useCustomFlags", "checkbox", false),
  new Option("customFlags", "text", "")
]

export function getOptions(callback) {
  const getDict = {}
  _options.forEach(item => {
    getDict[item.name] = item.defaultValue
  })
  chrome.storage.sync.get(getDict, callback)
}

export function saveOptions() {
  const saveDict = {}
  _options.forEach(item => {
    saveDict[item.name] = item.getValue()
  })
  chrome.storage.sync.set(saveDict)
}

export function restoreOptions() {
  getOptions((items) => {
    _options.forEach(option => {
      option.setValue(items[option.name])
    })
  })
}

export function openInMPV(tabId, url, options = {}) {

  const baseURL = `mpv://`

  const params = url.split('&')[0]

  const code = `
    var link = document.createElement('a')
    link.href='${baseURL}${params}'
    document.body.appendChild(link)
    link.click()`
  console.log(code)
  chrome.tabs.executeScript(tabId, { code })
}

export function updateBrowserAction() {
  getOptions(options => {
    if (options.iconAction === "clickOnly") {
      chrome.browserAction.setPopup({ popup: "" })
      chrome.browserAction.onClicked.addListener(() => {
        // Get active tab
        chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
          if (tabs.length === 0)
            return

          // TODO: filter url
          const tab = tabs[0]
          if (tab.id === chrome.tabs.TAB_ID_NONE)
            return

          openInMPV(tab.id, tab.url, {
            mode: options.iconActionOption,
            ...options,
          })
        })
      })

      return
    }

    chrome.browserAction.setPopup({ popup: "popup.html" })
  })
}
