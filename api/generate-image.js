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

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`;
        const payload = {
            instances: [{ prompt: prompt }],
            parameters: { "sampleCount": 1 }
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
        const base64Data = result.predictions?.[0]?.bytesBase64Encoded;

        if (!base64Data) {
            throw new Error('No image data received from the API.');
        }

        // Send the image data back to your webpage
        res.status(200).json({ base64Data: base64Data });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}
