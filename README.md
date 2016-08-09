# pwaint

**Work in progress...**

*pwa*int is a doodling app for the web. It's a demo to showcase progressive web app capabilities such as service workers.

## Instructions

This demo is intended to be as lightweight as possible. However, it would be a shame to avoid
all modern tooling and lose out on the latest syntax and JS bundling. So, the only (direct)
dependency is [Babel](https://babeljs.io/) and its `es2015` preset.

To transpile and combine the JavaScript:

```npm run build```

This simply runs `babel src --out-file build/bundle.js`.

To run the app:

```npm start```

This simply runs `python -m SimpleHTTPServer`.
