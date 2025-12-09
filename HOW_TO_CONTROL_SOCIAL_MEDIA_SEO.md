# 🎨 How to Control Social Media & SEO (Like Yoast/Rank Math)

## 🎯 What You Have Now

Your site already has an **SEO component** that works just like Yoast SEO or Rank Math! It controls:
- ✅ Facebook previews (Open Graph)
- ✅ Twitter previews (Twitter Cards)
- ✅ LinkedIn previews
- ✅ Google Search appearance
- ✅ Page titles and descriptions
- ✅ Custom images for social sharing

---

## 📍 Where It Lives

**SEO Component:** `/app/frontend/src/components/SEO.jsx`

This component is already imported and used on your pages!

---

## 🎨 How to Change Social Media Images & Text

### Example: Home Page

**File:** `/app/frontend/src/pages/Home.jsx`

**Current SEO Setup:**
```jsx
<SEO 
  title="Premium Airport Shuttle & Transfer Services"
  description="Book reliable airport shuttle services in Auckland..."
  keywords="airport shuttle, Auckland airport transfer..."
  canonical="/"
  ogImage={`${siteUrl}/images/hero-image.jpg`}
/>
```

### What Each Field Controls:

1. **`title`** → Social media title + Google title
   - Facebook: Shows as heading when shared
   - Twitter: Shows as card title
   - Google: Shows in search results

2. **`description`** → Preview text on social media
   - Facebook: Shows below title
   - Twitter: Shows in card description
   - Google: Shows in search snippet

3. **`ogImage`** → The image shown when shared
   - Facebook: Large preview image
   - Twitter: Card image
   - LinkedIn: Preview image
   - WhatsApp: Thumbnail

4. **`keywords`** → SEO keywords for Google

5. **`canonical`** → Prevents duplicate content issues

---

## 🖼️ How to Change Social Media Images

### Option 1: Use Custom Image for Specific Page

**Example: Book Now Page**
```jsx
<SEO 
  title="Book Your Ride Now"
  description="Easy online booking for airport transfers"
  ogImage="https://bookaride.co.nz/images/booking-preview.jpg"
/>
```

### Option 2: Upload New Image

1. **Upload image to:** `/app/frontend/public/images/`
2. **Name it:** `social-preview.jpg` (or any name)
3. **Use in SEO:**
```jsx
<SEO 
  ogImage="/images/social-preview.jpg"
/>
```

### Option 3: Use External Image
```jsx
<SEO 
  ogImage="https://example.com/my-image.jpg"
/>
```

---

## 📱 Social Media Preview Examples

### Facebook/LinkedIn Preview
```
┌──────────────────────────────────┐
│  [Your Image Here]               │
│  1200x630px recommended          │
├──────────────────────────────────┤
│  Premium Airport Shuttle         │ ← title
│  Book reliable airport shuttle...│ ← description
│  bookaride.co.nz                 │ ← domain
└──────────────────────────────────┘
```

### Twitter Card Preview
```
┌──────────────────────────────────┐
│  Premium Airport Shuttle         │ ← title
│  Book reliable airport shuttle...│ ← description
│  ┌────────────────────────────┐  │
│  │  [Your Image]              │  │ ← ogImage
│  │  1200x630px                │  │
│  └────────────────────────────┘  │
│  bookaride.co.nz                 │
└──────────────────────────────────┘
```

---

## 🎯 Quick Guide: Update Social Media for Any Page

### Step 1: Find Your Page
Example: `/app/frontend/src/pages/BookNow.jsx`

### Step 2: Locate SEO Component
Look for:
```jsx
<SEO 
  title="..."
  description="..."
  ...
/>
```

### Step 3: Update Fields
```jsx
<SEO 
  title="Book Airport Transfer - Auckland"
  description="Quick and easy online booking for reliable airport shuttle services"
  ogImage="/images/booking-social.jpg"
  keywords="book airport shuttle, Auckland booking, online transfer"
/>
```

### Step 4: Deploy
Changes go live after deployment!

---

## 🖼️ Recommended Image Sizes

| Platform | Recommended Size | Aspect Ratio |
|----------|-----------------|--------------|
| **Facebook** | 1200 x 630 px | 1.91:1 |
| **Twitter** | 1200 x 628 px | 1.91:1 |
| **LinkedIn** | 1200 x 627 px | 1.91:1 |
| **Instagram** | 1080 x 1080 px | 1:1 |
| **Universal** | 1200 x 630 px | Works everywhere |

**Best Practice:** Use **1200 x 630 px** (works great on all platforms!)

---

## 📄 Current Pages & Their SEO

### 1. Home Page (`/`)
**File:** `/app/frontend/src/pages/Home.jsx`
```jsx
<SEO 
  title="Premium Airport Shuttle Services"
  ogImage="/images/home-preview.jpg"
/>
```

### 2. Book Now Page (`/book-now`)
**File:** `/app/frontend/src/pages/BookNow.jsx`
```jsx
<SEO 
  title="Book Your Airport Transfer"
  ogImage="/images/booking-preview.jpg"
/>
```

### 3. About Page (`/about`)
**File:** `/app/frontend/src/pages/About.jsx`
```jsx
<SEO 
  title="About BookaRide NZ"
  ogImage="/images/about-preview.jpg"
/>
```

---

## 🛠️ How to Add SEO to New Pages

### Step 1: Import SEO Component
```jsx
import SEO from '../components/SEO';
```

### Step 2: Add to Your Page
```jsx
export const MyNewPage = () => {
  return (
    <>
      <SEO 
        title="My New Page Title"
        description="Description for social media and Google"
        keywords="keyword1, keyword2, keyword3"
        canonical="/my-new-page"
        ogImage="/images/my-page-social.jpg"
      />
      
      <div>
        {/* Your page content */}
      </div>
    </>
  );
};
```

---

## 🎨 Creating Custom Social Media Images

### What to Include:

1. **Your Logo** - Brand recognition
2. **Key Message** - What's the page about?
3. **Call to Action** - "Book Now", "Learn More", etc.
4. **Contact Info** - Phone number (optional)
5. **Brand Colors** - Use gold (#D4AF37) for BookaRide

### Example Design:
```
┌──────────────────────────────────────┐
│  BookaRide.co.nz            [LOGO]   │
│                                      │
│  Premium Airport Transfers           │
│  Auckland | Hamilton | Whangarei     │
│                                      │
│  [Call Icon] +64 21 743 321          │
│                                      │
│  BOOK NOW →                          │
└──────────────────────────────────────┘
```

### Tools to Create Images:
- **Canva** (easiest) - canva.com
- **Figma** (professional) - figma.com
- **Photoshop** (advanced)

---

## 🧪 How to Test Social Media Previews

### Facebook Debugger
**URL:** https://developers.facebook.com/tools/debug/

1. Enter your page URL
2. Click "Debug"
3. See how it looks on Facebook
4. Click "Scrape Again" after changes

### Twitter Card Validator
**URL:** https://cards-dev.twitter.com/validator

1. Enter your page URL
2. See Twitter preview
3. Refresh after changes

### LinkedIn Post Inspector
**URL:** https://www.linkedin.com/post-inspector/

1. Enter your page URL
2. See LinkedIn preview
3. Refresh cache after changes

---

## 📊 Example: Update Home Page Social Media

### Before:
```jsx
// Default image, basic description
<SEO 
  title="BookaRide"
  description="Airport shuttle service"
/>
```

### After:
```jsx
// Custom image, compelling description
<SEO 
  title="Premium Airport Shuttle Services | Auckland NZ"
  description="Book reliable, comfortable airport transfers in Auckland. Professional drivers, 24/7 service, competitive rates. Your journey starts here!"
  keywords="airport shuttle Auckland, airport transfer NZ, reliable transport"
  ogImage="/images/social-media/home-facebook.jpg"
/>
```

**Result:** When shared on Facebook/Twitter:
- Shows custom image
- Compelling title
- Professional description
- Better click-through rate!

---

## 🎯 Best Practices

### 1. **Unique Images Per Page**
- Home page: Show your service
- Booking page: Show booking interface
- About page: Show team or vehicles

### 2. **Compelling Titles**
- ✅ "Book Premium Airport Shuttle - Auckland NZ"
- ❌ "Home - BookaRide"

### 3. **Action-Oriented Descriptions**
- ✅ "Book now and get 10% off your first ride!"
- ❌ "We are a transport company."

### 4. **Include Location**
- Helps with local SEO
- "Auckland", "New Zealand"

### 5. **Update Regularly**
- Seasonal promotions
- Special offers
- New services

---

## 🔄 Quick Updates Workflow

### To Change Social Media Image:

1. **Create new image** (1200x630px)
2. **Save to:** `/app/frontend/public/images/`
3. **Update page:**
```jsx
<SEO ogImage="/images/new-social-image.jpg" />
```
4. **Deploy**
5. **Test on Facebook Debugger**

### To Change Title/Description:

1. **Edit page file** (e.g., `Home.jsx`)
2. **Update SEO component:**
```jsx
<SEO 
  title="New Title Here"
  description="New description here"
/>
```
3. **Deploy**

---

## 📱 Current Social Media Setup

**What's Already Working:**

✅ **Facebook:** Open Graph meta tags
✅ **Twitter:** Twitter Card meta tags  
✅ **LinkedIn:** Uses Open Graph
✅ **WhatsApp:** Shows image preview
✅ **Google:** Title & description in search
✅ **Slack:** Link preview with image

**All platforms will show:**
- Your custom title
- Your custom description
- Your custom image
- Your site URL

---

## 💡 Pro Tips

### 1. **Test Before Sharing**
Always test on Facebook Debugger before major launches

### 2. **Mobile-Friendly**
Images should look good on mobile too

### 3. **Text Overlay**
Keep text large and readable in images

### 4. **Brand Consistency**
Use same colors/style across all images

### 5. **Update Old Content**
Refresh social media images for existing pages

---

## 🎉 You're Ready!

Your site has the same functionality as Yoast SEO or Rank Math:

✅ Control titles and descriptions
✅ Custom social media images
✅ Facebook, Twitter, LinkedIn previews
✅ Google search optimization
✅ Per-page customization
✅ Easy to update

**Just edit the SEO component on any page and you're done!**

---

## 📞 Need Help?

If you want me to:
- Create custom social media images
- Update specific pages
- Add SEO to new pages
- Optimize current SEO

Just let me know!
