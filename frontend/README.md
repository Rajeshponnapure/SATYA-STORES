# 🎨 Satya Stores — Frontend Architecture

This directory houses all client-facing UI components, screens, responsive mobile layouts, and state management.

---

## Folder Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx                 # Sticky navigation, live search, role toggle
│   │   ├── Footer.tsx                 # Vasavi Enterprises trust badges & policy links
│   │   ├── MobileBottomNav.tsx        # Fixed 5-tab mobile bottom bar
│   │   └── AnimatedGridBackground.tsx # Eye-comfort soft pearl canvas with micro-grid
│   │
│   └── storefront/
│       ├── HeroBanner.tsx             # Promotional slider with smooth transitions
│       ├── CategoryGrid.tsx           # Horizontal swipe mobile category rail
│       └── ProductCard.tsx            # 2-column mobile e-commerce product card
│
├── context/
│   └── StoreContext.tsx               # Client state, persistent cart, optimistic updates
│
└── app/
    ├── page.tsx                       # Storefront Homepage
    ├── category/[slug]/page.tsx       # Department catalog with filters
    ├── product/[slug]/page.tsx        # Product detail with sticky mobile purchase bar
    ├── cart/page.tsx                  # Shopping cart & free delivery gauge
    ├── checkout/page.tsx              # 3-step checkout with instant UPI ID copying
    ├── orders/page.tsx                # Customer order history
    ├── orders/[id]/page.tsx           # Multi-state order tracking timeline
    └── admin/page.tsx                 # Single-Owner Administration Portal
```

---

## 📱 Mobile-First Responsive Standards
- **Grid**: Strict 2-column layout (`grid-cols-2`) on mobile viewports (< 640px).
- **Touch**: Minimum 44px–48px thumb touch targets.
- **Eye-Comfort**: Soft alabaster canvas (`#F4F6F9`) with 0.05 opacity animated indigo grid lines.

