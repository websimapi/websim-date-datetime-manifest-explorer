// AI-powered date parsing and formatting
class AIDateParser {
    constructor(manifest) {
        this.manifest = manifest;
        this.conversationHistory = [];
    }

    async parseTextDate(inputText, requestedFormat = 'ISO') {
        const systemPrompt = `You are an advanced date parsing expert with access to historical knowledge and creative reasoning abilities. You can parse ANY date expression, no matter how complex or unconventional.

Date Manifest Context:
${JSON.stringify(this.manifest, null, 2)}

Your capabilities include:
- Historical dates (e.g., "when Jesus died" = approximately April 3, 33 AD)
- Relative calculations (e.g., "87 days after", "3 weeks before")  
- Natural language (e.g., "tomorrow", "next Friday", "last Christmas")
- Creative expressions (e.g., "the day the Berlin Wall fell", "when man first walked on the moon")
- Complex calculations combining multiple concepts

Use your knowledge and reasoning to interpret the input. If you can reasonably determine what date is being referenced, parse it. Only fail if the input is truly nonsensical or impossible to interpret.

For historical events, use your best knowledge of approximate dates. For future relative dates, calculate from today's date.

Return a JSON response with this schema:
{
    "success": boolean,
    "parsedDate": string (ISO format if found),
    "originalFormat": string (description of how you interpreted it),
    "requestedFormat": string (formatted as requested),
    "confidence": number (0-1),
    "reasoning": string (explain your interpretation process),
    "error": string (if any)
}

Current date for reference: ${new Date().toISOString()}

Be creative and use your full reasoning capabilities. Don't give up easily!`;

        try {
            const completion = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Parse this date input creatively and format as ${requestedFormat}: "${inputText}"` }
                ],
                json: true
            });

            return JSON.parse(completion.content);
        } catch (error) {
            return {
                success: false,
                error: error.message,
                confidence: 0,
                reasoning: "Failed to process due to technical error"
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