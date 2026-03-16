import { useState, useEffect } from 'react';

const CHARS = '░▒▓█▀▄▌▐─│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├┼╞╟╚╔╩╦╠═╬╪╫┘┌';

function generate(len: number) {
  let s = '';
  for (let i = 0; i < len; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
}

export default function Noise({ length = 80, speed = 80 }: { length?: number; speed?: number }) {
  const [text, setText] = useState(() => generate(length));

  useEffect(() => {
    const id = setInterval(() => setText(generate(length)), speed);
    return () => clearInterval(id);
  }, [length, speed]);

  return (
    <div className="text-t-dim text-xs select-none overflow-hidden whitespace-nowrap">{text}</div>
  );
}
