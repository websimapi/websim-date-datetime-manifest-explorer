// AI-powered date parsing and formatting
class AIDateParser {
    constructor(manifest) {
        this.manifest = manifest;
        this.conversationHistory = [];
    }

    async parseTextDate(inputText, requestedFormat = 'ISO') {
        const systemPrompt = `You are a date parsing expert. Given the date manifest context and user input, extract and format dates accordingly.

Date Manifest Context:
${JSON.stringify(this.manifest, null, 2)}

Parse the user's input and return a JSON response with this schema:
{
    "success": boolean,
    "parsedDate": string (ISO format if found),
    "originalFormat": string (description of detected format),
    "requestedFormat": string (formatted as requested),
    "confidence": number (0-1),
    "error": string (if any)
}

If multiple dates are found, return an array of such objects.`;

        try {
            const completion = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Parse this date input and format as ${requestedFormat}: "${inputText}"` }
                ],
                json: true
            });

            return JSON.parse(completion.content);
        } catch (error) {
            return {
                success: false,
                error: error.message,
                confidence: 0
            };
        }
    }

    async parseImageDate(imageDataUrl, requestedFormat = 'ISO') {
        const systemPrompt = `You are a date extraction expert. Analyze images to find and extract date information.

Date Manifest Context:
${JSON.stringify(this.manifest.standardFormats, null, 2)}

Extract any dates, times, or temporal information from the image and return JSON:
{
    "success": boolean,
    "foundDates": [
        {
            "text": string (raw text found),
            "parsedDate": string (ISO format),
            "confidence": number (0-1),
            "location": string (description of where found),
            "requestedFormat": string (formatted as requested)
        }
    ],
    "error": string (if any)
}`;

        try {
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: `Extract and format dates from this image as ${requestedFormat}:`
                            },
                            {
                                type: "image_url",
                                image_url: { url: imageDataUrl }
                            }
                        ]
                    }
                ],
                json: true
            });

            return JSON.parse(completion.content);
        } catch (error) {
            return {
                success: false,
                foundDates: [],
                error: error.message
            };
        }
    }

    async convertDateFormat(dateString, fromFormat, toFormat) {
        const systemPrompt = `You are a date format conversion expert. Convert dates between different formats using the provided manifest.

Available formats from manifest:
${JSON.stringify(this.manifest.standardFormats, null, 2)}

Return JSON:
{
    "success": boolean,
    "originalDate": string,
    "convertedDate": string,
    "fromFormat": string,
    "toFormat": string,
    "error": string (if any)
}`;

        try {
            const completion = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { 
                        role: "user", 
                        content: `Convert "${dateString}" from ${fromFormat} format to ${toFormat} format` 
                    }
                ],
                json: true
            });

            return JSON.parse(completion.content);
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    async suggestFormats(inputDate) {
        const systemPrompt = `Based on the date manifest, suggest the best formats for displaying this date in different contexts.

Manifest formats:
${JSON.stringify(this.manifest.standardFormats, null, 2)}

Return JSON:
{
    "inputDate": string,
    "suggestions": [
        {
            "format": string,
            "example": string,
            "useCase": string,
            "locale": string (if applicable)
        }
    ]
}`;

        try {
            const completion = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Suggest optimal formats for this date: "${inputDate}"` }
                ],
                json: true
            });

            return JSON.parse(completion.content);
        } catch (error) {
            return {
                suggestions: [],
                error: error.message
            };
        }
    }
}

// Export for use in other files
window.AIDateParser = AIDateParser;