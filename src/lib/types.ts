export interface Software {
  id: string;
  name: string;
  slug: string;
  version: string;
  size: string;
  platform: ('windows' | 'mac' | 'linux' | 'android' | 'ios')[];
  category: string;
  description: string;
  longDescription: string;
  icon: string;
  screenshots: string[];
  downloadUrl: string;
  officialSite: string;
  license: string;
  language: string[];
  updateDate: string;
  downloads: number;
  rating: number;
  tags: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  count: number;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
}
