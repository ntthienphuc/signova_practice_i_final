export interface NavLink {
  label: string;
  href: string;
}

export interface NavData {
  links: NavLink[];
  cta: string;
}

export interface HeroData {
  headline: string;
  subheadline: string;
  ctaPrimary: string;
  ctaSecondary: string;
  badge: string;
}

export interface ProblemData {
  heading: string;
  body: string;
}

export interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

export interface FeaturesData {
  heading: string;
  subheading: string;
  items: FeatureItem[];
}

export interface ProductItem {
  icon: string;
  title: string;
  description: string;
  tag: string;
  path?: string;
}

export interface ProductsData {
  heading: string;
  subheading: string;
  items: ProductItem[];
}

export interface TargetUserItem {
  icon: string;
  title: string;
  description: string;
}

export interface TargetUsersData {
  heading: string;
  subheading: string;
  items: TargetUserItem[];
}

export interface PricingItem {
  name: string;
  target: string;
  price: string;
  period: string;
  highlight: boolean;
  features: string[];
  cta: string;
}

export interface PricingData {
  heading: string;
  subheading: string;
  items: PricingItem[];
}

export interface ValuePropItem {
  role: string;
  icon: string;
  props: string[];
}

export interface ValuePropsData {
  heading: string;
  subheading: string;
  items: ValuePropItem[];
}

export interface CTAFooterData {
  heading: string;
  sub: string;
  cta: string;
}

export interface FooterData {
  tagline: string;
  copy: string;
}

export interface LandingData {
  nav: NavData;
  hero: HeroData;
  problem: ProblemData;
  features: FeaturesData;
  products: ProductsData;
  targetUsers: TargetUsersData;
  pricing: PricingData;
  valueProps: ValuePropsData;
  ctaFooter: CTAFooterData;
  footer: FooterData;
}
