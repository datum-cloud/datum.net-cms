# Custom Field Labels in Strapi

Strapi does not support custom labels in `schema.json`. Field labels are derived from attribute names (e.g. `metaTitle` → "Meta Title").

To show friendlier labels in the Content Manager:

## Configure the View

1. Go to **Content Manager** → select a content type (e.g. Blog Post)
2. Open an entry or the list view
3. Click the **Configure the view** (gear icon) button
4. In the Edit view, click on a field name to open its settings
5. Set the **Label** to your custom text (e.g. "SEO Page Title", "Meta Description", "Share Image")
6. Click **Save**

## Suggested Labels for SEO Component

| Attribute      | Suggested Label          |
|----------------|--------------------------|
| metaTitle      | SEO Page Title           |
| metaDescription| Meta Description         |
| shareImage     | Share Image (OG)         |
| ogTitle        | Open Graph Title         |
| ogDescription  | Open Graph Description   |

**Note:** View configuration is stored in the database per environment. Configure it on each Strapi instance (local, staging, production) or after fresh deploys.
