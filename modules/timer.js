import { spielstand, speichereSpielstand } from './state.js';
import { timerAnzeige } from './dom.js';
import { formatiereZeit } from './utils.js';
import { updateSuspensionDisplay } from './ui.js';

let timerInterval;

export function updateTimer() {
    const aktuelleSegmentSekunden = (Date.now() - spielstand.timer.segmentStartZeit) / 1000;
    const totalSekunden = spielstand.timer.verstricheneSekundenBisher + aktuelleSegmentSekunden;

    if (totalSekunden < 0) {
        spielstand.timer.verstricheneSekundenBisher = 0;
        spielstand.timer.segmentStartZeit = Date.now();
        timerAnzeige.textContent = formatiereZeit(0);
    } else {
        timerAnzeige.textContent = formatiereZeit(Math.floor(totalSekunden));
    }

    if (!spielstand.timer.istPausiert) {
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
    spielstand.timer.segmentStartZeit = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
    spielstand.timer.istPausiert = false;
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
        timerAnzeige.textContent = formatiereZeit(spielstand.timer.verstricheneSekundenBisher);
    } else {
        spielstand.timer.segmentStartZeit -= sekunden * 1000;
        updateTimer();
    }
    speichereSpielstand();
}
