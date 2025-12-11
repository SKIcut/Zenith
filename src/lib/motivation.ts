const MOTIVATIONS = [
  { code: "RISE-5", text: "Small steps every day beat big plans tomorrow." },
  { code: "FOCUS-3", text: "Block distractions for 25 minutes and ship something." },
  { code: "START-1", text: "Start before you're ready — momentum beats perfection." },
  { code: "BOLD-7", text: "Make one bold choice today that your future self will thank you for." },
  { code: "LEARN-2", text: "Learn by doing: ship, measure, iterate." },
  { code: "HABIT-9", text: "Compound progress: 1% better every day." },
];

export function generateMotivation() {
  // Choose a pseudo-random motivation seeded by current time so each new open
  // tends to be different during development but deterministic within the same minute.
  const seed = Math.floor(Date.now() / 1000 / 60); // change every minute
  const idx = seed % MOTIVATIONS.length;
  const entry = MOTIVATIONS[idx];
  return {
    code: entry.code,
    text: entry.text,
  };
}

export default generateMotivation;
