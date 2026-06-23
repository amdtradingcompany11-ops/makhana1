# 🚀 Deployment & Shopify Sync Guide for Shuddh Premium Makhana

This guide explains:
1. **How to fix the blank screen on Cloudflare Pages** (Uploading the correct files).
2. **How to get your Shopify Storefront API Access Token** and connect your actual products.

---

## 🛑 Why is your site currently showing a blank white page on truemakhana.pages.dev?

When you uploaded your code or built it on GitHub previously, Vite defaulted to **absolute paths** (e.g. `/assets/...`). When deployed on some sub-pages, custom subfolders, or deep routes, the browser looks for the assets on the root domain instead of your deploy's location, causing a **404 error** and a completely blank page.

### 💖 Fixed for You!
I have configured **`base: './'`** inside **`vite.config.ts`**. This forces all builds to use **relative paths** (e.g. `assets/...` instead of `/assets/...`). 
This guarantees your site will load and render flawlessly **on any platform, GitHub, or Cloudflare folder structure!**

To deploy this site now, you should follow one of the two options below:

---

## Part 1: How to Deploy to Cloudflare Pages (Choose Option A or B)

### Option A: Connect your GitHub (Recommended)
This is the best method because Cloudflare builds your TypeScript code automatically on their servers every time you push an update to your repository.

1. **Upload your code to GitHub** (you can do this via the "Export to GitHub" button in the AI Studio settings menu).
2. Go to your **Cloudflare Dashboard** and select **Workers & Pages** > **Create application** > **Pages** tab.
3. Click **Connect GitHub**.
4. Select your repository.
5. In the Build Settings:
   - **Framework Preset**: Choose `Vite` (or `None`).
   - **Build Command**: `npm run build:static` (This is optimized for static Cloudflare Pages and builds instantly).
   - **Build Output Directory**: `dist`
6. Click **Save and Deploy**. Cloudflare will compile your site and make it live in under a minute!

---

### Option B: Hand-Upload the built `dist/` folder (Easiest static manual method)
If you prefer dragging and dropping without GitHub:

1. **Download the project ZIP** to your computer.
2. Unzip it and open your computer's terminal in that folder.
3. Install dependencies by running:
   ```bash
   npm install
   ```
4. Build the production static files by running:
   ```bash
   npm run build
   ```
5. You will see a new folder called `dist/` appear in your project root.
6. **Go to Cloudflare Pages** "Upload your static files".
7. Drag and drop **only the contents inside the `dist` folder** into Cloudflare. 
8. Click **Deploy**. Your site is now live!

---

## Part 2: How to Get Your Shopify Storefront Access Token

You opened the Shopify App Development screen (`dev.shopify.com`). This is the platform for public app developers. For your private store makhana catalog sync, you can get the Storefront API token much more easily inside your **Shopify Store Admin Panel**:

1. Log into your store at **[admin.shopify.com/store/shuddh-premium-makhana](https://admin.shopify.com/store/shuddh-premium-makhana)**.
2. In the bottom-left corner, click **Settings**.
3. In the left-hand sidebar, click **Apps and sales channels**.
4. Click the **Develop apps** button (located in the top menu bar of that screen).
5. Click **Allow custom app development** (if you haven't enabled it before) and confirm.
6. Click **Create an app**.
7. Enter an app name (for example: `Makhana Headless Storefront`) and select your developer email, then click **Create app**.
8. Go to the **Configuration** tab:
   - Scroll down to **Storefront API integration** and click **Configure**.
   - Under **Storefront API access scopes**, check/tick **all checkmarks** (specifically `unauthenticated_read_product_listings`, `unauthenticated_read_product_tags`, `unauthenticated_read_product_inventory`, etc.).
   - Click **Save** at the top right.
9. Click the **API credentials** tab:
   - Click the green **Install app** button at the top right and confirm the installation.
   - Under the **Storefront API access token** card, you will see your token! (It begins with `shpca_`).
   - Copy this token.

---

## Part 3: Connecting Your Token to Your Site

### For Local Dev & Private Hosting (Full-Stack)
Add these environment variables to your variables config (such as `.env` or in AI Studio's **Settings > Secrets** panel):
```env
SHOPIFY_STORE_DOMAIN=shuddh-premium-makhana.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_shpca_access_token_here
```

### For Static Hosting fallback (Cloudflare Pages)
Add these environment variables inside Cloudflare Pages Settings (under **Settings > Variables > Environment Variables**) during setup:
```env
VITE_SHOPIFY_STORE_DOMAIN=shuddh-premium-makhana.myshopify.com
VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_shpca_access_token_here
```
This ensures your static frontend can query Shopify directly from the browser!
