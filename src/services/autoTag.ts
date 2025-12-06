/**
 * Offline auto-tagging service using rule-based pattern matching
 */

interface TagRule {
  keywords: string[];
  tag: string;
}

const TAG_RULES: TagRule[] = [
  // Food & Dining
  { keywords: ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'burger', 'pizza', 'food', 'dining', 'kitchen', 'grill', 'bistro', 'bar', 'pub'], tag: 'Food' },
  { keywords: ['grocery', 'supermarket', 'market', 'walmart', 'target', 'costco', 'whole foods', 'trader joe', 'safeway', 'kroger'], tag: 'Groceries' },
  
  // Transportation
  { keywords: ['gas', 'fuel', 'shell', 'chevron', 'exxon', 'bp', 'mobil', 'petrol', 'station'], tag: 'Gas' },
  { keywords: ['uber', 'lyft', 'taxi', 'cab', 'transport', 'parking', 'toll'], tag: 'Transportation' },
  
  // Shopping
  { keywords: ['amazon', 'ebay', 'shop', 'store', 'retail', 'mall', 'outlet'], tag: 'Shopping' },
  { keywords: ['clothing', 'apparel', 'fashion', 'nike', 'adidas', 'zara', 'h&m', 'uniqlo'], tag: 'Clothing' },
  { keywords: ['electronics', 'best buy', 'apple', 'samsung', 'computer', 'phone', 'tech'], tag: 'Electronics' },
  
  // Health & Wellness
  { keywords: ['pharmacy', 'cvs', 'walgreens', 'drug', 'medicine', 'prescription', 'health'], tag: 'Health' },
  { keywords: ['gym', 'fitness', 'yoga', 'sport', 'wellness'], tag: 'Fitness' },
  
  // Utilities & Services
  { keywords: ['electric', 'water', 'utility', 'internet', 'phone bill', 'cable'], tag: 'Utilities' },
  { keywords: ['insurance', 'premium', 'policy'], tag: 'Insurance' },
  
  // Entertainment
  { keywords: ['movie', 'cinema', 'theater', 'netflix', 'spotify', 'entertainment'], tag: 'Entertainment' },
  { keywords: ['hotel', 'airbnb', 'booking', 'accommodation', 'resort'], tag: 'Travel' },
  
  // Home & Garden
  { keywords: ['home depot', 'lowes', 'hardware', 'furniture', 'ikea', 'home', 'garden'], tag: 'Home' },
  
  // Personal Care
  { keywords: ['salon', 'barber', 'spa', 'beauty', 'cosmetic', 'sephora'], tag: 'Personal Care' },
  
  // Education
  { keywords: ['book', 'school', 'education', 'course', 'tuition', 'university'], tag: 'Education' },
  
  // Business
  { keywords: ['office', 'supplies', 'staples', 'business', 'professional'], tag: 'Business' },
];

export class AutoTagService {
  /**
   * Generate tags based on store name and OCR text
   */
  static generateTags(storeName: string, ocrText: string): string[] {
    const combinedText = `${storeName} ${ocrText}`.toLowerCase();
    const tags = new Set<string>();

    // Match against rules
    for (const rule of TAG_RULES) {
      for (const keyword of rule.keywords) {
        if (combinedText.includes(keyword.toLowerCase())) {
          tags.add(rule.tag);
          break;
        }
      }
    }

    return Array.from(tags);
  }

  /**
   * Get all available tag categories
   */
  static getAvailableTags(): string[] {
    return Array.from(new Set(TAG_RULES.map(rule => rule.tag))).sort();
  }
}
