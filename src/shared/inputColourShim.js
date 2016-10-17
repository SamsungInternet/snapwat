/**
 * Show the colour input element if <input type="color"> is supported.
 * There does not appear to be a good polyfill for it right now.
 * (Not vanilla JS anyway. The recommended one from html5please.com is a JQuery plugin).
 * For now, browsers without support will just get a placeholder and be limited to black. 
 */
export default function() {

  let input = document.getElementById('input-colour');
  let substitute = document.getElementById('input-colour-substitute');
  
  // Unsupported browsers e.g. iOS Safari revert type to 'text'
  if (input.type === 'color') {
    input.style.display = 'block';
    substitute.style.display = 'none';
  }

}
