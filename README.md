# snapwat?

**Work in progress...**

[sna**pwa**t](https://snapw.at) is a demo to showcase progressive web app capabilities.

The idea of the app is to let you doodle and add emojis etc. on top of photos and videos.
Right now you can just snap annotated stills from your camera view. Choosing a photo from your 
gallery should be coming soon and recording videos may come later...

<img src="docs/snapwat.png?raw=true" alt="First version" width="300px"/>


## How to use it

Choose a colour using the colour picker in the corner and start drawing over the camera view.

When you have a moment that you want to snap, press the download ↓ button.

Unfortunately it doesn't seem possible right now to download the generated file automatically 
across mobile browsers. I'm about to write up a blog post on this. So for now it will open 
up your snapwat (that's the noun for a snapwat snapshot!) in a new tab/window. 

Tap and hold / right-click and choose the Save As / Download option to save to your device.

From there, be sure to share your beautiful creation with the world, hashtag snapwat! 


## Browser Support

So far I have tested it in:

* Samsung Internet for Android (obvs, [that's where I work](https://medium.com/samsung-internet-dev/about)!)
* Chrome for Android
* Chrome desktop

If you have any problems with $your_browser, please create an Issue (or even better, a PR).


## Tech

This demo is intended to be as lightweight as possible. However, it would be a shame to avoid
all modern tooling and lose out on the latest syntax and JS bundling. So, I'm using 
[Babel](https://babeljs.io/) to transpile the ES2015 syntax and [rollup](http://rollupjs.org) 
for module loading.

The [WebRTC adapter](https://github.com/webrtc/adapter) is used to polyfill the latest 
MediaDevices promise-based API.

It uses [Web Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest) to enable home screen 
installation and a [service worker](https://developers.google.com/web/fundamentals/primers/service-worker/) 
for offline use. Yes, you can take a snapwat on an airplane!


## Local development

As usual, the best place to begin is:

```npm install```

Then to transpile and combine the JavaScript:

```npm run build```

(This just runs `rollup -c > build/bundle.js`).

To run the app, you can use any static web server. I just use `python -m SimpleHTTPServer`.

To watch for changes (in a separate terminal):

```npm run watch```

(This just uses `watch` to rebuild the JS when a change is detected in the src directory).


## Snapwat the name

Snapwat is called Snapwat because it's a snapshot with "pwa" in it - for Progressive Web App. 
Also, it's abbreviated to SW, like Service Workers. Good eh? 

It's pronounced "snap what?" to rhyme with snapshot.


## Feedback or questions

Please [tweet me](https://twitter.com/poshaughnessy) or email: peter dot oshaughnessy at gmail dot com.


## Credits

Emoji provided free by [EmojiOne](http://emojione.com/).

Icons by [Iconic](https://useiconic.com/).
