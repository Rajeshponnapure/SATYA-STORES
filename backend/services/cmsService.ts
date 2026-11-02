import { getDatabase, saveDatabase } from "../db/database";
import { Coupon, MarqueeItem, HomepageSection } from "../types";

export const cmsService = {
  // Coupons
  async getAllCoupons(): Promise<Coupon[]> {
    const db = await getDatabase();
    return db.coupons || [];
  },

  async addCoupon(data: Omit<Coupon, "id">): Promise<{ success: boolean; coupon?: Coupon }> {
    const db = await getDatabase();
    if (!db.coupons) db.coupons = [];

    const newCoupon: Coupon = {
      ...data,
      id: `coup-${Date.now()}`,
      code: data.code.toUpperCase().trim(),
    };

    db.coupons.push(newCoupon);
    await saveDatabase(db);
    return { success: true, coupon: newCoupon };
  },

  async deleteCoupon(id: string): Promise<{ success: boolean }> {
    const db = await getDatabase();
    if (!db.coupons) return { success: true };
    db.coupons = db.coupons.filter((c) => c.id !== id);
    await saveDatabase(db);
    return { success: true };
  },

  async applyCoupon(
    code: string,
    subtotal: number
  ): Promise<{ success: boolean; discount: number; coupon?: Coupon; error?: string }> {
    const db = await getDatabase();
    const coupon = (db.coupons || []).find(
      (c) => c.code.toUpperCase() === code.toUpperCase().trim() && c.status === "active"
    );

    if (!coupon) {
      return { success: false, discount: 0, error: "Invalid or expired coupon code." };
    }

    if (subtotal < coupon.minOrderValue) {
      return {
        success: false,
        discount: 0,
        error: `Minimum order value of ₹${coupon.minOrderValue.toLocaleString("en-IN")} required for this coupon.`,
      };
    }

    let discount = 0;
    if (coupon.discountType === "fixed") {
      discount = coupon.discountValue;
    } else {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    }

    discount = Math.min(discount, subtotal);
    return { success: true, discount, coupon };
  },

  // Marquees
  async getAllMarquees(): Promise<MarqueeItem[]> {
    const db = await getDatabase();
    return db.marquees || [];
  },

  async addMarquee(data: Omit<MarqueeItem, "id">): Promise<{ success: boolean; marquee?: MarqueeItem }> {
    const db = await getDatabase();
    if (!db.marquees) db.marquees = [];

    const newMarquee: MarqueeItem = {
      ...data,
      id: `marq-${Date.now()}`,
    };

    db.marquees.push(newMarquee);
    await saveDatabase(db);
    return { success: true, marquee: newMarquee };
  },

  async deleteMarquee(id: string): Promise<{ success: boolean }> {
    const db = await getDatabase();
    if (!db.marquees) return { success: true };
    db.marquees = db.marquees.filter((m) => m.id !== id);
    await saveDatabase(db);
    return { success: true };
  },

  // Homepage Sections & Layout Preview
  async getHomepageSections(): Promise<HomepageSection[]> {
    const db = await getDatabase();
    return (db.homepageSections || []).sort((a, b) => a.order - b.order);
  },

  async updateHomepageSections(sections: HomepageSection[]): Promise<{ success: boolean }> {
    const db = await getDatabase();
    db.homepageSections = sections;
    await saveDatabase(db);
    return { success: true };
  },
};

