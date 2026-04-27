
export function parseICS(icsData) {
    const events = [];
    const lines = icsData.split(/\r\n|\n|\r/);

    let currentEvent = null;

    lines.forEach(line => {
        // Handle folding: Lines starting with space are continuations (simplified)
        // Ideally we unfold first, but for simple VEVENT parsing line-by-line often suffices if we trim.
        // But for robust parsing, let's just inspect meaningful lines.

        if (line.startsWith('BEGIN:VEVENT')) {
            currentEvent = {};
        } else if (line.startsWith('END:VEVENT')) {
            if (currentEvent) {
                processEvent(currentEvent, events);
                currentEvent = null;
            }
        } else if (currentEvent) {
            const parts = line.split(':');
            if (parts.length >= 2) {
                const keyPart = parts[0];
                const value = parts.slice(1).join(':'); // join back if value has colons (like time 15:30)

                // Extract property name (ignore params for now, e.g. DTSTART;TZID=...)
                const prop = keyPart.split(';')[0];

                // Store raw value
                currentEvent[prop] = value;
            }
        }
    });

    return events;
}

function processEvent(raw, eventsList) {
    /* 
       Mapping:
       DTSTART: 20250906T153000 -> date: 2025-09-06, time: 15:30
       SUMMARY -> title
       LOCATION -> location
    */

    try {
        let dtStart = raw['DTSTART'];
        let location = raw['LOCATION'] || '';
        let summary = raw['SUMMARY'] || 'Termin';

        // Clean up escaped commas/chars in text
        summary = unescapeICS(summary);
        location = unescapeICS(location);

        if (!dtStart) return;

        // Parse Date/Time (YYYYMMDDTHHMMSS)
        // Assume TZ is handled roughly or input is local/UTC.
        // Given snippet: DTSTART;TZID=Europe/Berlin:20250906T153000
        // We see raw value is 20250906T153000

        const year = dtStart.substring(0, 4);
        const month = dtStart.substring(4, 6);
        const day = dtStart.substring(6, 8);

        let time = '';
        if (dtStart.includes('T')) {
            const timePart = dtStart.split('T')[1];
            const hh = timePart.substring(0, 2);
            const mm = timePart.substring(2, 4);
            time = `${hh}:${mm}`;
        }

        const dateStr = `${year}-${month}-${day}`;

        // Determine type based on Summary keywords? Default to 'game' if " vs " or "-" in title?
        // Or just 'game' for external imports usually.
        let type = 'training';
        if (summary.includes(' - ') || summary.toLowerCase().includes('spiel')) {
            type = 'game';
        }

        const newEvent = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            type: type,
            title: summary,
            date: dateStr,
            time: time,
            location: location,
            isRecurring: false // Imported singular events
        };

        eventsList.push(newEvent);

    } catch (e) {
        console.warn("Failed to parse event", e);
    }
}

function unescapeICS(str) {
    if (!str) return '';
    return str.replace(/\\,/g, ',').replace(/\\n/g, ' ').replace(/\\/g, '');
}
