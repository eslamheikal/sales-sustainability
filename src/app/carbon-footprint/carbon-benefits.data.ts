export interface PitchItem {
  icon: string;
  title: string;
  detail: string;
}

export interface PitchSlide {
  eyebrow: string;
  title: string;
  layout: 'cards' | 'compare' | 'roadmap';
  items: PitchItem[];
  before?: string[];
  after?: string[];
  message: string;
}

export const PITCH_SLIDES: PitchSlide[] = [
  {
    eyebrow: 'The problem',
    title: 'Customers ask for carbon data. Sales can’t answer fast.',
    layout: 'cards',
    items: [
      { icon: '📩', title: 'High demand', detail: 'Carbon data is in every RFP.' },
      { icon: '⏳', title: 'Slow answers', detail: 'Reps wait days for experts.' },
      { icon: '📉', title: 'Lost deals', detail: 'Customers won’t wait.' },
    ],
    message: 'No fast answers = lost business.',
  },
  {
    eyebrow: 'The solution',
    title: 'One simple tool for sales',
    layout: 'cards',
    items: [
      { icon: '📦', title: 'Find', detail: 'Any product in seconds.' },
      { icon: '🌱', title: 'Calculate', detail: 'Carbon footprint, live.' },
      { icon: '🤖', title: 'Ask', detail: 'AI answers in plain language.' },
    ],
    message: 'Reps answer in the meeting.',
  },
  {
    eyebrow: 'The impact',
    title: 'What changes',
    layout: 'compare',
    items: [],
    before: ['Days to answer', 'Experts overloaded', 'Price-only talks'],
    after: ['Minutes to answer', 'Reps self-serve', 'Win on sustainability'],
    message: 'Faster answers. More wins.',
  },
  {
    eyebrow: 'Next steps',
    title: 'Start small, scale fast',
    layout: 'roadmap',
    items: [
      { icon: 'Today', title: 'Demo', detail: 'Working tool.' },
      { icon: 'Next', title: 'Pilot', detail: 'One product line.' },
      { icon: 'Then', title: 'Rollout', detail: 'All products.' },
    ],
    message: 'Our ask: approve the pilot.',
  },
];
