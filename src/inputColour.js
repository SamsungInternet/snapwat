/**
 * There does not appear to be a good polyfill for <input type="color"> right now. 
 * (Not vanilla JS anyway. The recommended one from html5please.com is a JQuery plugin).
 * For now, browsers without support will just get a placeholder and be limited to black.
 */
function initInputColourIfSupported() {
  
  let input = document.createElement('input');
  input.id = 'input-colour';
  input.type = 'color';

  // Unsupported browsers e.g. iOS Safari revert type to 'text'
  if (input.type === 'color') {

    let container = document.getElementById('input-colour-container');

    // Replace the substitute
    container.innerHTML = '';
    container.appendChild( input );

  }

}

export default function() {
  initInputColourIfSupported();
}
