export interface LeadEntry {
  id: string;
  date: string;
  name: string;
  email: string;
  phone: string;
  from_location: string;
  to_location: string;
  current_floor: string;
  destination_floor: string;
  current_size: string;
  destination_size: string;
  move_date: string;
  move_type: string;
  message: string;
  quoteNumber?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  image: string;
  category: string;
  slug?: string;
  publishedAt?: string;
  url?: string;
}

export interface SiteContent {
  logoUrl: string;
  siteName: string;
  siteTagline: string;
  heroHeadline: string;
  heroHighlight: string;
  heroSubtext: string;
  heroCTA: string;
  heroCallText: string;
  heroBgImage: string;
  whyUsImage: string;
  phone: string;
  email: string;
  website: string;
  footerText: string;
  serviceImages: string[];
  blogSectionHeadline: string;
  blogSectionSubtext: string;
  blogPosts: BlogPost[];
  defaultTerms?: string[];
}
export interface LeadEntry {
  id: string;
  date: string;
  name: string;
  email: string;
  phone: string;
  from_location: string;
  to_location: string;
  current_floor: string;
  destination_floor: string;
  current_size: string;
  destination_size: string;
  move_date: string;
  move_type: string;
  message: string;
  quoteNumber?: string;
  // ----- added for new dashboard features -----
  status?: string;
  status_updated_at?: string;
  created_at?: string;
  notes?: string;
  admin_notes?: string;
  viewed_at?: string;
  last_updated_by?: string;
}

export const defaultSiteContent: SiteContent = {
  logoUrl:
    "https://nxqonargxulgqfdlhwtm.supabase.co/storage/v1/object/public/site-images/logo.webp",
  siteName: "Boxed With Care Movers",
  siteTagline: "MOVERS & PACKERS",
  heroHeadline: "Nairobi's Trusted Movers & Packers.",
  heroHighlight: "Nairobi",
  heroSubtext:
    "Boxed With Care offers professional moving and packing services in Nairobi, Kenya — residential, office, and long-distance relocations handled with care and precision.",
  heroCTA: "Get a Free Quote",
  heroCallText: "View Services",
  heroBgImage: "",
  whyUsImage:
    "https://images.pexels.com/photos/4246121/pexels-photo-4246121.jpeg?auto=compress&cs=tinysrgb&w=800",
  phone: "+254 748 851 679",
  email: "info@boxedwithcare.co.ke",
  website: "http://boxedwithcare.co.ke/",
  footerText:
    "Trusted moving and packing specialists. We handle your belongings with the care they deserve — every box, every step of the way.",
  serviceImages: [
    "https://images.pexels.com/photos/6474471/pexels-photo-6474471.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/7262416/pexels-photo-7262416.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/1427541/pexels-photo-1427541.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&w=600",
    "https://images.pexels.com/photos/7937307/pexels-photo-7937307.jpeg?auto=compress&cs=tinysrgb&w=600",
  ],
  blogSectionHeadline: "Moving Tips, Planning Guides, and Packing Advice",
  blogSectionSubtext:
    "Stay informed with practical moving articles that help make every relocation smoother, safer, and more predictable.",
  blogPosts: [
    {
      id: "moving-checklist",
      title: "The Essential Moving Checklist for Every Home",
      excerpt:
        "A practical moving checklist to keep your relocation organized from first box to final unpacking. Prepare smarter, move easier, and avoid last-minute stress.",
      content:
        "A practical moving checklist can remove the guesswork from moving day. Start by labeling boxes by room, pack essential documents separately, and keep fragile items cushioned with soft materials. Confirm access at both locations, reserve elevator time if needed, and prepare a small essentials bag with chargers, toiletries, and a change of clothes. On moving day, load the heaviest items first, keep pathways clear, and do a final walkthrough before handing over the keys. The goal is to reduce stress and make the transition feel controlled from the first box to the last.",
      image:
        "https://images.pexels.com/photos/5849141/pexels-photo-5849141.jpeg?auto=compress&cs=tinysrgb&w=1200",
      category: "Moving Tips",
      slug: "essential-moving-checklist",
    },
    {
      id: "packing-hacks",
      title: "Packing Hacks That Protect Fragile Belongings",
      excerpt:
        "Discover clever packing strategies to safeguard fragile items and valuables during transport. Learn what materials work best and where to apply them.",
      content:
        "Protecting fragile belongings starts with the right materials and a consistent packing system. Use double-walled boxes for heavier fragile items, wrap each piece individually, and fill empty space so items cannot shift. Stack plates vertically, use towels or paper to cushion gaps, and clearly mark boxes as fragile on multiple sides. Keep glass, ceramics, and electronics away from moisture and heat, and load them last so they are handled with care during unloading. A little extra organization prevents expensive breakage and gives you peace of mind.",
      image:
        "https://images.pexels.com/photos/6841809/pexels-photo-6841809.jpeg?auto=compress&cs=tinysrgb&w=1200",
      category: "Packing",
      slug: "packing-hacks-fragile-belongings",
    },
    {
      id: "moving-costs",
      title: "How to Estimate Moving Costs for Your Budget",
      excerpt:
        "Understand the key factors that shape moving costs so you can budget confidently and avoid surprises. From distance to service levels, here is what matters.",
      content:
        "Moving costs usually depend on a mix of distance, volume, labor, access, and timing. Local moves often focus on hourly labor, while longer moves may factor in mileage, fuel, and packing support. If your property has stairs, tight corners, or limited parking, plan for more handling time. Full-service packing, specialty item handling, and last-minute scheduling can also increase the final total. The best way to budget is to request a clear estimate, compare what is included, and keep a small buffer for unexpected needs.",
      image:
        "https://images.pexels.com/photos/7045559/pexels-photo-7045559.jpeg?auto=compress&cs=tinysrgb&w=1200",
      category: "Planning",
      slug: "estimate-moving-costs-budget",
    },
  ],
  defaultTerms: [
    "A 30% deposit is required to confirm the booking.",
    "This quotation remains valid for one month from the issue date.",
    "Delays caused by traffic, weather, or building access restrictions may affect timelines.",
    "Fragile or high-value items should be declared before moving day.",
    "Final payment is due immediately upon successful completion of the move.",
  ],
};
