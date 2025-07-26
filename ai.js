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

CRITICAL REQUIREMENT: For ANY calculation or date arithmetic, you MUST provide detailed mathematical proofs and equations that can be verified independently. Include:
- Step-by-step calculations with exact numbers
- Base dates used with specific timestamps
- All arithmetic operations in verifiable format
- Conversion formulas between different units (days, weeks, months, years)
- Historical date references with specific Julian/Gregorian calendar dates

Example of required mathematical format:
"Base date: April 3, 33 AD = Julian Day 1733175
Calculation: 1733175 + 87 = 1733262
Verification: Julian Day 1733262 = June 29, 33 AD"

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
    "mathematicalProof": {
        "baseDates": [{"description": string, "date": string, "julianDay": number, "timestamp": number}],
        "calculations": [{"step": string, "equation": string, "result": number}],
        "conversions": [{"from": string, "to": string, "formula": string, "result": string}],
        "verification": string (how to independently verify this calculation)
    },
    "error": string (if any)
}

Current date for reference: ${new Date().toISOString()}
Current Julian Day: ${this.calculateJulianDay(new Date())}

Be creative and use your full reasoning capabilities. Don't give up easily! Always show your mathematical work.`;

        try {
            const completion = await websim.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Parse this date input creatively and format as ${requestedFormat}. SHOW ALL MATHEMATICAL WORK: "${inputText}"` }
                ],
                json: true
            });

            const result = JSON.parse(completion.content);
            
            // Verify the mathematical proof if provided
            if (result.mathematicalProof) {
                result.verificationResult = await this.verifyMathematicalProof(result.mathematicalProof, result.parsedDate);
            }

            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message,
                confidence: 0,
                reasoning: "Failed to process due to technical error"
            };
        }
    }

    calculateJulianDay(date) {
        // Convert JavaScript Date to Julian Day Number
        const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
        const y = date.getFullYear() + 4800 - a;
        const m = (date.getMonth() + 1) + 12 * a - 3;
        return date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    }

    julianDayToDate(julianDay) {
        // Convert Julian Day Number to JavaScript Date
        const a = julianDay + 32044;
        const b = Math.floor((4 * a + 3) / 146097);
        const c = a - Math.floor((146097 * b) / 4);
        const d = Math.floor((4 * c + 3) / 1461);
        const e = c - Math.floor((1461 * d) / 4);
        const m = Math.floor((5 * e + 2) / 153);
        
        const day = e - Math.floor((153 * m + 2) / 5) + 1;
        const month = m + 3 - 12 * Math.floor(m / 10);
        const year = 100 * b + d - 4800 + Math.floor(m / 10);
        
        return new Date(year, month - 1, day);
    }

    async verifyMathematicalProof(proof, expectedResult) {
        const verification = {
            success: false,
            errors: [],
            verifiedSteps: [],
            finalResult: null,
            matchesExpected: false
        };

        try {
            // Verify base dates
            if (proof.baseDates) {
                for (const baseDate of proof.baseDates) {
                    const date = new Date(baseDate.date);
                    const calculatedJulianDay = this.calculateJulianDay(date);
                    const calculatedTimestamp = date.getTime();
                    
                    verification.verifiedSteps.push({
                        type: "baseDate",
                        description: baseDate.description,
                        expected: baseDate.julianDay,
                        calculated: calculatedJulianDay,
                        valid: Math.abs(calculatedJulianDay - baseDate.julianDay) <= 1, // Allow 1 day tolerance
                        timestampExpected: baseDate.timestamp,
                        timestampCalculated: calculatedTimestamp,
                        timestampValid: Math.abs(calculatedTimestamp - baseDate.timestamp) < 86400000 // 1 day in ms
                    });
                }
            }

            // Verify calculations
            if (proof.calculations) {
                let runningResult = null;
                for (const calc of proof.calculations) {
                    try {
                        // Parse and evaluate the equation safely
                        const evaluatedResult = this.evaluateEquation(calc.equation);
                        verification.verifiedSteps.push({
                            type: "calculation",
                            step: calc.step,
                            equation: calc.equation,
                            expected: calc.result,
                            calculated: evaluatedResult,
                            valid: Math.abs(evaluatedResult - calc.result) < 0.001
                        });
                        runningResult = evaluatedResult;
                    } catch (error) {
                        verification.errors.push(`Failed to evaluate equation: ${calc.equation} - ${error.message}`);
                    }
                }
                verification.finalResult = runningResult;
            }

            // Verify conversions
            if (proof.conversions) {
                for (const conversion of proof.conversions) {
                    try {
                        const result = this.verifyConversion(conversion);
                        verification.verifiedSteps.push({
                            type: "conversion",
                            from: conversion.from,
                            to: conversion.to,
                            formula: conversion.formula,
                            expected: conversion.result,
                            calculated: result,
                            valid: result !== null
                        });
                    } catch (error) {
                        verification.errors.push(`Failed to verify conversion: ${conversion.formula} - ${error.message}`);
                    }
                }
            }

            // Check if final result matches expected
            if (expectedResult) {
                const expectedDate = new Date(expectedResult);
                const finalJulianDay = verification.finalResult;
                if (finalJulianDay) {
                    const calculatedDate = this.julianDayToDate(finalJulianDay);
                    verification.matchesExpected = Math.abs(expectedDate.getTime() - calculatedDate.getTime()) < 86400000; // 1 day tolerance
                }
            }

            verification.success = verification.errors.length === 0 && verification.verifiedSteps.every(step => step.valid);
            
        } catch (error) {
            verification.errors.push(`Verification error: ${error.message}`);
        }

        return verification;
    }

    evaluateEquation(equation) {
        // Safe equation evaluator for basic arithmetic
        // Remove any non-numeric, non-operator characters for safety
        const safeEquation = equation.replace(/[^0-9+\-*/.() ]/g, '');
        
        // Simple evaluation using Function constructor (safer than eval)
        try {
            return new Function('return ' + safeEquation)();
        } catch (error) {
            throw new Error(`Invalid equation: ${equation}`);
        }
    }

    verifyConversion(conversion) {
        try {
            // Handle common date conversions
            if (conversion.formula.includes('Julian Day')) {
                const julianDayMatch = conversion.from.match(/Julian Day (\d+)/);
                if (julianDayMatch) {
                    const julianDay = parseInt(julianDayMatch[1]);
                    const convertedDate = this.julianDayToDate(julianDay);
                    return convertedDate.toISOString().split('T')[0]; // Return date part only
                }
            }
            
            // Handle timestamp conversions
            if (conversion.formula.includes('timestamp')) {
                const timestampMatch = conversion.from.match(/(\d+)/);
                if (timestampMatch) {
                    const timestamp = parseInt(timestampMatch[1]);
                    const date = new Date(timestamp);
                    return date.toISOString();
                }
            }
            
            return null;
        } catch (error) {
            throw error;
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