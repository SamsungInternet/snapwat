let toolbars = document.getElementsByClassName('toolbar');
let pages = document.getElementsByClassName('page');
let prompts = document.getElementsByClassName('prompt');

/**
 * Thanks to: http://gorigins.com/posting-a-canvas-image-to-facebook-and-twitter/
 */
export function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  let ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], {type: 'image/png'});
}

function showOrHideElements(elements, pageRef, showStyle = 'block') {
  for (let i=0; i < elements.length; i++) {
    let el = elements[i];
    if (el.id.endsWith(`-${pageRef}`)) {
      el.style.display = showStyle;
    } else {
      el.style.display = 'none';
    }
  }
}

export function showPage(pageRef) {
  showOrHideElements(toolbars, pageRef, 'flex');
  showOrHideElements(pages, pageRef);
  showOrHideElements(prompts, pageRef);
}
