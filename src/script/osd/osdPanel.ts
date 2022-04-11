import { KeyboardControlAction, KeyboardControlDevice, KeyboardControlLayoutId, KeyboardControlLayouts } from "../input/devices/keyboardControlDevice";
import { assertIsDefined } from "../utils/asserts";


export function setupOSD(input: KeyboardControlDevice) {
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

    const qwertyLayout = document.getElementById('layout-qwerty');
    assertIsDefined(qwertyLayout);
    const azertyLayout = document.getElementById('layout-azerty');
    assertIsDefined(azertyLayout);
    const dvorakLayout = document.getElementById('layout-dvorak');
    assertIsDefined(dvorakLayout);

    qwertyLayout.addEventListener('change', () => {
        input.setKeyboardLayout(KeyboardControlLayoutId.QWERTY);
        updateControlsHelp(KeyboardControlLayoutId.QWERTY);
    });
    azertyLayout.addEventListener('change', () => {
        input.setKeyboardLayout(KeyboardControlLayoutId.AZERTY);
        updateControlsHelp(KeyboardControlLayoutId.AZERTY);
    });
    dvorakLayout.addEventListener('change', () => {
        input.setKeyboardLayout(KeyboardControlLayoutId.DVORAK);
        updateControlsHelp(KeyboardControlLayoutId.DVORAK);
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
