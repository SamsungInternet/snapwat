export default function() {

  if ('serviceWorker' in navigator) {

    navigator.serviceWorker.register('/build/sw.js')
      .then(() => {
        console.log('Service worker successfully registered');
      })
      .catch((err) => {
        console.error('Service worker failed to register', err);
      });

  } else {
    console.log('Service workers not supported');
  }

}
