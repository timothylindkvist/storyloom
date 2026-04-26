import { useState, useRef, useEffect } from 'react'

const GENRES = [
  { id: 'Fantasy', emoji: '🏰', mood: 'enchanted' },
  { id: 'Romance', emoji: '💕', mood: 'tender' },
  { id: 'Mystery', emoji: '🔍', mood: 'intriguing' },
  { id: 'Sci-Fi', emoji: '🚀', mood: 'cosmic' },
  { id: 'Horror', emoji: '👻', mood: 'dark' },
]

function App() {
  const [phase, setPhase] = useState('setup') // setup, playing, ended
  const [player1Name, setPlayer1Name] = useState('')
  const [player2Name, setPlayer2Name] = useState('')
  const [selectedGenre, setSelectedGenre] = useState(null)
  const [story, setStory] = useState([])
  const [currentTurn, setCurrentTurn] = useState(1)
  const [inputSentence, setInputSentence] = useState('')
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [story])

  const startGame = () => {
    if (player1Name.trim() && player2Name.trim() && selectedGenre) {
      setPhase('playing')
    }
  }

  const submitSentence = async () => {
    if (!inputSentence.trim() || loading) return

    setLoading(true)
    const currentPlayer = currentTurn === 1 ? player1Name : player2Name

    try {
      const history = story.map(s => ({
        player: s.player,
        original: s.originalSentence
      }))

      const response = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentence: inputSentence,
          genre: selectedGenre,
          history
        })
      })

      const data = await response.json()

      if (data.error) {
        alert('Error: ' + data.error)
        setLoading(false)
        return
      }

      // Parse response - separate prose from IMAGE: prompt
      const lines = data.result.split('\n')
      let prose = ''
      let imagePrompt = ''

      for (const line of lines) {
        if (line.startsWith('IMAGE:')) {
          imagePrompt = line.substring(6).trim()
        } else {
          prose += line + '\n'
        }
      }

      prose = prose.trim()

      setStory([...story, {
        player: currentPlayer,
        originalSentence: inputSentence,
        prose,
        imagePrompt,
        genre: selectedGenre,
        turn: currentTurn
      }])

      setInputSentence('')
      setCurrentTurn(currentTurn === 1 ? 2 : 1)
    } catch (error) {
      alert('Failed to submit: ' + error.message)
    }

    setLoading(false)
  }

  const endStory = () => {
    setShowModal(true)
  }

  const copyStory = () => {
    const fullStory = story.map(s => 
      `${s.player} wrote: "${s.originalSentence}"\n\n${s.prose}\n\n---\n`
    ).join('\n')

    navigator.clipboard.writeText(fullStory)
    alert('Story copied to clipboard!')
  }

  const getGenreStyle = (genreId) => {
    const styles = {
      Fantasy: { border: 'border-purple-400/30', bg: 'bg-purple-900/20', text: 'text-purple-200' },
      Romance: { border: 'border-pink-400/30', bg: 'bg-pink-900/20', text: 'text-pink-200' },
      Mystery: { border: 'border-indigo-400/30', bg: 'bg-indigo-900/20', text: 'text-indigo-200' },
      'Sci-Fi': { border: 'border-cyan-400/30', bg: 'bg-cyan-900/20', text: 'text-cyan-200' },
      Horror: { border: 'border-red-400/30', bg: 'bg-red-900/20', text: 'text-red-200' },
    }
    return styles[genreId] || styles.Fantasy
  }

  // Setup Phase
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-story-dark flex flex-col items-center justify-center p-8">
        <h1 className="font-display text-6xl md:text-7xl text-story-gold animate-gold-glow mb-4">
          Storyloom
        </h1>
        <p className="text-gray-400 mb-12 text-lg font-ui">A collaborative storytelling adventure</p>

        <div className="w-full max-w-md space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-ui">Player 1</label>
              <input
                type="text"
                value={player1Name}
                onChange={(e) => setPlayer1Name(e.target.value)}
                placeholder="Enter name..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 font-ui focus:outline-none focus:border-story-gold/50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2 font-ui">Player 2</label>
              <input
                type="text"
                value={player2Name}
                onChange={(e) => setPlayer2Name(e.target.value)}
                placeholder="Enter name..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 font-ui focus:outline-none focus:border-story-gold/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-3 font-ui">Choose your genre</label>
            <div className="grid grid-cols-5 gap-2">
              {GENRES.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => setSelectedGenre(genre.id)}
                  className={`p-3 rounded-lg border transition-all font-ui ${
                    selectedGenre === genre.id
                      ? 'border-story-gold bg-story-gold/20 scale-105'
                      : 'border-white/10 bg-white/5 hover:border-white/30'
                  }`}
                >
                  <div className="text-2xl mb-1">{genre.emoji}</div>
                  <div className="text-xs text-gray-300">{genre.id}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startGame}
            disabled={!player1Name.trim() || !player2Name.trim() || !selectedGenre}
            className="w-full py-4 bg-story-gold text-story-dark font-ui font-bold rounded-lg text-lg transition-all hover:bg-story-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✨ Begin Story
          </button>
        </div>
      </div>
    )
  }

  // Playing Phase
  return (
    <div className="min-h-screen bg-story-dark flex flex-col">
      {/* Header */}
      <header className="py-6 px-8 border-b border-white/5">
        <h1 className="font-display text-3xl text-story-gold animate-gold-glow">
          Storyloom
        </h1>
        <div className="flex items-center gap-4 mt-2 text-sm font-ui text-gray-400">
          <span>{player1Name} vs {player2Name}</span>
          <span className="text-story-gold">•</span>
          <span>{GENRES.find(g => g.id === selectedGenre)?.emoji} {selectedGenre}</span>
        </div>
      </header>

      {/* Story Scroll */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8"
      >
        <div className="max-w-2xl mx-auto space-y-6">
          {story.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 font-display text-xl italic">
                The story begins...
              </p>
            </div>
          ) : (
            story.map((entry, index) => {
              const genreStyle = getGenreStyle(entry.genre)
              return (
                <div
                  key={index}
                  className={`animate-fade-in-up border rounded-xl p-6 ${genreStyle.border} ${genreStyle.bg}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`font-ui text-sm ${genreStyle.text}`}>
                      {entry.player}'s contribution
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-500 text-sm font-ui italic">
                      Turn {entry.turn}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 font-display text-lg leading-relaxed mb-4">
                    {entry.prose}
                  </p>
                  
                  {entry.imagePrompt && (
                    <div className="pt-3 border-t border-white/5">
                      <p className="text-xs text-gray-500 font-ui">
                        <span className="text-story-gold">IMAGE:</span> {entry.imagePrompt}
                      </p>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-white/5 bg-black/20">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="animate-shimmer h-20 rounded-lg" />
          ) : (
            <div className="flex gap-4">
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-2 font-ui">
                  <span className="text-story-gold">{currentTurn === 1 ? player1Name : player2Name}</span>'s turn to add to the story
                </p>
                <input
                  type="text"
                  value={inputSentence}
                  onChange={(e) => setInputSentence(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && submitSentence()}
                  placeholder="Write your sentence..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 font-display focus:outline-none focus:border-story-gold/50"
                />
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={submitSentence}
                  disabled={!inputSentence.trim()}
                  className="px-6 py-3 bg-story-gold text-story-dark font-ui font-bold rounded-lg transition-all hover:bg-story-gold/90 disabled:opacity-50"
                >
                  Add to story
                </button>
                <button
                  onClick={endStory}
                  disabled={story.length === 0}
                  className="px-6 py-2 bg-white/10 text-gray-300 font-ui text-sm rounded-lg transition-all hover:bg-white/20 disabled:opacity-50"
                >
                  End & Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-story-dark border border-story-gold/30 rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="font-display text-2xl text-story-gold">Your Story</h2>
              <p className="text-gray-400 font-ui text-sm mt-1">
                {player1Name} and {player2Name}'s collaborative tale
              </p>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {story.map((entry, index) => (
                <div key={index} className="mb-6 pb-6 border-b border-white/5 last:border-0">
                  <p className="font-display text-lg text-gray-200 leading-relaxed">
                    {entry.prose}
                  </p>
                  <p className="text-sm text-gray-500 font-ui mt-2">
                    — {entry.player}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-white/10 flex gap-4">
              <button
                onClick={copyStory}
                className="px-6 py-3 bg-story-gold text-story-dark font-ui font-bold rounded-lg transition-all hover:bg-story-gold/90"
              >
                📋 Copy Story
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-white/10 text-gray-300 font-ui rounded-lg transition-all hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App