/**
 * Thanks to: http://www.quirksmode.org/dom/inputfile.html
 */
export default function initFileUploads() {
	
  let fakeFileUpload = document.createElement('div');
	fakeFileUpload.className = 'fakefile';
	fakeFileUpload.appendChild(document.createElement('input'));
	
  let button = document.createElement('button');
  button.className = 'btn-file-select';
  button.innerText = 'Select';
	fakeFileUpload.appendChild(button);
	
  let formInputs = document.querySelectorAll('input[type=file]');
	
  for( let input of formInputs) {
    input.style.visibility = 'hidden';
    let clone = fakeFileUpload.cloneNode(true);
    input.parentNode.appendChild(clone);
    input.relatedElement = clone.getElementsByTagName('input')[0];
		input.onchange = input.onmouseout = function () {
			this.relatedElement.value = this.value;
		}
  }  
}
