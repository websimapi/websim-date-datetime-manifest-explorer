let dateManifest = null;

// Load the manifest on page load
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const response = await fetch('date-manifest.json');
        dateManifest = await response.json();
        
        // Initialize AI parser
        aiDateParser = new AIDateParser(dateManifest);
        
        updateCurrentDateTime();
        showFormatExamples();
        showTimezoneInfo();
        displayManifest();
    } catch (error) {
        console.error('Error loading manifest:', error);
    }
});

function updateCurrentDateTime() {
    const now = new Date();
    const currentDateTimeElement = document.getElementById('currentDateTime');
    
    currentDateTimeElement.innerHTML = `
        <strong>Local:</strong> ${now.toLocaleString()}<br>
        <strong>UTC:</strong> ${now.toUTCString()}<br>
        <strong>ISO:</strong> ${now.toISOString()}<br>
        <strong>Timestamp:</strong> ${now.getTime()}
    `;
}

function showFormatExamples() {
    const now = new Date();
    const examples = document.getElementById('formatExamples');
    
    const formats = [
        { name: 'ISO 8601', value: now.toISOString() },
        { name: 'US Format', value: now.toLocaleDateString('en-US') },
        { name: 'European', value: now.toLocaleDateString('en-GB') },
        { name: 'Long Date', value: now.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })},
        { name: 'Time Only', value: now.toLocaleTimeString() }
    ];
    
    examples.innerHTML = formats.map(format => 
        `<div style="margin: 5px 0;"><strong>${format.name}:</strong> ${format.value}</div>`
    ).join('');
}

function showTimezoneInfo() {
    const now = new Date();
    const timezoneInfo = document.getElementById('timezoneInfo');
    
    const offset = now.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offset) / 60);
    const offsetMinutes = Math.abs(offset) % 60;
    const offsetString = `${offset <= 0 ? '+' : '-'}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`;
    
    let timezone = 'Unknown';
    try {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (e) {
        console.log('Timezone detection not supported');
    }
    
    timezoneInfo.innerHTML = `
        <strong>Timezone:</strong> ${timezone}<br>
        <strong>UTC Offset:</strong> ${offsetString}<br>
        <strong>Offset Minutes:</strong> ${offset}
    `;
}

function parseDate() {
    const input = document.getElementById('dateInput').value;
    const result = document.getElementById('parseResult');
    
    try {
        const parsedDate = new Date(input);
        
        if (isNaN(parsedDate.getTime())) {
            result.innerHTML = `<span style="color: red;">❌ Invalid date format</span>`;
            return;
        }
        
        result.innerHTML = `
            <strong>✅ Parsed successfully:</strong><br>
            <strong>Local:</strong> ${parsedDate.toLocaleString()}<br>
            <strong>UTC:</strong> ${parsedDate.toUTCString()}<br>
            <strong>ISO:</strong> ${parsedDate.toISOString()}<br>
            <strong>Timestamp:</strong> ${parsedDate.getTime()}
        `;
    } catch (error) {
        result.innerHTML = `<span style="color: red;">❌ Error: ${error.message}</span>`;
    }
}

function formatDate() {
    const locale = document.getElementById('localeSelect').value;
    const result = document.getElementById('formatResult');
    const now = new Date();
    
    try {
        const formats = [
            { name: 'Default', value: new Intl.DateTimeFormat(locale).format(now) },
            { name: 'Long Date', value: new Intl.DateTimeFormat(locale, { 
                dateStyle: 'full' 
            }).format(now) },
            { name: 'Short Date', value: new Intl.DateTimeFormat(locale, { 
                dateStyle: 'short' 
            }).format(now) },
            { name: 'Time', value: new Intl.DateTimeFormat(locale, { 
                timeStyle: 'medium' 
            }).format(now) },
            { name: 'Custom', value: new Intl.DateTimeFormat(locale, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(now) }
        ];
        
        result.innerHTML = formats.map(format => 
            `<div style="margin: 5px 0;"><strong>${format.name}:</strong> ${format.value}</div>`
        ).join('');
    } catch (error) {
        result.innerHTML = `<span style="color: red;">❌ Error: ${error.message}</span>`;
    }
}

function calculateDate() {
    const days = parseInt(document.getElementById('daysInput').value) || 0;
    const result = document.getElementById('calculateResult');
    const now = new Date();
    
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);
    
    const operation = days >= 0 ? 'Adding' : 'Subtracting';
    const dayWord = Math.abs(days) === 1 ? 'day' : 'days';
    
    result.innerHTML = `
        <strong>${operation} ${Math.abs(days)} ${dayWord}:</strong><br>
        <strong>From:</strong> ${now.toLocaleDateString()}<br>
        <strong>To:</strong> ${futureDate.toLocaleDateString()}<br>
        <strong>ISO:</strong> ${futureDate.toISOString()}
    `;
}

function displayManifest() {
    if (!dateManifest) return;
    
    const viewer = document.getElementById('manifestViewer');
    viewer.innerHTML = syntaxHighlight(JSON.stringify(dateManifest, null, 2));
}

function syntaxHighlight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'json-key';
            } else {
                cls = 'json-string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

// AI-powered functions
async function parseTextWithAI() {
    const input = document.getElementById('aiTextInput').value;
    const format = document.getElementById('aiOutputFormat').value;
    const result = document.getElementById('aiTextResult');
    
    if (!input.trim()) {
        result.innerHTML = '<span style="color: red;">Please enter some text to parse</span>';
        return;
    }
    
    result.innerHTML = '🤖 Parsing with AI and verifying calculations...';
    
    try {
        const parsed = await aiDateParser.parseTextDate(input, format);
        
        if (parsed.success) {
            let verificationHtml = '';
            if (parsed.verificationResult) {
                const verification = parsed.verificationResult;
                const verificationColor = verification.success ? 'green' : 'red';
                const verificationIcon = verification.success ? '✅' : '❌';
                
                verificationHtml = `
                    <div style="border-top: 1px solid #ddd; margin-top: 15px; padding-top: 15px;">
                        <div style="color: ${verificationColor};"><strong>${verificationIcon} Mathematical Verification:</strong> ${verification.success ? 'PASSED' : 'FAILED'}</div>
                        ${verification.errors.length > 0 ? `<div style="color: red;"><strong>Errors:</strong> ${verification.errors.join(', ')}</div>` : ''}
                        <div><strong>Verified Steps:</strong></div>
                        ${verification.verifiedSteps.map(step => `
                            <div style="margin: 5px 0; padding: 5px; background: ${step.valid ? '#e8f5e8' : '#ffe8e8'}; border-radius: 3px;">
                                <div><strong>${step.type}:</strong> ${step.description || step.step || `${step.from} → ${step.to}`}</div>
                                ${step.equation ? `<div><strong>Equation:</strong> ${step.equation}</div>` : ''}
                                <div><strong>Expected:</strong> ${step.expected} | <strong>Calculated:</strong> ${step.calculated} | <strong>Valid:</strong> ${step.valid ? '✅' : '❌'}</div>
                            </div>
                        `).join('')}
                        ${verification.finalResult ? `<div><strong>Final Julian Day:</strong> ${verification.finalResult}</div>` : ''}
                        <div><strong>Matches Expected Result:</strong> ${verification.matchesExpected ? '✅ Yes' : '❌ No'}</div>
                    </div>
                `;
            }
            
            let mathProofHtml = '';
            if (parsed.mathematicalProof) {
                const proof = parsed.mathematicalProof;
                mathProofHtml = `
                    <div style="border-top: 1px solid #ddd; margin-top: 15px; padding-top: 15px;">
                        <div><strong>🧮 Mathematical Proof:</strong></div>
                        ${proof.baseDates ? `
                            <div><strong>Base Dates:</strong></div>
                            ${proof.baseDates.map(base => `
                                <div style="margin: 5px 0; padding: 5px; background: #f0f8ff; border-radius: 3px;">
                                    <div><strong>${base.description}:</strong> ${base.date}</div>
                                    <div><strong>Julian Day:</strong> ${base.julianDay} | <strong>Timestamp:</strong> ${base.timestamp}</div>
                                </div>
                            `).join('')}
                        ` : ''}
                        ${proof.calculations ? `
                            <div><strong>Calculations:</strong></div>
                            ${proof.calculations.map(calc => `
                                <div style="margin: 5px 0; padding: 5px; background: #fff8f0; border-radius: 3px;">
                                    <div><strong>Step:</strong> ${calc.step}</div>
                                    <div><strong>Equation:</strong> ${calc.equation}</div>
                                    <div><strong>Result:</strong> ${calc.result}</div>
                                </div>
                            `).join('')}
                        ` : ''}
                        ${proof.conversions ? `
                            <div><strong>Conversions:</strong></div>
                            ${proof.conversions.map(conv => `
                                <div style="margin: 5px 0; padding: 5px; background: #f8fff0; border-radius: 3px;">
                                    <div><strong>From:</strong> ${conv.from} → <strong>To:</strong> ${conv.to}</div>
                                    <div><strong>Formula:</strong> ${conv.formula}</div>
                                    <div><strong>Result:</strong> ${conv.result}</div>
                                </div>
                            `).join('')}
                        ` : ''}
                        ${proof.verification ? `<div><strong>Verification Method:</strong> ${proof.verification}</div>` : ''}
                    </div>
                `;
            }
            
            result.innerHTML = `
                <div style="color: green;"><strong>✅ Successfully parsed!</strong></div>
                <div><strong>Original:</strong> ${input}</div>
                <div><strong>Interpretation:</strong> ${parsed.originalFormat}</div>
                <div><strong>Parsed Date:</strong> ${parsed.parsedDate}</div>
                <div><strong>Requested Format:</strong> ${parsed.requestedFormat}</div>
                <div><strong>Confidence:</strong> ${Math.round(parsed.confidence * 100)}%</div>
                ${parsed.reasoning ? `<div><strong>AI Reasoning:</strong> ${parsed.reasoning}</div>` : ''}
                ${mathProofHtml}
                ${verificationHtml}
            `;
        } else {
            result.innerHTML = `
                <div style="color: red;"><strong>❌ Failed to parse:</strong> ${parsed.error}</div>
                ${parsed.reasoning ? `<div><strong>AI Reasoning:</strong> ${parsed.reasoning}</div>` : ''}
            `;
        }
    } catch (error) {
        result.innerHTML = `<div style="color: red;"><strong>❌ Error:</strong> ${error.message}</div>`;
    }
}

async function parseImageWithAI() {
    const input = document.getElementById('aiImageInput');
    const format = document.getElementById('aiImageFormat').value;
    const result = document.getElementById('aiImageResult');
    
    if (!input.files || !input.files[0]) {
        result.innerHTML = '<span style="color: red;">Please select an image file</span>';
        return;
    }
    
    result.innerHTML = '📸 Analyzing image...';
    
    try {
        // Convert image to data URL
        const file = input.files[0];
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const imageDataUrl = e.target.result;
                const parsed = await aiDateParser.parseImageDate(imageDataUrl, format);
                
                if (parsed.success && parsed.foundDates.length > 0) {
                    const datesHtml = parsed.foundDates.map(date => `
                        <div style="margin: 10px 0; padding: 10px; background: #f0f8ff; border-radius: 5px;">
                            <div><strong>Found Text:</strong> ${date.text}</div>
                            <div><strong>Parsed Date:</strong> ${date.parsedDate}</div>
                            <div><strong>Formatted:</strong> ${date.requestedFormat}</div>
                            <div><strong>Location:</strong> ${date.location}</div>
                            <div><strong>Confidence:</strong> ${Math.round(date.confidence * 100)}%</div>
                        </div>
                    `).join('');
                    
                    result.innerHTML = `
                        <div style="color: green;"><strong>✅ Found ${parsed.foundDates.length} date(s)!</strong></div>
                        ${datesHtml}
                    `;
                } else {
                    result.innerHTML = `<div style="color: orange;"><strong>⚠️ No dates found in image</strong></div>`;
                }
            } catch (error) {
                result.innerHTML = `<div style="color: red;"><strong>❌ Error:</strong> ${error.message}</div>`;
            }
        };
        
        reader.readAsDataURL(file);
    } catch (error) {
        result.innerHTML = `<div style="color: red;"><strong>❌ Error:</strong> ${error.message}</div>`;
    }
}

async function convertWithAI() {
    const input = document.getElementById('convertInput').value;
    const fromFormat = document.getElementById('fromFormat').value;
    const toFormat = document.getElementById('toFormat').value;
    const result = document.getElementById('aiConvertResult');
    
    if (!input.trim()) {
        result.innerHTML = '<span style="color: red;">Please enter a date to convert</span>';
        return;
    }
    
    result.innerHTML = '🔄 Converting format...';
    
    try {
        const converted = await aiDateParser.convertDateFormat(input, fromFormat, toFormat);
        
        if (converted.success) {
            result.innerHTML = `
                <div style="color: green;"><strong>✅ Successfully converted!</strong></div>
                <div><strong>Original:</strong> ${converted.originalDate}</div>
                <div><strong>From Format:</strong> ${converted.fromFormat}</div>
                <div><strong>To Format:</strong> ${converted.toFormat}</div>
                <div><strong>Result:</strong> ${converted.convertedDate}</div>
            `;
        } else {
            result.innerHTML = `<div style="color: red;"><strong>❌ Conversion failed:</strong> ${converted.error}</div>`;
        }
    } catch (error) {
        result.innerHTML = `<div style="color: red;"><strong>❌ Error:</strong> ${error.message}</div>`;
    }
}

// Add some utility functions that demonstrate the manifest concepts
window.dateUtils = {
    // Validation examples from manifest
    isValidDate: function(date) {
        return date instanceof Date && !isNaN(date.getTime());
    },
    
    isLeapYear: function(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    },
    
    daysInMonth: function(year, month) {
        return new Date(year, month + 1, 0).getDate();
    },
    
    // Calculation examples
    addDays: function(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    },
    
    daysBetween: function(date1, date2) {
        const timeDiff = Math.abs(date2.getTime() - date1.getTime());
        return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    },
    
    startOfMonth: function(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    },
    
    endOfMonth: function(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }
};

// Make utilities available in console for testing
console.log('Date utilities available as window.dateUtils');
console.log('Manifest loaded as dateManifest variable');