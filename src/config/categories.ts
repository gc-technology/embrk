export type Category = {
  slug: string;
  name: string;
};

export type ModeConfig = {
  slug: 'technical' | 'marketing';
  name: string;
  categories: Category[];
};

export type FlavorOption = {
  slug: string;
  name: string;
  description: string;
};

// TODO(admin): replace with API fetch from /api/admin/flavors
export const FLAVOR_OPTIONS: FlavorOption[] = [
  { slug: 'literal', name: 'Literal', description: 'Faithful, clear depiction of the brief' },
  { slug: 'stylized', name: 'Stylized', description: 'Visually distinctive with strong artistic choices' },
  { slug: 'abstract', name: 'Abstract', description: 'Conceptual, non-literal representation' },
  { slug: 'conceptual', name: 'Conceptual', description: 'Idea-driven, metaphorical interpretation' },
];

// TODO(admin): replace with API fetch from /api/admin/modes
export const MODES_CONFIG: ModeConfig[] = [
  {
    slug: 'technical',
    name: 'Technical',
    categories: [
      { slug: 'logo', name: 'Logo' },
      { slug: 'product-photography', name: 'Product Photography' },
      { slug: 'industrial', name: 'Industrial / Conceptualization' },
    ],
  },
  {
    slug: 'marketing',
    name: 'Marketing',
    categories: [
      { slug: 'promotional', name: 'Promotional Content' },
      { slug: 'ugc', name: 'User Generated Content' },
    ],
  },
];
