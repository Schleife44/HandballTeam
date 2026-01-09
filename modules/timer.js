import { spielstand, speichereSpielstand } from './state.js';
import { timerAnzeige, sidebarTimer } from './dom.js';
import { formatiereZeit } from './utils.js';
import { updateSuspensionDisplay, zeichneSpielerRaster } from './ui.js';

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
        // Calculate precise second change to avoid drift
        const currentSeconds = Math.floor(totalSekunden);
        const previousSeconds = Math.floor(spielstand.timer.verstricheneSekundenBisher);
        // Note: verstricheneSekundenBisher is not updated yet in the loop above (it's only read-only there usually, wait... let's check)
        // wait, line 10: totalSekunden = spielstand.timer.verstricheneSekundenBisher + aktuelleSegmentSekunden;
        // verstricheneSekundenBisher is constant during the segment.

        // Better approach: We need to know if we crossed a second boundary since the last tick.
        // But we don't store "last tick time" persistently.

        // Alternative: Track "lastPlayerUpdateSeconds" in timer state.
        if (typeof spielstand.timer.lastPlayerUpdateSeconds === 'undefined') {
            spielstand.timer.lastPlayerUpdateSeconds = Math.floor(totalSekunden);
        }

        const delta = currentSeconds - spielstand.timer.lastPlayerUpdateSeconds;

        if (delta > 0) {
            spielstand.timer.lastPlayerUpdateSeconds = currentSeconds;

            // ... suspensions logic ...
            let hasChanged = false;
            spielstand.activeSuspensions.forEach(s => {
                if (s.remaining > 0) {
                    s.remaining -= delta; // Subtract actual delta
                    if (s.remaining < 0) s.remaining = 0;
                    hasChanged = true;
                }
            });
            const oldCount = spielstand.activeSuspensions.length;
            spielstand.activeSuspensions = spielstand.activeSuspensions.filter(s => s.remaining > 0);

            if (hasChanged || spielstand.activeSuspensions.length !== oldCount) {
                updateSuspensionDisplay();
            }

            // --- NEW: Track Active Player Time ---
            const trackAndDisplay = (players, teamKey) => {
                players.forEach(p => {
                    const hasSlot = p.lineupSlot !== null && p.lineupSlot !== undefined;
                    if (hasSlot) {
                        const isSuspended = spielstand.activeSuspensions.some(
                            s => s.teamKey === teamKey && s.number === p.number
                        );
                        if (!isSuspended) {
                            p.timeOnField = (p.timeOnField || 0) + delta; // Add precise delta

                            // Direct DOM Update
                            const timeEl = document.getElementById(`time-display-${teamKey}-${p.number}`);
                            if (timeEl) {
                                const m = Math.floor(p.timeOnField / 60);
                                const s = p.timeOnField % 60;
                                timeEl.textContent = `${m}:${s < 10 ? '0' + s : s}`;
                            }
                        }
                    }
                });
            };

            if (spielstand.roster) trackAndDisplay(spielstand.roster, 'myteam');
            if (spielstand.knownOpponents) trackAndDisplay(spielstand.knownOpponents, 'opponent');
        }
    }
}

export function startTimer() {
    if (spielstand.timer.istPausiert) {
        spielstand.timer.segmentStartZeit = Date.now();
        spielstand.timer.istPausiert = false;
        // Initialize synchronization for player timer ONLY when resuming/starting
        spielstand.timer.lastPlayerUpdateSeconds = Math.floor(spielstand.timer.verstricheneSekundenBisher);
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

// === VIDEO TIMER (Continuous for Video Analysis) ===

export function startVideoTimer() {
    if (spielstand.timer.videoStartTime) {
        return;
    }

    spielstand.timer.videoStartTime = Date.now();
}

export function stopVideoTimer() {
    if (!spielstand.timer.videoStartTime) {
        return;
    }

    spielstand.timer.videoStartTime = null;
}

export function getVideoTimeSeconds() {
    if (!spielstand.timer.videoStartTime) return 0;

    const elapsedMs = Date.now() - spielstand.timer.videoStartTime;
    return Math.floor(elapsedMs / 1000);
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
