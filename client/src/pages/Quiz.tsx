import { useState } from 'react';
import { Link } from 'react-router-dom';

const QUESTIONS = [
  {
    q: 'YOU GET A VAGUE TASK. WHAT DO YOU DO?',
    options: [
      { text: 'JUST START BUILDING. FIX LATER.', scores: { GOFAST: 3, TEMPO: 1 } },
      { text: 'ASK 2-3 CLARIFYING QUESTIONS FIRST.', scores: { CONTROL: 3, MIDRANGE: 1 } },
      { text: 'MAKE YOUR BEST GUESS AND MENTION YOUR ASSUMPTIONS.', scores: { MIDRANGE: 3, GOFAST: 1 } },
      { text: 'BREAK IT INTO THE SMALLEST POSSIBLE STEP AND DO THAT.', scores: { TEMPO: 3, COMBO: 1 } },
    ],
  },
  {
    q: 'HOW DO YOU FEEL ABOUT CODE COMMENTS?',
    options: [
      { text: 'THE CODE IS THE COMMENT.', scores: { TEMPO: 3, GOFAST: 2 } },
      { text: 'COMMENT THE WHY, NOT THE WHAT.', scores: { MIDRANGE: 3, CONTROL: 1 } },
      { text: 'DOCUMENT EVERYTHING. FUTURE YOU WILL THANK YOU.', scores: { CONTROL: 3 } },
      { text: 'ONLY COMMENT WHEN THE PATTERN IS UNUSUAL.', scores: { COMBO: 3, TEMPO: 1 } },
    ],
  },
  {
    q: 'A TEST IS FAILING. YOUR MOVE?',
    options: [
      { text: 'FIX IT. MOVE ON. NO NARRATION NEEDED.', scores: { GOFAST: 3, TEMPO: 1 } },
      { text: 'INVESTIGATE ROOT CAUSE BEFORE TOUCHING ANYTHING.', scores: { CONTROL: 3, MIDRANGE: 1 } },
      { text: 'CHECK IF THE TEST OR THE CODE IS WRONG.', scores: { MIDRANGE: 3 } },
      { text: 'DELETE THE TEST IF IT IS NOT LOAD-BEARING.', scores: { COMBO: 3, GOFAST: 1 } },
    ],
  },
  {
    q: 'HOW LONG SHOULD AN AI RESPONSE BE?',
    options: [
      { text: 'AS SHORT AS POSSIBLE. ONE LINE IF ONE LINE WORKS.', scores: { TEMPO: 3, GOFAST: 1 } },
      { text: 'WHATEVER LENGTH THE ANSWER REQUIRES.', scores: { MIDRANGE: 3 } },
      { text: 'THOROUGH. I WANT TO SEE THE REASONING.', scores: { CONTROL: 3 } },
      { text: 'DEPENDS ENTIRELY ON THE TASK TYPE.', scores: { COMBO: 3, MIDRANGE: 1 } },
    ],
  },
  {
    q: 'YOU SEE CODE THAT WORKS BUT IS UGLY. DO YOU REFACTOR?',
    options: [
      { text: 'NO. IF IT WORKS, SHIP IT.', scores: { GOFAST: 3 } },
      { text: 'YES. CLEAN CODE PREVENTS FUTURE BUGS.', scores: { CONTROL: 3 } },
      { text: 'ONLY IF I AM ALREADY IN THAT FILE FOR ANOTHER REASON.', scores: { MIDRANGE: 3, TEMPO: 1 } },
      { text: 'ONLY IF IT BLOCKS THE SPECIFIC THING I AM BUILDING.', scores: { TEMPO: 3, COMBO: 1 } },
    ],
  },
];

const ARCHETYPE_INFO: Record<string, { color: string; desc: string }> = {
  GOFAST: { color: '#ff2020', desc: 'You bias toward action. Ship first, ask never. Speed is everything.' },
  CONTROL: { color: '#2080ff', desc: 'You verify before acting. Correctness over speed. Measure twice, cut once.' },
  MIDRANGE: { color: '#20cc60', desc: 'You read the room. Balanced, adaptive, context-dependent.' },
  TEMPO: { color: '#ffaa20', desc: 'You value economy. Every token earns its place. Minimal footprint.' },
  COMBO: { color: '#aa20ff', desc: 'You think from first principles. Unconventional, specialized, creative.' },
};

export default function Quiz() {
  const [current, setCurrent] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [result, setResult] = useState<string | null>(null);

  const handleAnswer = (optionScores: Partial<Record<string, number>>) => {
    const newScores = { ...scores };
    for (const [arch, pts] of Object.entries(optionScores)) {
      newScores[arch] = (newScores[arch] || 0) + (pts || 0);
    }
    setScores(newScores);

    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1);
    } else {
      // Find winner
      const winner = Object.entries(newScores).sort((a, b) => b[1] - a[1])[0][0];
      setResult(winner);
    }
  };

  const reset = () => {
    setCurrent(0);
    setScores({});
    setResult(null);
  };

  if (result) {
    const info = ARCHETYPE_INFO[result];
    return (
      <div>
        <Link to="/" className="text-xs text-t-dim uppercase tracking-widest hover:text-t-accent transition-colors">
          &larr; BACK TO BOARD
        </Link>
        <div className="py-12 text-center">
          <div className="text-xs text-t-dim uppercase tracking-widest mb-4">YOUR ARCHETYPE IS</div>
          <div className="text-5xl font-bold uppercase tracking-widest mb-4" style={{ color: info.color }}>
            {result}
          </div>
          <div className="text-sm text-t-mid mb-8 max-w-md mx-auto">{info.desc}</div>
          <div className="flex gap-6 justify-center text-sm uppercase tracking-widest">
            <Link to={`/archetype/${result.toLowerCase()}`} className="text-t-accent hover:text-t-hi">[VIEW ARCHETYPE]</Link>
            <Link to={`/?archetype=${result}`} className="text-t-hi hover:text-t-accent">[SEE BUILDS]</Link>
            <button onClick={reset} className="text-t-dim hover:text-t-accent">[RETAKE]</button>
          </div>
        </div>
      </div>
    );
  }

  const q = QUESTIONS[current];
  return (
    <div>
      <Link to="/" className="text-xs text-t-dim uppercase tracking-widest hover:text-t-accent transition-colors">
        &larr; BACK TO BOARD
      </Link>

      <div className="py-8">
        <div className="text-2xl font-bold text-t-hi uppercase tracking-widest mb-2">ARCHETYPE QUIZ</div>
        <div className="text-xs text-t-dim uppercase tracking-widest">QUESTION {current + 1} OF {QUESTIONS.length}</div>
      </div>

      <div className="py-6">
        <div className="text-lg text-t-hi uppercase tracking-wider mb-8">{q.q}</div>
        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(opt.scores)}
              className="w-full text-left py-3 px-4 border border-t-dim/20 hover:border-t-accent/40 hover:bg-t-accent/5 transition-colors text-sm text-t-mid uppercase tracking-wider"
            >
              {opt.text}
            </button>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 py-4">
        {QUESTIONS.map((_, i) => (
          <div key={i} className={`h-1 flex-1 ${i <= current ? 'bg-t-accent' : 'bg-t-dim/20'}`} />
        ))}
      </div>
    </div>
  );
}
