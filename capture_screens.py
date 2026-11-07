import os
import subprocess
import time
from PIL import Image, ImageDraw, ImageFont

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
OUTPUT_DIR = r"C:\Users\ULS\Desktop\ERP for Egypt\FactoryFlow_ERP_Screenshots"
BASE_URL = "http://localhost:5173"

os.makedirs(OUTPUT_DIR, exist_ok=True)

# 1. Screen capture definitions
SCREENS = [
    {
        "id": "02_dashboard_overview",
        "url": f"{BASE_URL}/?tab=dashboard",
        "title": "Executive Dashboard & Factory KPIs"
    },
    {
        "id": "03_sales_crm_orders",
        "url": f"{BASE_URL}/?tab=sales",
        "title": "CRM, Quotations & Customer Sales Orders"
    },
    {
        "id": "04_engineering_bom",
        "url": f"{BASE_URL}/?tab=engineering",
        "title": "Engineering Specs & Multi-Level BOM"
    },
    {
        "id": "05_mto_production_orders",
        "url": f"{BASE_URL}/?tab=production",
        "title": "Make-to-Order Production Orders & Job Cards"
    },
    {
        "id": "06_inventory_reservations",
        "url": f"{BASE_URL}/?tab=inventory",
        "title": "Raw Material Inventory & Order Reservations"
    },
    {
        "id": "07_procurement_suppliers",
        "url": f"{BASE_URL}/?tab=procurement",
        "title": "Procurement, Shortage Purchase Requests & POs"
    },
    {
        "id": "08_finance_eta_invoices",
        "url": f"{BASE_URL}/?tab=finance",
        "title": "Finance & Egyptian Tax Authority E-Invoices"
    },
    {
        "id": "09_quality_control",
        "url": f"{BASE_URL}/?tab=quality",
        "title": "Quality Assurance, In-Process QC & Tolerance Checks"
    },
    {
        "id": "10_hr_workforce",
        "url": f"{BASE_URL}/?tab=workforce",
        "title": "HR, Operator Labor Hours & Shift Tracking"
    },
    {
        "id": "11_reports_intelligence",
        "url": f"{BASE_URL}/?tab=reports",
        "title": "Order Delivery & Work Center Efficiency Reports"
    },
    {
        "id": "12_ai_manufacturing_copilot",
        "url": f"{BASE_URL}/?tab=ai",
        "title": "AI Manufacturing Copilot & ERP Intelligence"
    },
    {
        "id": "13_arabic_rtl_interface",
        "url": f"{BASE_URL}/?tab=dashboard&lang=ar",
        "title": "Complete Arabic RTL Localization & Translation"
    },
    {
        "id": "14_settings_tax_config",
        "url": f"{BASE_URL}/?tab=settings",
        "title": "Egyptian Statutory Tax Settings (14% VAT / 1% WHT)"
    }
]

print("[*] Starting high-resolution 1920x1080 screen capture...")

for item in SCREENS:
    out_path = os.path.join(OUTPUT_DIR, f"{item['id']}.png")
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--disable-gpu",
        "--virtual-time-budget=3500",
        "--window-size=1920,1080",
        f"--screenshot={out_path}",
        item["url"]
    ]
    print(f"Capturing: {item['title']} -> {item['id']}.png")
    subprocess.run(cmd, check=True)
    size = os.path.getsize(out_path)
    print(f"  -> Saved ({size:,} bytes)")

# 2. Generate Intro and Outro Branded Title Cards (1920x1080)
def create_branded_card(filename, title, subtitle, tag, bullets):
    img = Image.new("RGB", (1920, 1080), color=(15, 23, 42)) # Deep Slate Industrial Navy
    draw = ImageDraw.Draw(img)

    # Accent decorative gradient/bars
    draw.rectangle([0, 0, 1920, 16], fill=(16, 185, 129)) # Emerald accent bar
    draw.rectangle([0, 1064, 1920, 1080], fill=(16, 185, 129))

    # Grid / industrial watermark lines
    for x in range(0, 1920, 120):
        draw.line([(x, 16), (x, 1064)], fill=(30, 41, 59), width=1)
    for y in range(16, 1064, 120):
        draw.line([(0, y), (1920, y)], fill=(30, 41, 59), width=1)

    # Badge Tag
    draw.rounded_rectangle([200, 220, 520, 265], radius=12, fill=(6, 78, 59))
    draw.text((220, 232), tag.upper(), fill=(110, 231, 183))

    # Main Title
    draw.text((200, 300), title, fill=(255, 255, 255))
    draw.text((200, 400), subtitle, fill=(148, 163, 184))

    # Decorative separator
    draw.line([(200, 480), (1000, 480)], fill=(51, 65, 85), width=2)

    # Feature Bullets
    y_pos = 520
    for b in bullets:
        draw.ellipse([200, y_pos + 6, 214, y_pos + 20], fill=(16, 185, 129))
        draw.text((235, y_pos), b, fill=(241, 245, 249))
        y_pos += 60

    # Egyptian Manufacturing Stamp
    draw.rounded_rectangle([1350, 320, 1720, 720], radius=24, fill=(30, 41, 59), outline=(51, 65, 85), width=2)
    draw.text((1390, 380), "FACTORYFLOW", fill=(255, 255, 255))
    draw.text((1390, 440), "MTO ENTERPRISE", fill=(52, 211, 153))
    draw.text((1390, 500), "EGYPT EDITION", fill=(203, 213, 225))
    draw.text((1390, 560), "10th of Ramadan City", fill=(148, 163, 184))
    draw.text((1390, 620), "ETA E-Invoicing v1.0", fill=(110, 231, 183))

    img.save(os.path.join(OUTPUT_DIR, filename))
    print(f"  -> Branded Card: {filename} created")

create_branded_card(
    "01_intro_title.png",
    "FACTORYFLOW ERP",
    "Intelligent Manufacturing. Complete Business Control.",
    "AI-Powered Make-to-Order ERP for Egypt",
    [
        "Strict Make-to-Order (MTO) Architecture -- Zero Make-to-Stock Wastage",
        "Automatic BOM Explosion, Stock Reservation & Shortage Procurement",
        "Egyptian Statutory Compliance: EGP Currency, 14% VAT, 1% WHT & ETA v1.0",
        "Bilingual AI Manufacturing Copilot with Real ERP Database Tool Calling"
    ]
)

create_branded_card(
    "15_closing_branding.png",
    "FACTORYFLOW ERP",
    "One Platform. Complete Factory Management.",
    "Built for Make-to-Order Manufacturing",
    [
        "Designed specifically for Egyptian manufacturing factories & industrial zones",
        "End-to-End order traceability: Customer Quote to Production, QA, and ETA Invoice",
        "Full English and Arabic native RTL localization with instant switching",
        "Proven production architecture with 100% verified database transactions"
    ]
)

print("\n[OK] All 15 high-definition visual assets generated successfully!")
