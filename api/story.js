export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { sentence, genre, history } = req.body

  if (!sentence) {
    return res.status(400).json({ error: 'Sentence is required' })
  }

  const genrePrompts = {
    Fantasy: 'Write in a mystical, enchanted tone with magical imagery and ancient wonder.',
    Romance: 'Write in a passionate, tender tone with emotional depth and heartfelt connection.',
    Mystery: 'Write in an atmospheric, suspenseful tone with subtle clues and intrigue.',
    'Sci-Fi': 'Write in a futuristic, technological tone with cosmic scale and scientific wonder.',
    Horror: 'Write in a dark, chilling tone with unsettling atmosphere and dread.',
  }

  const genrePrompt = genrePrompts[genre] || genrePrompts.Fantasy

  // Build history context
  let historyContext = ''
  if (history && history.length > 0) {
    historyContext = '\n\nStory so far:\n' + history.map((entry, i) => 
      `${entry.player}: ${entry.original}`
    ).join('\n')
  }

  const systemPrompt = `You are a creative writing assistant for a collaborative storytelling game called Storyloom.

${genrePrompt}

The current genre is: ${genre}

Take the player's sentence and expand it into 2-3 sentences of vivid, atmospheric prose that matches the genre's mood. Then on a new line write "IMAGE:" followed by a one-sentence visual scene description suitable for image generation.

Return the full response as plain text with the prose first, then the IMAGE: line.`

  const userMessage = `${historyContext}\n\nPlayer's sentence: "${sentence}"`

  async function callAnthropic() {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 400,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return data.content[0].text
  }

  callAnthropic()
    .then((result) => {
      res.status(200).json({ result })
    })
    .catch((error) => {
      console.error('Error:', error)
      res.status(500).json({ error: error.message })
    })
}