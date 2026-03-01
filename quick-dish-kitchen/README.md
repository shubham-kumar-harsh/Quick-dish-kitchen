# QuickDishKitchen - Cloud Kitchen Website

A fully responsive, mobile-first website for an Indian cloud kitchen with an integrated admin panel for content management.

## Features

1. **Mobile-First Design**: Optimized for phones, tablets, and desktops
2. **Four Main Sections**:
   - Home: Brand introduction, offers, and order buttons
   - Offers: Display of current promotions
   - Order Online: Links to Swiggy and Zomato
   - Contact: Phone, WhatsApp, and location information
3. **Admin Control Panel**: Frontend-only content management
4. **Client-Side Data Storage**: Uses localStorage to save all changes
5. **No Backend Required**: Runs entirely in the browser

## Admin Panel Instructions

### Accessing the Admin Panel
1. Click the gear icon in the bottom-right corner of the screen
2. This opens the admin control panel

### Managing Offers
1. Go to the "Manage Offers" tab
2. View all existing offers with their status (Active/Inactive)
3. Click the toggle button to enable/disable offers
4. Click "Edit" to modify an offer
5. Click "Add New Offer" to create a new promotion

### Updating Links
1. Go to the "Update Links" tab
2. Update Swiggy and Zomato order links
3. Click "Save Links" to apply changes

### Updating Contact Information
1. Go to the "Contact Info" tab
2. Update phone number, WhatsApp link, and location
3. Click "Save Contact Info" to apply changes

### Data Management
1. Go to the "Data Management" tab
2. Export data: Download a JSON backup of all settings
3. Import data: Upload a previously exported JSON file
4. Reset data: Restore all settings to defaults

## How to Deploy

1. Upload all files to any static hosting service:
   - Netlify
   - GitHub Pages
   - Vercel
   - Any standard web hosting

2. No special configuration needed - just upload:
   - `index.html`
   - `style.css`
   - `script.js`

## Customization

### Changing Default Data
Edit the `defaultData` object in `script.js` (line 15-45) to change:
- Initial offers
- Default links
- Contact information

### Styling
Modify CSS variables in `style.css` (line 13-25) to change:
- Color scheme
- Font sizes
- Spacing

### Adding Images
Replace the placeholder icon in the hero section with actual food images by:
1. Adding image files to the `images/` folder
2. Updating the HTML to use actual `<img>` tags instead of the icon placeholder

## Technical Details

### Data Storage
- All data is stored in browser's localStorage under the key `quickdishkitchen_data`
- Data persists across browser sessions
- Changes appear instantly on the public site

### No Authentication
- The admin panel is accessible to anyone who knows to click the gear icon
- For production use, consider adding a simple password protection (frontend only)
- Example: Add a password prompt in the `toggleAdminPanel` function

### Browser Support
- Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- Responsive design works on all screen sizes

## License

This project is open source and available for modification and distribution.