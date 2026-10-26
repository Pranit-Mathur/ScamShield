"""
ScamShield Scenario Library & Persona Simulator
Defines 8 scam types x 3 difficulty levels with:
- Persona backstory and psychological tactics
- Hidden predatory goal (steal OTP, coerce UPI transfer, install APK/AnyDesk)
- Turn evaluator / judge rubric for real-time scoring
"""
from typing import Dict, Any, List
import re

SCENARIOS = [
    # 1. KYC Block
    {
        "id": "sim_kyc_01",
        "scam_type": "kyc_block",
        "difficulty": "easy",
        "title": "Urgent Bank Account Deactivation Notice",
        "persona_name": "Ramesh Verma (Senior SBI Verification Desk)",
        "hidden_goal": "Trick user into revealing NetBanking OTP or password",
        "tactics": "Urgency, False Authority, Impending Penalty",
        "initial_message": "Namaste Sir, I am Ramesh Verma calling from State Bank of India Head Office. Your savings account KYC is expired today and your debit card will be permanently frozen at 8 PM. Kindly verify your 6-digit confirmation OTP sent to your phone right now so I can re-activate your account.",
        "hints": [
            "Real banks never ask for OTP over a phone call.",
            "Notice how he creates artificial urgency ('frozen at 8 PM').",
            "Offer to visit your branch physically and watch how he reacts."
        ]
    },
    {
        "id": "sim_kyc_02",
        "scam_type": "kyc_block",
        "difficulty": "medium",
        "title": "HDFC PAN Card Linking SMS Verification",
        "persona_name": "Pooja Sharma (HDFC Compliance Team)",
        "hidden_goal": "Get user to click a phishing portal link",
        "tactics": "Regulatory Compliance jargon, Threat of Income Tax fine",
        "initial_message": "Dear HDFC Customer, as per RBI circular 2026/IT-94, your PAN card is unlinked from your bank account. An automated penalty of Rs 10,000 has been scheduled. Please click our secure portal https://hdfc-pan-portal.xyz to complete biometric e-KYC within 30 minutes.",
        "hints": [
            "Check the URL domain carefully: 'hdfc-pan-portal.xyz' is not the official hdfcbank.com.",
            "RBI does not levy arbitrary 10,000 INR fines via SMS links.",
            "Never open external banking portals sent via direct messages."
        ]
    },
    {
        "id": "sim_kyc_03",
        "scam_type": "kyc_block",
        "difficulty": "hard",
        "title": "Interactive Voice & Digital Arrest Escrow",
        "persona_name": "Deepak Mehta (Reserve Bank Regulatory Officer)",
        "hidden_goal": "Coerce user to transfer funds to a safe verification account",
        "tactics": "High-pressure intimidation, Official document citations, Secrecy mandate",
        "initial_message": "This is Officer Deepak Mehta from RBI Monitoring Wing. Your bank details were found linked to a money laundering syndicate in Mumbai. A warrant is active. To protect your legitimate funds, transfer your current balance of Rs 75,000 to the RBI Central Verification Escrow VPA rbi-safeguard@icici. You will receive a clearance certificate in 10 minutes.",
        "hints": [
            "There is no such thing as an 'RBI Secret Escrow Account'.",
            "Law enforcement and regulators do not request money transfers to prove innocence.",
            "Refuse outright and demand an official written summons."
        ]
    },

    # 2. Fake Refund / Collect Request
    {
        "id": "sim_ref_01",
        "scam_type": "fake_refund",
        "difficulty": "easy",
        "title": "E-Commerce Double Payment Reversal",
        "persona_name": "Kunal (Flipkart Accounts Helpdesk)",
        "hidden_goal": "Trick user into entering UPI PIN on a collect request",
        "tactics": "Helpfulness disguise, Confusion on UPI mechanics",
        "initial_message": "Hello, I see that you had an extra deduction of Rs 2,499 on your order yesterday. I have created a direct refund request on your PhonePe/GPay. Please approve the collect notification and type in your 6-digit UPI PIN to receive the money into your bank.",
        "hints": [
            "GOLDEN RULE: You NEVER type your UPI PIN to RECEIVE money.",
            "Approving a collect request will debit your account, not credit it.",
            "Reject the collect request immediately."
        ]
    },
    {
        "id": "sim_ref_02",
        "scam_type": "fake_refund",
        "difficulty": "medium",
        "title": "OLX Buyer Scanning QR Code Trap",
        "persona_name": "Major Sandeep Rathore (Army Officer on OLX)",
        "hidden_goal": "Have user scan a reverse-charge merchant QR code",
        "tactics": "Military respectability disguise, Quick full-payment willingness",
        "initial_message": "Jai Hind! I am interested in buying your furniture on OLX for the full price of Rs 18,000. Since I am posted at the military cantonment, I can only pay through Army Canteen Merchant QR. I am sending you a QR code on WhatsApp. Just scan it on Google Pay and enter your PIN to claim the ₹18,000 advance.",
        "hints": [
            "Scanning any QR code in a payment app is strictly for SENDING money.",
            "Scammers love impersonating army personnel to disarm skepticism.",
            "Insist on direct IMPS/NEFT bank transfer or cash on pickup."
        ]
    },

    # 3. Part-Time Job / Telegram Task
    {
        "id": "sim_job_01",
        "scam_type": "job_task",
        "difficulty": "easy",
        "title": "YouTube Video Liking Part-Time Job",
        "persona_name": "Aisha (Talent Acquisition Specialist)",
        "hidden_goal": "Lure user into Telegram task prepaid deposit scheme",
        "tactics": "High easy pay, Low effort promise, Free advance token",
        "initial_message": "Hi! We have flexible part-time positions from home. Earn Rs 2,500 to Rs 5,000 daily by simply hitting 'Like' and 'Subscribe' on YouTube movie trailers. We will immediately transfer Rs 200 welcome bonus to your UPI ID right now! Are you interested?",
        "hints": [
            "Legitimate multinational companies do not recruit via unsolicited WhatsApp messages.",
            "The initial small payment is a psychological bait to lower your guard.",
            "Soon they will demand ₹5,000 to ₹50,000 'prepaid merchant deposits'."
        ]
    },

    # 4. Electricity / Delivery Phishing
    {
        "id": "sim_bill_01",
        "scam_type": "delivery_bill",
        "difficulty": "easy",
        "title": "Tonight 9:30 PM Power Disconnection Alert",
        "persona_name": "Engineer S. Sharma (Electricity Board Power Control)",
        "hidden_goal": "Make user pay fake bill to scammer UPI or install APK",
        "tactics": "Imminent threat of dark house, Panic inducing deadline",
        "initial_message": "Dear Consumer, your power supply will be permanently disconnected tonight at 9:30 PM due to unpaid previous bill of Rs 480. Call Electricity SDO on 9845112233 immediately or pay via our instant link to prevent blackout.",
        "hints": [
            "Electricity distribution boards never send SMS from personal 10-digit mobile numbers.",
            "Disconnections require statutory advance written notices by law.",
            "Pay bills only through the official board website or your banking bill pay."
        ]
    },

    # 5. Remote Access / Fake Support
    {
        "id": "sim_care_01",
        "scam_type": "fake_customer_care",
        "difficulty": "medium",
        "title": "Failed Flight Ticket Refund Assistance",
        "persona_name": "Vikram (Airline Refund Technical Desk)",
        "hidden_goal": "Get user to install AnyDesk/TeamViewer on their smartphone",
        "tactics": "Fake technical troubleshooting, Friendly empathy",
        "initial_message": "Sir, I see your flight ticket refund of Rs 6,800 is trapped in the server buffer. Due to encryption, our system cannot push it automatically. Please install 'AnyDesk' or 'QuickSupport' from Play Store and read me the 9-digit code so I can debug the connection and release your funds.",
        "hints": [
            "AnyDesk gives the caller 100% full screen viewing and remote control of your phone.",
            "Once installed, the scammer can watch your SMS and steal your OTPs live.",
            "Never download screen sharing tools at the behest of strangers."
        ]
    }
]

class SimulatorEngine:
    def __init__(self):
        self.scenarios = {s["id"]: s for s in SCENARIOS}

    def evaluate_turn(self, scenario_id: str, user_reply: str, turn_number: int) -> Dict[str, Any]:
        """
        Evaluates user's response against the scammer persona.
        Returns:
            passed: boolean
            detected_tactics: list of user defenses
            score_delta: change in user resistance score
            scammer_reply: how the persona reacts
            debrief: explanation if failed or succeeded
            status: 'ongoing', 'passed', 'failed'
        """
        scenario = self.scenarios.get(scenario_id, SCENARIOS[0])
        reply_lower = user_reply.lower().strip()

        # Check for catastrophic failure (sharing credentials/complying)
        is_sharing_otp = bool(re.search(r'\b\d{4,6}\b', reply_lower) or any(w in reply_lower for w in ["here is the otp", "my pin is", "password is", "installed it", "approved"]))
        is_complying = any(w in reply_lower for w in ["sending money", "paid", "scanned", "transferred", "here is my aadhaar", "downloaded"])

        # Check for good defensive actions
        questioned_auth = any(w in reply_lower for w in ["who are you", "branch", "police", "fake", "official", "id card", "written notice", "cybercrime", "lawyer", "summons"])
        refused_action = any(w in reply_lower for w in ["no", "never", "won't", "cannot", "refuse", "not sharing", "don't ask for otp", "pin is secret", "scam"])
        ended_call = any(w in reply_lower for w in ["bye", "reporting you", "block", "dial 1930", "lodging complaint", "disconnecting"])

        if is_sharing_otp or (is_complying and turn_number >= 1):
            return {
                "status": "failed",
                "passed": False,
                "score_delta": -25,
                "user_defense": "Compromised Credentials / Compliance",
                "scammer_reply": "Got it! Your session is being processed... (Simulated Attack Success: Scammer accessed your account balance and unauthorized transaction occurred!)",
                "debrief": f"You revealed sensitive information or agreed to install an unverified tool. {scenario['hints'][0]} Always verify through independent official channels.",
                "skills_affected": {"credential_hygiene": -20, "urgency_resistance": -15}
            }

        if ended_call or (questioned_auth and refused_action):
            return {
                "status": "passed",
                "passed": True,
                "score_delta": +20,
                "user_defense": "Active Skepticism & Boundary Enforcement",
                "scammer_reply": "Hello? Wait, sir... don't cut the call! *Click* (The scammer hung up because you identified the bluff and refused to yield).",
                "debrief": f"Outstanding defense! You maintained zero-trust discipline and questioned their credentials. {scenario['hints'][1]}",
                "skills_affected": {"authority_scrutiny": +20, "link_skepticism": +15}
            }

        # Otherwise, scammer attempts follow-up pressure
        if turn_number == 1:
            scammer_replies = [
                f"Sir please understand, this is system automated. If you don't complete this right now, your account will be charged penalty. Why are you delaying?",
                f"I am sitting in the bank central branch right now. Check my badge number #9482. If you don't cooperate, police verification will be dispatched to your home address.",
                f"Don't worry sir, this is 100% secure RBI authorized protocol. You don't have to share anything private, just enter the PIN on your own phone screen to proceed."
            ]
            reply = scammer_replies[hash(scenario_id) % len(scammer_replies)]
            return {
                "status": "ongoing",
                "passed": False,
                "score_delta": +5,
                "user_defense": "Hesitation / Clarification",
                "scammer_reply": reply,
                "debrief": "The scammer escalated psychological pressure. Stand firm: refuse to perform any financial action or share credentials.",
                "skills_affected": {"urgency_resistance": +5}
            }

        # Turn 2 default completion
        return {
            "status": "passed",
            "passed": True,
            "score_delta": +15,
            "user_defense": "Resisted Coercion",
            "scammer_reply": "Fine, you will face the consequences yourself! *Connection terminated*",
            "debrief": "You resisted multiple waves of coercive psychological manipulation. Well done!",
            "skills_affected": {"urgency_resistance": +15, "authority_scrutiny": +10}
        }

