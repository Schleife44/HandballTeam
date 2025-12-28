import { spielstand, speichereSpielstand } from './state.js';
import { timerAnzeige, sidebarTimer } from './dom.js';
import { formatiereZeit } from './utils.js';
import { updateSuspensionDisplay } from './ui.js';

let timerInterval;

export function updateTimer() {
    const aktuelleSegmentSekunden = (Date.now() - spielstand.timer.segmentStartZeit) / 1000;
    const totalSekunden = spielstand.timer.verstricheneSekundenBisher + aktuelleSegmentSekunden;

    const formattedTime = formatiereZeit(Math.max(0, Math.floor(totalSekunden)));
    timerAnzeige.textContent = formattedTime;
    if (sidebarTimer) sidebarTimer.textContent = formattedTime;

    if (totalSekunden < 0) {
        spielstand.timer.verstricheneSekundenBisher = 0;
        spielstand.timer.segmentStartZeit = Date.now();
    }

    if (!spielstand.timer.istPausiert) {
        // ... existing suspension logic ...
        let hasChanged = false;
        spielstand.activeSuspensions.forEach(s => {
            if (s.remaining > 0) {
                s.remaining--;
                hasChanged = true;
            }
        });
        const oldCount = spielstand.activeSuspensions.length;
        spielstand.activeSuspensions = spielstand.activeSuspensions.filter(s => s.remaining > 0);

        if (hasChanged || spielstand.activeSuspensions.length !== oldCount) {
            updateSuspensionDisplay();
        }
    }
}

export function startTimer() {
    if (spielstand.timer.istPausiert) {
        spielstand.timer.segmentStartZeit = Date.now();
        spielstand.timer.istPausiert = false;
    }

    // Safety: Clear existing interval to prevent double-speed if called multiple times
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(updateTimer, 1000);
    // Trigger immediate update so we don't wait 1s
    updateTimer();
}

export function stoppTimer() {
    if (spielstand.timer.istPausiert) return;
    clearInterval(timerInterval);
    const segmentSekunden = (Date.now() - spielstand.timer.segmentStartZeit) / 1000;
    spielstand.timer.verstricheneSekundenBisher += segmentSekunden;
    spielstand.timer.istPausiert = true;
}

export function handleZeitSprung(sekunden) {
    if (spielstand.timer.istPausiert) {
        spielstand.timer.verstricheneSekundenBisher += sekunden;
        if (spielstand.timer.verstricheneSekundenBisher < 0) {
            spielstand.timer.verstricheneSekundenBisher = 0;
        }
        const formattedTime = formatiereZeit(spielstand.timer.verstricheneSekundenBisher);
        timerAnzeige.textContent = formattedTime;
        if (sidebarTimer) sidebarTimer.textContent = formattedTime;
    } else {
        spielstand.timer.segmentStartZeit -= sekunden * 1000;
        updateTimer();
    }
    speichereSpielstand();
}
