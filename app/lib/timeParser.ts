export const parseVoiceCommand = (transcript: string) => {
    const lowerText = transcript.toLowerCase();

    // 1. Default values
    let title = lowerText;
    let targetTime = new Date();
    let repeat = 'once'; // Default
    let hasTime = false;

    // 2. Detect Repetition
    if (lowerText.includes("every day") || lowerText.includes("daily") || lowerText.includes("everyday")) {
        repeat = 'daily';
    } else if (lowerText.includes("every week") || lowerText.includes("weekly") || lowerText.includes("everyweek")) {
        repeat = 'weekly';
    } else if (lowerText.includes("until i stop") || lowerText.includes("forever") || lowerText.includes("indefinitely") || lowerText.includes("always")) {
        // New Indefinite Repeat Option
        repeat = 'indefinite'; 
    }


    // 3. Regex to find time (Matches "at 5", "at 5pm", "at 5 p.m.")
    const timeRegex = /at\s+(\d{1,2})(:(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i;
    const match = lowerText.match(timeRegex);

    if (match) {
        hasTime = true;
        const fullMatch = match[0];
        const hour = parseInt(match[1]);
        const minute = match[3] ? parseInt(match[3]) : 0;
        const period = match[4] ? match[4].replace(/\./g, "") : undefined;

        // Time Logic (12h to 24h)
        let finalHour = hour;
        if (period === "pm" && hour < 12) finalHour += 12;
        if (period === "am" && hour === 12) finalHour = 0;

        // Smart PM Guessing
        if (!period) {
            const currentHour = new Date().getHours();
            if (hour < 12 && hour <= currentHour) finalHour += 12;
        }

        targetTime.setHours(finalHour, minute, 0, 0);

        // If time is past, move to tomorrow
        if (targetTime < new Date()) {
            targetTime.setDate(targetTime.getDate() + 1);
        }

        // 4. Clean Up Title
        const repeatKeywords = /(every day|daily|every week|weekly|everyday|everyweek|until i stop|forever|indefinitely|always)/gi;
        
        title = lowerText
            .replace(fullMatch, "") // Remove time
            .replace(repeatKeywords, "") // Remove repeat keywords
            .replace(/^remind me to\s*/i, "")
            .replace(/^remind me\s*/i, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    // Capitalize Title
    title = title.charAt(0).toUpperCase() + title.slice(1);

    return { title, date: targetTime, repeat, hasTime };
};