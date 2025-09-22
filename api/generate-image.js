// This is your secure server-side code.
// Your API key is safe here because this code runs on the server, not in the browser.

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Only POST requests are allowed' });
    }

    // This securely gets your API key from the Vercel Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ message: 'API key is not configured on the server.' });
    }

    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ message: 'A prompt is required.' });
        }

        // UPDATED: Switched to the free-tier friendly gemini-2.5-flash-image-preview model
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
        
        // UPDATED: The payload structure is different for this model
        const payload = {
            "contents": [{
                "parts": [{ "text": prompt }]
            }],
            "generationConfig": {
                "responseModalities": ["IMAGE"]
            }
        };
        
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const error = await apiResponse.json();
            throw new Error(error.error?.message || 'Failed to generate image from API.');
        }

        const result = await apiResponse.json();
        
        // UPDATED: The response structure is different, so we find the image data here
        const base64Data = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

        if (!base64Data) {
            const blockReason = result?.promptFeedback?.blockReason;
            if (blockReason) {
                throw new Error(`Image generation blocked due to: ${blockReason}. Please try a different prompt.`);
            }
            throw new Error('No image data received from the API. The prompt may have been blocked for safety reasons.');
        }

        // Send the image data back to your webpage
        res.status(200).json({ base64Data: base64Data });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

