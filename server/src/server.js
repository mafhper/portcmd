import { createApp } from './app.js';

const PORT = process.env.PORT || 3001;
const app = createApp();

app.listen(PORT, () => {
    // Only log if not in "Premium Dev Mode" (which handles banners)
    // or log a structured JSON if needed. For now simple log.
    if (!process.env.SILENT_BOOT) {
        console.log(`Backend API running on http://localhost:${PORT}`);
    }
});
