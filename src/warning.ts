export const showDevtoolsWarning = () => {
  const el = document.createElement("div")
  el.className = "iteria-ignore"
  el.id = "devtools-warning"
  el.style.position = "absolute"
  el.style.zIndex = "100000"
  el.style.width = "100%"
  el.style.height = "10%"
  el.style.backgroundColor = "#ff9800"
  el.innerHTML = innerHtml
  document.body.prepend(el)
}

const innerHtml = `
  <div
    style="
      position: relative;
      padding-left: 5%;
      padding-right: 5%;
      display: flex;
      align-items: center;
      height: 100%;
      overflow: scroll;
      line-height: 1.2;
    "
  >
    <div>
      <span style="font-weight: bold">
        <i class="fas fa-exclamation-triangle"></i>
        Warning:</span
      >
      We detected that you are using React devtools browser extension. Either disable this
      extension, or don't mess with Google Chrome console(F12) otherwise the
      application could stop working.
    </div>
    <div onclick='document.getElementById("devtools-warning").remove()'>
      <i style="cursor: pointer" class="fas fa-times fa-lg"></i>
    </div>
  </div>
  `
