def get_whatsapp_link(phone: str, message: str) -> str:
    """Generate a WhatsApp click-to-chat link."""
    import urllib.parse
    clean_phone = phone.replace("+", "").replace("-", "").replace(" ", "")
    if not clean_phone.startswith("91"):
        clean_phone = "91" + clean_phone
    encoded = urllib.parse.quote(message)
    return f"https://wa.me/{clean_phone}?text={encoded}"


def get_partner_whatsapp_message(lead_name: str) -> str:
    return (
        f"Hi {lead_name}! 👋\n\n"
        "Thank you for your interest in the Rupeezy Partner Program.\n\n"
        "Here's what you get:\n"
        "✅ 100% Brokerage Share (industry gives only 60-70%)\n"
        "✅ Daily Payouts via RISE Portal\n"
        "✅ Zero Joining Fee\n"
        "✅ Work under SEBI-registered broker license\n"
        "✅ Dedicated support team\n\n"
        "Sign up here: https://rupeezy.in/partner-signup\n\n"
        "Questions? Just reply to this message!"
    )
