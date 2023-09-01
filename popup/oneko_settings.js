const buttonEverywhere = document.querySelector("button#everywhere");
const buttonSite = document.querySelector("button#site");
const storage = browser.storage.local;
const SRC_ON = "oneko_wake.png";
const SRC_OFF = "oneko_sleep.png";

browser.tabs.query({
  active: true,
  currentWindow: true
}, (tabs) => {
  let url = tabs[0].url;
  url = url.substring(url.indexOf("://") + 3, url.indexOf("/", 8));
  buttonSite.innerHTML = url+" <img>"
  function updateButtons() {
    storage.get({
      everywhere: true,
      [url]: true
    }).then((visibility) => {
      if (visibility.everywhere) {
        buttonEverywhere.children[0].setAttribute("src", SRC_ON);
        buttonEverywhere.setAttribute("current", true);
      } else {
        buttonEverywhere.children[0].setAttribute("src", SRC_OFF);
        buttonEverywhere.setAttribute("current", false);
      }
      if (visibility[url]) {
        buttonSite.children[0].setAttribute("src", SRC_ON);
        buttonSite.setAttribute("current", true);
      } else {
        buttonSite.children[0].setAttribute("src", SRC_OFF);
        buttonSite.setAttribute("current", false);
      }
    })
  }

  storage.onChanged.addListener(updateButtons);
  updateButtons();

  buttonEverywhere.addEventListener("click", (e) => {
    storage.set({ everywhere: !(buttonEverywhere.getAttribute("current")==="true")});
  });

  buttonSite.addEventListener("click", (e) => {
    // Add key if if we are hiding for a page, remove it if not to save space
    const shouldShow = !(buttonSite.getAttribute("current")==="true");
    if (shouldShow == false) {
      storage.set({ [url]: false });
    } else {
      storage.remove(url);
    }
  });
});