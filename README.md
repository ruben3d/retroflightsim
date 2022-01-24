# Retro Fligh Simulator

Quick and dirty attempt to replicate the visuals of late 80s / early 90s flight simulators, using as a reference MicroProse's F-117A Nighthawk Stealh Fighter 2.0 (1991).

## Screenshots

[<img src="doc/ss01.png" width="320" height="200" />](doc/ss01.png)
[<img src="doc/ss02.png" width="320" height="200" />](doc/ss02.png)
[<img src="doc/ss04.png" width="320" height="200" />](doc/ss04.png)
[<img src="doc/ss03.png" width="320" height="200" />](doc/ss03.png)

## Live demo

[https://ruben3d.github.io/retroflightsim/dist](https://ruben3d.github.io/retroflightsim/dist)

## How to build

You need node.js installed globally (I have been using 14.16.0).

```
$ cd retroflightsim
$ npm i
$ npm run build
```

## How to run

Start the local web server.

```
$ cd retroflightsim
$ npm run serve
```
Then open `localhost:8000` in your web browser (tested on Chrome/Linux).

## Instructions

Limited controls available:
* `W`/`S`: Pitch control.
* `A`/`D`: Roll control.
* `Q`/`E`: Yaw control.
* `N`: Toggle Day/Night.

On reaching the limits of the detailed scenario the player position wraps around.
