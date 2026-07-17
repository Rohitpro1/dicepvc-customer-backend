import io
import logging
from datetime import datetime, timezone
from typing import Optional

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from app.core.database import col
from app.core.exceptions import NotFoundException, ForbiddenException
from app.models.helpers import serialize_many

logger = logging.getLogger("invoice_service")


async def generate_invoice_pdf_buffer(payment_id: str, user_id: str, role: str) -> io.BytesIO:
    """Generates a professionally styled, print-ready, GST-compliant PDF invoice using ReportLab."""
    # 1. Load payment details
    payment = await col("payments").find_one({"id": payment_id})
    if not payment:
        payment = await col("payments").find_one({"razorpay_payment_id": payment_id})
    if not payment:
        raise NotFoundException("Payment record not found.")

    # 2. Load order details
    order = await col("orders").find_one({"id": payment["order_id"]})
    if not order:
        raise NotFoundException("Order record not found.")

    # 3. Check ownership
    if role not in ("admin", "support", "super_admin") and order["user_id"] != user_id:
        raise ForbiddenException("Access to invoice is forbidden.")

    # 4. Load billing profiles
    customer = await col("customers").find_one({"user_id": order["user_id"]})
    user_doc = await col("users").find_one({"id": order["user_id"]})

    billing_name = customer.get("company_name") if customer else (user_doc["name"] if user_doc else "Customer")
    gstin = customer.get("gstin", "N/A") if customer else "N/A"
    billing_address = "N/A"
    billing_state = "Maharashtra"

    if customer and customer.get("billing_address"):
        addr = customer["billing_address"]
        billing_address = f"{addr.get('line1', '')}, {addr.get('line2', '')}, {addr.get('city', '')}, {addr.get('state', '')} - {addr.get('postal_code', '')}"
        billing_state = addr.get("state", "Maharashtra").strip()

    # 5. GST calculations (18% tax is included in order["amount"])
    total_amount = float(payment["amount"])
    base_price = total_amount / 1.18
    total_tax = total_amount - base_price

    # Operating state is Maharashtra
    is_local = billing_state.lower() in ("maharashtra", "mh")
    if is_local:
        cgst_rate = 9.0
        sgst_rate = 9.0
        igst_rate = 0.0
        cgst_amt = total_tax / 2.0
        sgst_amt = total_tax / 2.0
        igst_amt = 0.0
    else:
        cgst_rate = 0.0
        sgst_rate = 0.0
        igst_rate = 18.0
        cgst_amt = 0.0
        sgst_amt = 0.0
        igst_amt = total_tax

    # 6. Build PDF in-memory buffer
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        "InvoiceTitle",
        parent=styles["Heading1"],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#1A365D"),
        spaceAfter=15
    )
    section_title = ParagraphStyle(
        "SectionTitle",
        parent=styles["Heading2"],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#2B6CB0"),
        spaceBefore=10,
        spaceAfter=5
    )
    body_style = ParagraphStyle(
        "InvoiceBody",
        parent=styles["BodyText"],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#2D3748")
    )
    table_header_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontSize=9,
        leading=11,
        textColor=colors.white,
        fontName="Helvetica-Bold"
    )

    elements = []

    # Title & Corporate Info Table
    elements.append(Paragraph("TAX INVOICE", title_style))
    
    corp_data = [
        [
            Paragraph(f"<b>Invoice ID:</b> {payment['id']}<br/><b>Date:</b> {payment['created_at'].strftime('%Y-%m-%d') if isinstance(payment['created_at'], datetime) else str(payment['created_at'])}<br/><b>Payment Mode:</b> {payment['method']}", body_style),
            Paragraph("<b>Seller Info:</b><br/>Antigravity DicePVC Corp<br/>GSTIN: 27ANTIGRAV1234Z<br/>Mumbai, Maharashtra, India", body_style)
        ]
    ]
    t1 = Table(corp_data, colWidths=[250, 250])
    t1.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    elements.append(t1)
    elements.append(Spacer(1, 15))

    # Billing Details
    elements.append(Paragraph("BILLING DETAILS", section_title))
    billing_data = [
        [
            Paragraph(f"<b>Billed To:</b><br/>{billing_name}<br/>GSTIN: {gstin}<br/>{billing_address}", body_style)
        ]
    ]
    t2 = Table(billing_data, colWidths=[500])
    t2.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F7FAFC")),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
    ]))
    elements.append(t2)
    elements.append(Spacer(1, 20))

    # Line Items Table
    plan_name = order.get("plan_id", "SaaS Plan")
    items_data = [
        [
            Paragraph("Description", table_header_style),
            Paragraph("Qty", table_header_style),
            Paragraph("Taxable Value", table_header_style),
            Paragraph("GST Split", table_header_style),
            Paragraph("Total Amount", table_header_style)
        ],
        [
            Paragraph(f"<b>DicePVC Subscription Plan ({plan_name})</b><br/>Order ID: {order['id']}", body_style),
            Paragraph("1", body_style),
            Paragraph(f"INR {base_price:.2f}", body_style),
            Paragraph(
                f"CGST @ {cgst_rate}%: INR {cgst_amt:.2f}<br/>SGST @ {sgst_rate}%: INR {sgst_amt:.2f}<br/>IGST @ {igst_rate}%: INR {igst_amt:.2f}",
                body_style
            ),
            Paragraph(f"INR {total_amount:.2f}", body_style)
        ]
    ]
    
    t3 = Table(items_data, colWidths=[150, 40, 90, 130, 90])
    t3.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1A365D")),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E0")),
    ]))
    elements.append(t3)
    elements.append(Spacer(1, 20))

    # Summary
    summary_data = [
        ["", Paragraph(f"<b>Sub-Total (Taxable Value):</b> INR {base_price:.2f}", body_style)],
        ["", Paragraph(f"<b>Total Tax (18% GST):</b> INR {total_tax:.2f}", body_style)],
        ["", Paragraph(f"<b>Grand Total (Inclusive of Tax):</b> INR {total_amount:.2f}", body_style)]
    ]
    t4 = Table(summary_data, colWidths=[300, 200])
    t4.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(t4)
    elements.append(Spacer(1, 30))

    # Footer Notes
    elements.append(Paragraph("<b>Terms & Conditions:</b><br/>1. This is a computer-generated tax invoice and requires no physical signature.<br/>2. All software license subscriptions are non-refundable unless specified.<br/>3. For support tickets regarding payments, contact support@dicepvc.com.", body_style))

    # Build document
    doc.build(elements)
    buffer.seek(0)
    return buffer


async def list_customer_invoices(user_id: str) -> list[dict]:
    """Retrieves list of past invoice metadata records for the logged-in customer."""
    # Fetch orders first
    cursor = col("orders").find({"user_id": user_id, "status": "paid"})
    orders = await cursor.to_list(None)
    order_ids = [o["id"] for o in orders]

    # Fetch corresponding payment capture documents
    pmts_cursor = col("payments").find({"order_id": {"$in": order_ids}})
    pmts = await pmts_cursor.to_list(None)
    
    return serialize_many(pmts)
