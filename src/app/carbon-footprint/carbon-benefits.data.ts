export interface BenefitPoint {
  heading: string;
  detail: string;
}

export interface BenefitSlide {
  icon: string;
  category: string;
  title: string;
  text: string;
  points: BenefitPoint[];
  takeaway: string;
}

export const BENEFIT_SLIDES: BenefitSlide[] = [
  {
    icon: '🌍',
    category: 'The business case',
    title: 'Why Carbon Footprint Matters',
    text: 'Product carbon footprint turns sustainability from a general commitment into a measurable, comparable business metric.',
    points: [
      {
        heading: 'Customers are asking',
        detail: 'Brand owners increasingly request product-level emissions data from packaging suppliers.',
      },
      {
        heading: 'Regulation is tightening',
        detail: 'Corporate reporting rules push emissions accountability down the supply chain.',
      },
      {
        heading: 'You manage what you measure',
        detail: 'A baseline footprint shows where reductions are possible and which actions matter most.',
      },
      {
        heading: 'Evidence over claims',
        detail: 'Quantified data replaces generic green messaging and withstands scrutiny.',
      },
    ],
    takeaway: 'Carbon data is becoming a standard part of doing business, not an optional extra.',
  },
  {
    icon: '🏆',
    category: 'Market position',
    title: 'Competitive Advantage',
    text: 'Transparent carbon data differentiates your offer when customers compare suppliers.',
    points: [
      {
        heading: 'Stand out in tenders',
        detail: 'Sustainability criteria are increasingly weighted in RFPs and supplier scorecards.',
      },
      {
        heading: 'Credible differentiation',
        detail: 'Show the footprint impact of each material and energy choice, side by side.',
      },
      {
        heading: 'Brand reputation',
        detail: 'Openness about environmental performance builds trust with customers and consumers.',
      },
      {
        heading: 'Be the preferred partner',
        detail: 'Suppliers that help customers hit their targets are easier to choose and harder to replace.',
      },
    ],
    takeaway: 'Suppliers who can quantify their impact are better placed to win and keep business.',
  },
  {
    icon: '💰',
    category: 'Financial impact',
    title: 'Cost & Efficiency Savings',
    text: 'Reducing emissions often goes hand in hand with using fewer resources and operating more efficiently.',
    points: [
      {
        heading: 'Find inefficiencies',
        detail: 'Footprint hotspots frequently reveal wasted material and energy.',
      },
      {
        heading: 'Material optimisation',
        detail: 'Lightweighting and recycled content lower the impact of raw materials.',
      },
      {
        heading: 'Energy strategy',
        detail: 'Renewable-powered production reduces manufacturing emissions and long-term energy exposure.',
      },
      {
        heading: 'Prioritise investment',
        detail: 'Compare options by impact so budget goes to the changes that deliver most.',
      },
    ],
    takeaway: 'Carbon reduction and cost discipline frequently point in the same direction.',
  },
  {
    icon: '📋',
    category: 'Risk & governance',
    title: 'Compliance & Risk Reduction',
    text: 'Prepare for evolving reporting standards and supply-chain due diligence expectations.',
    points: [
      {
        heading: 'Reporting readiness',
        detail: 'Product-level data supports customers’ Scope 3 and sustainability reporting needs.',
      },
      {
        heading: 'Regulatory exposure',
        detail: 'Early visibility reduces the risk of last-minute data gaps as rules evolve.',
      },
      {
        heading: 'Recognised methodology',
        detail: 'Estimates follow the principles of ISO 14040 / ISO 14044 life-cycle assessment.',
      },
      {
        heading: 'Audit-friendly',
        detail: 'Documented assumptions make figures traceable and easier to verify.',
      },
    ],
    takeaway: 'Acting early lowers compliance risk and avoids reactive, costly data collection.',
  },
  {
    icon: '🤝',
    category: 'Customer value',
    title: 'Stronger Customer & Partner Relationships',
    text: 'Shared sustainability data builds trust and moves the relationship beyond price.',
    points: [
      {
        heading: 'Faster responses',
        detail: 'Answer sustainability questionnaires quickly with consistent, ready-to-use figures.',
      },
      {
        heading: 'Support customer targets',
        detail: 'Help customers reduce their own supply-chain emissions with concrete options.',
      },
      {
        heading: 'Joint innovation',
        detail: 'Use footprint data as a shared basis to develop recycled and lighter packaging.',
      },
      {
        heading: 'Long-term loyalty',
        detail: 'Becoming a sustainability partner increases retention and strategic importance.',
      },
    ],
    takeaway: 'Sustainability data turns a supplier relationship into a strategic partnership.',
  },
  {
    icon: '📈',
    category: 'Growth',
    title: 'Revenue Growth & Market Access',
    text: 'Sustainability credentials open doors to new customers, segments, and product positioning.',
    points: [
      {
        heading: 'New opportunities',
        detail: 'Qualify for programmes and listings that require environmental performance data.',
      },
      {
        heading: 'Value-based positioning',
        detail: 'Lower-carbon options can support premium, sustainability-led propositions.',
      },
      {
        heading: 'Growing demand',
        detail: 'Interest in recycled-content and lower-impact packaging continues to rise.',
      },
      {
        heading: 'Shorter sales cycles',
        detail: 'Having carbon figures on hand removes a common blocker in customer discussions.',
      },
    ],
    takeaway: 'Carbon transparency supports both winning new business and growing existing accounts.',
  },
  {
    icon: '💼',
    category: 'Corporate standing',
    title: 'Investor & Stakeholder Confidence',
    text: 'Credible environmental performance strengthens relationships with everyone who has a stake in the business.',
    points: [
      {
        heading: 'ESG disclosure',
        detail: 'Quantified emissions data underpins ESG ratings and sustainability reports.',
      },
      {
        heading: 'Climate-risk management',
        detail: 'Demonstrates proactive handling of climate-related business risk.',
      },
      {
        heading: 'Access to capital',
        detail: 'Sustainability-focused investors and lenders look for measurable progress.',
      },
      {
        heading: 'Talent & culture',
        detail: 'Clear environmental goals help attract and engage employees.',
      },
    ],
    takeaway: 'Measured progress builds confidence among investors, partners, and employees.',
  },
  {
    icon: '🔗',
    category: 'Operations',
    title: 'Supply Chain Resilience',
    text: 'Knowing where emissions arise reveals dependencies and supports more secure long-term supply.',
    points: [
      {
        heading: 'Pinpoint hotspots',
        detail: 'See the split between manufacturing, transportation, and end of life.',
      },
      {
        heading: 'Reduce virgin dependency',
        detail: 'Recycled content lessens reliance on virgin raw materials.',
      },
      {
        heading: 'Manage volatility',
        detail: 'Lower energy intensity reduces exposure to energy and carbon-cost swings.',
      },
      {
        heading: 'Smarter sourcing',
        detail: 'Use footprint data to guide supplier and logistics decisions.',
      },
    ],
    takeaway: 'Carbon insight helps make the supply chain more efficient and more resilient.',
  },
  {
    icon: '🧭',
    category: 'How to use it',
    title: 'From Insight to Action',
    text: 'A practical, repeatable path from measuring emissions to reducing them on every order.',
    points: [
      {
        heading: '1. Measure',
        detail: 'Estimate the carbon footprint for the specific order configuration.',
      },
      {
        heading: '2. Compare',
        detail: 'Test materials, recycled content, and renewable-energy production.',
      },
      {
        heading: '3. Decide',
        detail: 'Select the lowest-carbon option that meets product and commercial needs.',
      },
      {
        heading: '4. Share',
        detail: 'Communicate results to customers and stakeholders with clear assumptions.',
      },
    ],
    takeaway: 'The calculator makes each of these steps possible within a single conversation.',
  },
  {
    icon: '🚀',
    category: 'The goal',
    title: 'Drive Your Net-Zero Goals',
    text: 'Small, data-driven choices on each order add up to meaningful progress toward long-term targets.',
    points: [
      {
        heading: 'Material choice',
        detail: 'Compare virgin and post-consumer recycled content to see the reduction potential.',
      },
      {
        heading: 'Energy choice',
        detail: 'See the added effect of producing with renewable electricity.',
      },
      {
        heading: 'Scale effect',
        detail: 'Per-unit savings multiply across order volumes and programmes.',
      },
      {
        heading: 'Continuous improvement',
        detail: 'Revisit the footprint regularly as products and options evolve.',
      },
    ],
    takeaway: 'Every order is an opportunity to lower emissions and strengthen the business.',
  },
];
