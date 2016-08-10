# snapwat

**Work in progress...**

sna*pwa*t is a doodling app for the web. It's a demo to showcase progressive web app capabilities such as service workers.

## Instructions

This demo is intended to be as lightweight as possible. However, it would be a shame to avoid
all modern tooling and lose out on the latest syntax and JS bundling. So, I'm using 
[Babel](https://babeljs.io/) to transpile the ES2015 syntax and [rollup](http://rollupjs.org) 
for module loading.

To transpile and combine the JavaScript:

```npm run build```

This simply runs `rollup -c > build/bundle.js`.

To run the app:

```npm start```

This simply runs `npm run build && python -m SimpleHTTPServer`.
