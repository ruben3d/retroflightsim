import { ConfigService } from "../config/configService";
import { JoystickControlDevice } from "../input/devices/joystickControlDevice";
import { KeyboardControlAction, KeyboardControlDevice, KeyboardControlLayoutId, KeyboardControlLayouts } from "../input/devices/keyboardControlDevice";
import { FlightModels, TechProfiles } from "../state/gameDefs";
import { assertIsDefined } from "../utils/asserts";


export function setupOSD(config: ConfigService, keyboardInput: KeyboardControlDevice, joystickInput: JoystickControlDevice) {
    setupButtons();
    setupGenerationOptions(config);
    setupFlightModel(config);
    setupKeyboardHelp(keyboardInput);
    setupJoystickHelp(joystickInput);
}

function setupButtons() {
    const helpButton = document.getElementById('help-button');
    assertIsDefined(helpButton);
    const settingsButton = document.getElementById('settings-button');
    assertIsDefined(settingsButton);
    const helpSection = document.getElementById('help');
    assertIsDefined(helpSection);
    const settingsSection = document.getElementById('settings');
    assertIsDefined(settingsSection);
    const panel = document.getElementById('panel');
    assertIsDefined(panel);

    helpButton.addEventListener('click', () => {
        if (helpButton.classList.contains('active')) {
            panel.classList.remove('open');
            helpButton.classList.remove('active');
        } else {
            panel.classList.add('open');
            helpButton.classList.add('active');
            helpSection.classList.add('active');
            settingsButton.classList.remove('active');
            settingsSection.classList.remove('active');
        }
    });

    settingsButton.addEventListener('click', () => {
        if (settingsButton.classList.contains('active')) {
            panel.classList.remove('open');
            settingsButton.classList.remove('active');
        } else {
            panel.classList.add('open');
            settingsButton.classList.add('active');
            settingsSection.classList.add('active');
            helpButton.classList.remove('active');
            helpSection.classList.remove('active');
        }
    });
}

function setupGenerationOptions(config: ConfigService) {
    const genCGA = document.getElementById('gen-cga');
    assertIsDefined(genCGA);
    const genEGA = document.getElementById('gen-ega');
    assertIsDefined(genEGA);
    const genVGA = document.getElementById('gen-vga');
    assertIsDefined(genVGA);
    const genSVGA = document.getElementById('gen-svga');
    assertIsDefined(genSVGA);

    genCGA.addEventListener('change', () => {
        config.techProfiles.setActive(TechProfiles.CGA);
    });
    genEGA.addEventListener('change', () => {
        config.techProfiles.setActive(TechProfiles.EGA);
    });
    genVGA.addEventListener('change', () => {
        config.techProfiles.setActive(TechProfiles.VGA);
    });
    genSVGA.addEventListener('change', () => {
        config.techProfiles.setActive(TechProfiles.SVGA);
    });
}

function setupFlightModel(config: ConfigService) {
    const debugFlightModel = document.getElementById('flightmodel-debug');
    assertIsDefined(debugFlightModel);
    const arcadeFlightModel = document.getElementById('flightmodel-arcade');
    assertIsDefined(arcadeFlightModel);
    const realisticFlightModel = document.getElementById('flightmodel-realistic');
    assertIsDefined(realisticFlightModel);

    debugFlightModel.addEventListener('change', () => {
        config.flightModels.setActive(FlightModels.DEBUG);
    });
    arcadeFlightModel.addEventListener('change', () => {
        config.flightModels.setActive(FlightModels.ARCADE);
    });
    realisticFlightModel.addEventListener('change', () => {
        config.flightModels.setActive(FlightModels.REALISTIC);
    });
}

function setupKeyboardHelp(keyboardInput: KeyboardControlDevice) {
    const qwertyLayout = document.getElementById('layout-qwerty');
    assertIsDefined(qwertyLayout);
    const azertyLayout = document.getElementById('layout-azerty');
    assertIsDefined(azertyLayout);
    const dvorakLayout = document.getElementById('layout-dvorak');
    assertIsDefined(dvorakLayout);

    qwertyLayout.addEventListener('change', () => {
        keyboardInput.setKeyboardLayout(KeyboardControlLayoutId.QWERTY);
        updateControlsHelp(KeyboardControlLayoutId.QWERTY);
    });
    azertyLayout.addEventListener('change', () => {
        keyboardInput.setKeyboardLayout(KeyboardControlLayoutId.AZERTY);
        updateControlsHelp(KeyboardControlLayoutId.AZERTY);
    });
    dvorakLayout.addEventListener('change', () => {
        keyboardInput.setKeyboardLayout(KeyboardControlLayoutId.DVORAK);
        updateControlsHelp(KeyboardControlLayoutId.DVORAK);
    });
}

function setupJoystickHelp(joystickInput: JoystickControlDevice) {
    joystickInput.setListener(connected => {
        if (connected) {
            updateJoystickHelp(joystickInput.getDeviceId(), joystickInput.getAxisCount());
        } else {
            disableJoystickHelp();
        }
    });
}

function updateControlsHelp(layoutId: KeyboardControlLayoutId) {
    const pitchPos = document.getElementById('key-pitch-pos');
    assertIsDefined(pitchPos);
    const pitchNeg = document.getElementById('key-pitch-neg');
    assertIsDefined(pitchNeg);
    const rollPos = document.getElementById('key-roll-pos');
    assertIsDefined(rollPos);
    const rollNeg = document.getElementById('key-roll-neg');
    assertIsDefined(rollNeg);
    const yawPos = document.getElementById('key-yaw-pos');
    assertIsDefined(yawPos);
    const yawNeg = document.getElementById('key-yaw-neg');
    assertIsDefined(yawNeg);
    const throttlePos = document.getElementById('key-throttle-pos');
    assertIsDefined(throttlePos);
    const throttleNeg = document.getElementById('key-throttle-neg');
    assertIsDefined(throttleNeg);

    const layout = KeyboardControlLayouts.get(layoutId);
    assertIsDefined(layout);

    pitchPos.innerText = layout[KeyboardControlAction.PITCH_POS].toUpperCase();
    pitchNeg.innerText = layout[KeyboardControlAction.PITCH_NEG].toUpperCase();
    rollPos.innerText = layout[KeyboardControlAction.ROLL_POS].toUpperCase();
    rollNeg.innerText = layout[KeyboardControlAction.ROLL_NEG].toUpperCase();
    yawPos.innerText = layout[KeyboardControlAction.YAW_POS].toUpperCase();
    yawNeg.innerText = layout[KeyboardControlAction.YAW_NEG].toUpperCase();
    throttlePos.innerText = layout[KeyboardControlAction.THROTTLE_POS].toUpperCase();
    throttleNeg.innerText = layout[KeyboardControlAction.THROTTLE_NEG].toUpperCase();
}

function updateJoystickHelp(id: string, axisCount: number) {
    const joystick = document.getElementById('joystick');
    assertIsDefined(joystick);
    const joystickId = document.getElementById('joystick-id');
    assertIsDefined(joystickId);
    const axisPitch = document.getElementById('axis-pitch');
    assertIsDefined(axisPitch);
    const axisRoll = document.getElementById('axis-roll');
    assertIsDefined(axisRoll);
    const axisYaw = document.getElementById('axis-yaw');
    assertIsDefined(axisYaw);
    const axisThrottle = document.getElementById('axis-throttle');
    assertIsDefined(axisThrottle);

    joystick.classList.remove('hidden');
    const lastBracketIndex = id.lastIndexOf('(');
    joystickId.innerText = id.substring(0, lastBracketIndex !== -1 ? lastBracketIndex - 1 : undefined);

    if (axisCount < 4) {
        axisYaw.classList.add('hidden');
    } else {
        axisYaw.classList.remove('hidden');
    }
    if (axisCount < 3) {
        axisThrottle.classList.add('hidden');
    } else {
        axisThrottle.classList.remove('hidden');
    }
    if (axisCount < 2) {
        axisPitch.classList.add('hidden');
    } else {
        axisPitch.classList.remove('hidden');
    }
    if (axisCount < 1) {
        axisRoll.classList.add('hidden');
    } else {
        axisRoll.classList.remove('hidden');
    }
}

function disableJoystickHelp() {
    const joystick = document.getElementById('joystick');
    assertIsDefined(joystick);
    const joystickId = document.getElementById('joystick-id');
    assertIsDefined(joystickId);

    joystick.classList.add('hidden');
    joystickId.innerText = 'No device detected';
}