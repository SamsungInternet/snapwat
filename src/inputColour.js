function initInputColourIfSupported() {
  
  let input = document.createElement('input');
  input.id = 'input-colour';
  input.type = 'color';

  console.log('input', input, input.type, input.value);

  // Temporary Safari test
  alert(input.type + ' ... ' + input.value);

  let container = document.getElementById('input-colour-container');

  // Replace the substitute
  container.innerHTML = '';
  container.appendChild( input );

}

export default function() {
  initInputColourIfSupported();
}
