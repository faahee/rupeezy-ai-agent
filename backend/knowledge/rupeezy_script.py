PROGRAM_BENEFITS = {
    "joining_fee": "Zero joining fee - free to join",
    "brokerage_share": "100% brokerage share (industry gives only 60-70%)",
    "payouts": "Daily payouts via RISE Portal",
    "support": "Dedicated support team for all client issues",
    "license": "Work under Rupeezy's broker license as Authorized Person (AP)",
}

# Each language has a list of varied short opening lines.
# One is picked randomly each call so the intro never sounds the same.
OPENING_SCRIPTS = {
    "hindi": [
        "Namaste {name} ji! Main Priya, Rupeezy se. Kya aap broker ya financial advisor hain?",
        "Namaste! Priya bol rahi hoon Rupeezy se. {name} ji, aap investment field mein kaam karte hain?",
        "Namaskar {name} ji! Rupeezy ki Priya bol rahi hoon. Kya aap clients ko invest karate hain?",
    ],
    "english": [
        "Hi {name}! Priya here from Rupeezy. Are you a financial advisor or broker?",
        "Hello {name}! This is Priya calling from Rupeezy. Do you work with investment clients?",
        "Hi! Priya from Rupeezy. {name}, are you currently working as a financial advisor?",
    ],
    "hinglish": [
        "Hi {name}! Main Priya, Rupeezy se. Kya aap financial advisor ya broker hain?",
        "Hello {name} ji! Priya here from Rupeezy. Aap clients ke liye invest karte hain kya?",
        "Hi! Priya bol rahi hoon Rupeezy se. {name} ji, aap finance field mein hain?",
    ],
    "tamil": [
        "Vanakkam {name}! Naan Priya, Rupeezy-yil irundhu. Neengal financial advisor-aa?",
        "Vanakkam! Priya pesugiren Rupeezy-yil irundhu. {name}, neengal clients-ku invest pannuveergalaa?",
        "Vanakkam {name}! Rupeezy-yil irundhu Priya. Neengal broker-aa illai advisor-aa?",
    ],
    "telugu": [
        "Namaskaram {name}! Nenu Priya, Rupeezy nunchi. Meeru financial advisor-aa?",
        "Namaskaram! Priya ni, Rupeezy nunchi matladadam. {name} garu, meeru clients ki invest chestaaraa?",
        "Hello {name} garu! Rupeezy nunchi Priya. Meeru broker leda advisor-aa?",
    ],
    "kannada": [
        "Namaskara {name}! Naanu Priya, Rupeezy-inda. Neevu financial advisor-aa?",
        "Namaskara! Priya matnaduttiddene Rupeezy-inda. {name}, neevu clients-ge invest maadutteeraa?",
        "Hello {name}! Rupeezy-inda Priya. Neevu broker-aa athava advisor-aa?",
    ],
    "malayalam": [
        "Namaskaram {name}! Ente peru Priya, Rupeezy-il ninnum. Ningal financial advisor-aa?",
        "Namaskaram! Priya aanu, Rupeezy-il ninnum vilikkunnu. {name}, ningal clients-nu invest cheyyunnundo?",
        "Hello {name}! Rupeezy-il ninnum Priya. Ningal broker-aa athava advisor-aa?",
    ],
    "bengali": [
        "Namaskar {name}! Ami Priya, Rupeezy theke. Apni ki financial advisor?",
        "Namaskar! Priya bolchi, Rupeezy theke. {name}, apni ki clients-der jonno invest koren?",
        "Hello {name}! Rupeezy-r Priya bolchi. Apni ki broker na advisor?",
    ],
    "marathi": [
        "Namaskar {name}! Mi Priya, Rupeezy kaDun. Tumhi financial advisor aahaat ka?",
        "Namaskar! Priya bolat aahe Rupeezy kaDun. {name}, tumhi clients saathi invest karta ka?",
        "Hello {name}! Rupeezy chi Priya. Tumhi broker ki advisor?",
    ],
    "gujarati": [
        "Kem cho {name}! Hoon Priya, Rupeezy tharathi. Tame financial advisor cho?",
        "Kem cho! Priya bolav chu Rupeezy tharathi. {name}, tame clients mate invest karo cho?",
        "Hello {name}! Rupeezy ni Priya. Tame broker ke advisor cho?",
    ],
    "urdu": [
        "Assalamu Alaikum {name}! Main Priya, Rupeezy se. Kya aap financial advisor hain?",
        "Salam! Priya bol rahi hoon Rupeezy se. {name} sahab, aap clients ke liye invest karte hain?",
        "Hello {name}! Rupeezy ki Priya. Kya aap broker ya advisor hain?",
    ],
    "punjabi": [
        "Sat Sri Akal {name} ji! Main Priya, Rupeezy ton. Tusi financial advisor ho?",
        "Sat Sri Akal! Priya bol rahi haan Rupeezy ton. {name} ji, tusi clients layi invest karde ho?",
        "Hello {name} ji! Rupeezy di Priya. Tusi broker ho ya advisor?",
    ],
}

# Backwards compat — keep OPENING_SCRIPT pointing to first variant of each language
OPENING_SCRIPT = {lang: variants[0] for lang, variants in OPENING_SCRIPTS.items()}

OBJECTIONS = {
    "already_with_broker": {
        "trigger_keywords": ["already", "broker", "dusra", "aur broker", "competitor", "pehle se"],
        "rebuttal_hindi": (
            "Yeh toh bahut acchi baat hai - aap already business samajhte hain. "
            "Ek sawal: kya aapko 100% brokerage share mil raha hai aur daily payouts? "
            "Zyada tar brokers sirf 60-70% dete hain aur monthly pay karte hain."
        ),
        "rebuttal_english": (
            "That's great - you already understand the business. "
            "My question is: are you getting 100% brokerage share and daily payouts? "
            "Most brokers cap you at 60-70% and pay monthly."
        ),
        "rebuttal_hinglish": (
            "Yeh toh great hai - aap already business ko samajhte ho. "
            "Ek question: kya tumhe 100% brokerage share aur daily payouts mil rahe hain? "
            "Most brokers sirf 60-70% dete hain."
        ),
    },
    "not_enough_contacts": {
        "trigger_keywords": ["contacts", "clients", "log nahi", "network nahi", "people", "reach"],
        "rebuttal_hindi": (
            "Shuru mein sabke paas limited contacts hote hain. "
            "Rupeezy ka RISE Portal aapko clients onboard karne ke liye tools deta hai. "
            "Aur joining free hai - koi risk nahi."
        ),
        "rebuttal_english": (
            "Everyone starts with limited contacts. "
            "Rupeezy's RISE Portal gives you tools to onboard and grow your client base. "
            "And since joining is free, there's zero risk."
        ),
        "rebuttal_hinglish": (
            "Shuruaat mein sabke paas limited contacts hote hain. "
            "RISE Portal se aap clients grow kar sakte ho. Joining free hai - no risk."
        ),
    },
    "support_concern": {
        "trigger_keywords": ["support", "issue", "problem", "client issue", "help", "complaint"],
        "rebuttal_hindi": (
            "Bilkul samajh sakta hoon. Rupeezy ki dedicated support team hai "
            "jo aapke clients ke har issue ko handle karti hai. "
            "Aap sirf business karo, support humari zimmedari hai."
        ),
        "rebuttal_english": (
            "Completely understand. Rupeezy has a dedicated support team "
            "that handles all client issues. You focus on business, support is our responsibility."
        ),
        "rebuttal_hinglish": (
            "Bilkul samajh sakta hoon. Rupeezy ki dedicated support team hai - "
            "aap business karo, support humari responsibility hai."
        ),
    },
    "trust_concern": {
        "trigger_keywords": ["trust", "safe", "real", "genuine", "registered", "SEBI", "bharosa"],
        "rebuttal_hindi": (
            "Rupeezy SEBI registered broker hai. Hum regulated platform hain "
            "jahan aapka aur aapke clients ka paisa completely safe hai. "
            "Aap humari website par poori details dekh sakte hain."
        ),
        "rebuttal_english": (
            "Rupeezy is a SEBI registered broker. We are a fully regulated platform "
            "where your and your clients' money is completely safe. "
            "You can verify all details on our website."
        ),
        "rebuttal_hinglish": (
            "Rupeezy SEBI registered broker hai. Fully regulated platform hai - "
            "aapka aur clients ka paisa safe hai."
        ),
    },
    "think_about_it": {
        "trigger_keywords": ["think", "sochna", "baad mein", "later", "call me", "time", "abhi nahi"],
        "rebuttal_hindi": (
            "Bilkul, main samajhta hoon. Lekin ek baat batao - joining bilkul free hai, "
            "koi commitment nahi. Kya main aapko WhatsApp par details bhej sakta hoon "
            "taaki aap apni suvidha se dekh sakein?"
        ),
        "rebuttal_english": (
            "Completely understand. But here's the thing - joining is completely free, "
            "zero commitment. Can I send you the details on WhatsApp so you can review "
            "at your convenience?"
        ),
        "rebuttal_hinglish": (
            "Bilkul samajh sakta hoon. Lekin joining free hai - no commitment. "
            "Kya main WhatsApp par details bhej sakta hoon?"
        ),
    },
}

CLOSING_SCRIPT = {
    "hot_close": (
        "Bahut accha! Main abhi aapko humare senior RM se connect karta hoon "
        "jo aapka registration complete karayenge."
    ),
    "warm_close": (
        "Koi baat nahi. Main aapko WhatsApp par sign-up link aur complete details bhejta hoon."
    ),
    "cold_close": (
        "Theek hai. Main aapki details note kar leta hoon. "
        "Jab bhi ready hon, hum available hain."
    ),
}

FULL_KNOWLEDGE_BASE = {
    "program_benefits": PROGRAM_BENEFITS,
    "opening_script": OPENING_SCRIPT,
    "objections": OBJECTIONS,
    "closing_script": CLOSING_SCRIPT,
}
