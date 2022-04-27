# Retro Flight Simulator

Quick and dirty attempt to replicate the visuals of late 80s / early 90s flight simulators, using as a reference MicroProse's F-117A Nighthawk Stealth Fighter 2.0 (1991).

## Live demo

[https://ruben3d.github.io/retroflightsim/dist](https://ruben3d.github.io/retroflightsim/dist)

## Screenshots

[<img src="doc/ss08.png" width="320" height="200" />](doc/ss08.png)
[<img src="doc/ss07.png" width="320" height="200" />](doc/ss07.png)
[<img src="doc/ss05.png" width="320" height="200" />](doc/ss05.png)
[<img src="doc/ss09.png" width="320" height="200" />](doc/ss09.png)

## How to build

You need node.js installed globally (I have been using 14.16.0).

```
$ cd retroflightsim
$ npm i
$ npm run build
```

## How to run

Start the local web server:

```
$ cd retroflightsim
$ npm run serve
```
Then open `localhost:8000` in your web browser (tested on Chrome/Linux).

## Instructions

### Plane controls

#### Keyboard

Use the OSD settings to select the keyboard layout.

QWERTY (default):
* `W`/`S`: Pitch
* `A`/`D`: Roll
* `Q`/`E`: Yaw
* `Z`/`X`: Throttle

AZERTY:
* `Z`/`S`: Pitch
* `Q`/`D`: Roll
* `A`/`E`: Yaw
* `W`/`X`: Throttle

Dvorak:
* `,`/`O`: Pitch
* `A`/`E`: Roll
* `'`/`.`: Yaw
* `Q`/`J`: Throttle

#### Joystick

The system supports a single device connected only. If the device has less than four axes the keyboard can be used to complement the missing controls. Joystick information displayed in the OSD help.

* `Axis 1`: Pitch
* `Axis 0`: Roll
* `Axis 3`: Yaw
* `Axis 2`: Throttle

### Systems
* `T`: Select target

### Views
* `N`: Day/Night
* `1`: Cockpit
* `2`: Exterior follow
* `3`: Exterior left/right
* `4`: To/from target

On reaching the limits of the detailed scenario the player position wraps around.
