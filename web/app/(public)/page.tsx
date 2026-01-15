
import db from "@/lib/db";
import { LandingPageContent } from "@/components/landing-page-content";

export default function LandingPage() {
    // Server-side data fetching
    const faqs = db.prepare("SELECT * FROM FAQ WHERE is_active = 1 AND (category = 'General' OR category = 'Pricing') ORDER BY display_order ASC LIMIT 5").all();

    return (
        <LandingPageContent faqs={faqs} />
    );
}
