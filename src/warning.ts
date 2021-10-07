export const showDevtoolsWarning = () => {
  const el = document.createElement('div')
  el.className = 'iteria-ignore'
  el.id = 'devtools-warning'
  el.style.position = 'absolute'
  el.style.zIndex = '100000'
  el.style.width = '100%'
  el.style.height = '10%'
  el.style.backgroundColor = '#ff9800'
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
      <svg style="height: 0.875em; padding-top: 2px; padding-right: 2px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!-- Font Awesome Free 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) --><path d="M569.517 440.013C587.975 472.007 564.806 512 527.94 512H48.054c-36.937 0-59.999-40.055-41.577-71.987L246.423 23.985c18.467-32.009 64.72-31.951 83.154 0l239.94 416.028zM288 354c-25.405 0-46 20.595-46 46s20.595 46 46 46 46-20.595 46-46-20.595-46-46-46zm-43.673-165.346l7.418 136c.347 6.364 5.609 11.346 11.982 11.346h48.546c6.373 0 11.635-4.982 11.982-11.346l7.418-136c.375-6.874-5.098-12.654-11.982-12.654h-63.383c-6.884 0-12.356 5.78-11.981 12.654z"/></svg>
        Warning:</span
      >
      We detected that you are using React devtools browser extension. Either disable this
      extension, or don't mess with Google Chrome console(F12) otherwise the
      application could stop working.
    </div>
    <div onclick='document.getElementById("devtools-warning").remove()'>
    <svg style="cursor:pointer; height:1.33em;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 352 512"><!-- Font Awesome Free 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) --><path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"/></svg>
    </div>
  </div>
  `
