import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { Product, ProductAttributes, ProductSolutions } from '../models/product.model';

interface SeedProduct extends Product {
  image_url?: string;
}

const CATEGORY_MARKET_RULES: Array<{ pattern: RegExp; market: string }> = [
  { pattern: /pharma|drug|inject|syringe|inhaler|nasal|nebulizer|respiratory|vaccine|biotech|dermal/i, market: 'Pharmaceutical' },
  { pattern: /food|beverage|condiment|ketchup|sauce|dairy|sport cap|simplicycle/i, market: 'Food & Beverage' },
  { pattern: /fragrance|beauty|cosmetic|lipstick|mascara|skincare|hair|mist|spray pump/i, market: 'Beauty & Personal Care' },
  { pattern: /home care|cleaning|detergent/i, market: 'Home Care' },
  { pattern: /digital|connected|healthcare device/i, market: 'Digital Health' }
];

const INDUSTRY_RULES: Array<{ pattern: RegExp; industry: string }> = [
  { pattern: /pharma|drug|inject|syringe|inhaler|nasal|nebulizer|respiratory|vaccine|biotech|dermal|dose count/i, industry: 'Pharmaceutical' },
  { pattern: /food|beverage|condiment|fresh-cut|pathogen|antimicrobial/i, industry: 'Food & Beverage' },
  { pattern: /fragrance|beauty|cosmetic|lipstick|mascara|skincare|hair|makeup/i, industry: 'Beauty' },
  { pattern: /personal care|sanitizer|body mist|deodorant/i, industry: 'Personal Care' },
  { pattern: /home care|cleaning|detergent/i, industry: 'Home Care' },
  { pattern: /aerosol|actuator|spray pump|dispensing|closure|cap|valve|airless|tube/i, industry: 'Dispensing Solutions' }
];

function cleanText(value: string): string {
  return value
    .replace(/\u00c2|\u00ae|\u2122|\u2013|\u2014/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function splitSentences(text: string): string[] {
  return unique(
    text
      .split(/(?<=[.!?])\s+/)
      .map(cleanText)
      .filter((sentence) => sentence.length > 20)
  );
}

function extractTechnicalSpecs(description: string): Record<string, string> {
  const specs: Record<string, string> = {};
  const patterns: Array<{ key: string; regex: RegExp }> = [
    { key: 'neck_finish', regex: /Neck Finish:\s*([^,\n.]+)/i },
    { key: 'manufacturing_location', regex: /Manufacturing Location:\s*([^,\n.]+)/i },
    { key: 'orifice_size', regex: /Orifice Size:\s*([^,\n.]+)/i },
    { key: 'sealing_feature', regex: /Sealing Feature:\s*([^,\n.]+)/i },
    { key: 'neck_finish', regex: /(FEA\s*\d+\s*mm(?:\s*Snap-on)?)/i }
  ];

  for (const { key, regex } of patterns) {
    const match = description.match(regex);
    if (match?.[1] && !specs[key]) {
      specs[key] = cleanText(match[1]);
    }
  }

  return specs;
}

function extractCertifications(description: string): string[] {
  const certifications: string[] = [];

  if (/FDA compliant/i.test(description)) certifications.push('FDA compliant');
  if (/Post-Consumer Recycled|PCR/i.test(description)) certifications.push('Post-Consumer Recycled (PCR)');
  if (/ISCC/i.test(description)) certifications.push('ISCC certified');
  if (/tamper[- ]eviden/i.test(description)) certifications.push('Tamper-evident');
  if (/child[- ]resistant/i.test(description)) certifications.push('Child-resistant');
  if (/e-commerce capable|omnichannel/i.test(description)) certifications.push('E-commerce capable');
  if (/POM-free/i.test(description)) certifications.push('POM-free');

  return unique(certifications);
}

function extractMaterials(description: string): string[] {
  const materials: string[] = [];

  if (/Post-Consumer Recycled|PCR/i.test(description)) materials.push('Post-Consumer Recycled resin');
  if (/ISCC/i.test(description)) materials.push('ISCC-certified recycled materials');
  if (/elastomer/i.test(description)) materials.push('Elastomer');
  if (/polymer/i.test(description)) materials.push('Polymer');
  if (/metal shroud/i.test(description)) materials.push('Metal shroud option');

  return unique(materials);
}

function extractCompliance(description: string): string[] {
  const standards: string[] = [];

  if (/FDA compliant/i.test(description)) standards.push('FDA');
  if (/USP/i.test(description)) standards.push('USP');
  if (/GMP/i.test(description)) standards.push('GMP');

  return unique(standards);
}

function inferTargetMarket(category: string, description: string): string | undefined {
  const source = `${category} ${description}`;

  for (const rule of CATEGORY_MARKET_RULES) {
    if (rule.pattern.test(source)) {
      return rule.market;
    }
  }

  return 'Multi-market';
}

function inferIndustries(category: string, description: string): string[] {
  const source = `${category} ${description}`;
  const industries = INDUSTRY_RULES.filter((rule) => rule.pattern.test(source)).map((rule) => rule.industry);

  if (category) {
    industries.push(category);
  }

  return unique(industries).slice(0, 4);
}

function extractFeaturePhrases(description: string): string[] {
  const features: string[] = [];
  const keywordPatterns = [
    /(?:features|includes|offers|designed for|equipped with|available with)\s+([^.]+)/gi,
    /(?:with|featuring)\s+([^.]{10,120})/gi
  ];

  for (const pattern of keywordPatterns) {
    for (const match of description.matchAll(pattern)) {
      const phrase = cleanText(match[1] ?? '');
      if (phrase.length >= 10 && phrase.length <= 140) {
        features.push(phrase);
      }
    }
  }

  const sentences = splitSentences(description);
  features.push(...sentences.slice(0, 2));

  return unique(features).slice(0, 5);
}

function extractBenefits(description: string): string[] {
  const benefits: string[] = [];
  const patterns = [
    /help(?:s|ing)?\s+([^.]+)/gi,
    /ensur(?:e|es|ing)\s+([^.]+)/gi,
    /improv(?:e|es|ing)\s+([^.]+)/gi,
    /enabl(?:e|es|ing)\s+([^.]+)/gi,
    /reduce(?:s|d|ing)?\s+([^.]+)/gi
  ];

  for (const pattern of patterns) {
    for (const match of description.matchAll(pattern)) {
      const phrase = cleanText(match[0] ?? '');
      if (phrase.length >= 15 && phrase.length <= 160) {
        benefits.push(phrase);
      }
    }
  }

  const sentences = splitSentences(description);
  if (sentences[0]) benefits.push(sentences[0]);

  return unique(benefits).slice(0, 4);
}

function extractApplications(category: string, description: string): string[] {
  const applications: string[] = [];
  const source = `${category} ${description}`.toLowerCase();

  const appMap: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /fragrance|perfume|cologne/, label: 'Fragrance application' },
    { pattern: /lipstick|lip color|lip balm/, label: 'Lip color application' },
    { pattern: /nasal|sinus/, label: 'Nasal drug delivery' },
    { pattern: /inhaler|pmdi|respiratory/, label: 'Respiratory therapy' },
    { pattern: /syringe|inject/, label: 'Injectable drug delivery' },
    { pattern: /food|beverage|condiment|ketchup|sauce/, label: 'Food and beverage dispensing' },
    { pattern: /sanitizer|mist|body spray/, label: 'Personal care spray application' },
    { pattern: /aerosol|actuator/, label: 'Aerosol dispensing' },
    { pattern: /airless|cosmetic pump|skincare/, label: 'Cosmetic dispensing' },
    { pattern: /sport cap|bottle/, label: 'Beverage closure application' }
  ];

  for (const { pattern, label } of appMap) {
    if (pattern.test(source)) {
      applications.push(label);
    }
  }

  if (category) {
    applications.push(category);
  }

  return unique(applications).slice(0, 4);
}

function buildAttributes(product: SeedProduct): ProductAttributes {
  const description = cleanText(product.description ?? '');
  const category = cleanText(product.category ?? '');
  const technicalSpecs = extractTechnicalSpecs(description);
  const certifications = extractCertifications(description);
  const materials = extractMaterials(description);
  const compliance = extractCompliance(description);
  const features = extractFeaturePhrases(description);
  const benefits = extractBenefits(description);
  const applications = extractApplications(category, description);

  const attributes: ProductAttributes = {
    target_market: inferTargetMarket(category, description),
    features,
    benefits,
    applications,
    compliance_standards: compliance,
    certifications,
    materials
  };

  if (Object.keys(technicalSpecs).length > 0) {
    attributes.technical_specs = technicalSpecs;
  }

  if (technicalSpecs.neck_finish) {
    attributes.dimensions = { neck_finish: technicalSpecs.neck_finish };
  }

  return attributes;
}

function buildSolutions(product: SeedProduct): ProductSolutions {
  const description = cleanText(product.description ?? '');
  const category = cleanText(product.category ?? '');
  const sentences = splitSentences(description);
  const primaryUse = sentences[0] ?? `${product.name ?? 'Product'} for ${category || 'dispensing applications'}`;

  return {
    primary_use: primaryUse,
    key_benefits: extractBenefits(description),
    use_cases: extractApplications(category, description),
    industries: inferIndustries(category, description),
    technical_specs: extractTechnicalSpecs(description)
  };
}

function hasMetadata(attributes?: ProductAttributes, solutions?: ProductSolutions): boolean {
  const attrCount = attributes ? Object.values(attributes).filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === 'object') return Object.keys(value).length > 0;
    return Boolean(value);
  }).length : 0;

  const solCount = solutions ? Object.values(solutions).filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === 'object') return Object.keys(value).length > 0;
    return Boolean(value);
  }).length : 0;

  return attrCount > 0 || solCount > 0;
}

async function main(force = false): Promise<void> {
  const filePath = path.resolve(__dirname, '../db/products.json');
  const products = JSON.parse(await readFile(filePath, 'utf8')) as SeedProduct[];

  let updated = 0;

  const enriched = products.map((product) => {
    if (!force && hasMetadata(product.attributes, product.solutions)) {
      return product;
    }

    updated += 1;
    return {
      ...product,
      attributes: buildAttributes(product),
      solutions: buildSolutions(product)
    };
  });

  await writeFile(filePath, JSON.stringify(enriched, null, 4) + '\n', 'utf8');

  console.log(`Updated attributes and solutions for ${updated} of ${products.length} products.`);
}

main(true).catch((error) => {
  console.error(error);
  process.exit(1);
});
