const DEFAULT_POPUP_SHOW_TIME = 5000;

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

function hideExceptMatchingId(elements, id, showStyle = 'block') {
  for (let i=0; i < elements.length; i++) {
    let el = elements[i];
    if (el.id === id) {
      el.style.display = showStyle;
    } else {
      el.style.display = 'none';
    }
  }
}

function hide(elements) {
  for (let i=0; i < elements.length; i++) {
    elements[i].style.display = 'none';
  }
}

function updateToolbarVisibility(pageRef) {
  hide(toolbars);
  let toolbar = document.getElementById(`toolbar-${pageRef}`);
  if (toolbar) {
    toolbar.style.display = 'flex';
  }
}

function updatePageVisibility(pageRef) {
  hide(pages);
  let page = document.getElementById(`page-${pageRef}`);
  if (page) {
    page.style.display = 'block';
  }  
}

export function showPrompt(ref) {
  
  hide(prompts);
  
  let prompt = document.getElementById(`prompt-${ref}`);

  if (prompt) {
    prompt.classList.remove('fade-out');
    prompt.style.display = 'block';

    setTimeout(() => {
      prompt.classList.add('fade-out');
    }, DEFAULT_POPUP_SHOW_TIME); 
  }

}

export function showPage(pageRef) {
  updateToolbarVisibility(pageRef);
  updatePageVisibility(pageRef);
  showPrompt(pageRef);
}
