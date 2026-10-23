"""
Create a sample lease agreement PDF for testing Lexra.
Run: python create_sample_pdf.py
"""
import pymupdf
import os

def create_sample_pdf(output_path: str):
    doc = pymupdf.open()

    # ── Page 1 ────────────────────────────────────────────────────────────────
    page1 = doc.new_page()
    content_p1 = """LEASE AGREEMENT

This Lease Agreement is entered into on the 1st day of January 2024,
between the following parties:

LANDLORD: Mr. Rajesh Sharma
Address: 45, 3rd Cross, Indiranagar, Bengaluru - 560038

TENANT: Mr. Gowtham M
Address: 12, 5th Main, Koramangala, Bengaluru - 560034

PROPERTY: Flat No. 302, Sunrise Apartments,
          HSR Layout, Bengaluru - 560102

Section 1: Rent and Payment
The tenant shall pay a monthly rent of five thousand rupees (Rs. 5,000)
on the first day of every calendar month. Payment shall be made via
bank transfer to the landlord's designated account.

Section 2: Security Deposit
The tenant shall pay a security deposit of fifty thousand rupees
(Rs. 50,000) prior to taking possession of the property.
The security deposit shall be refunded within thirty days of vacating,
subject to deductions for any damages beyond normal wear and tear.

Section 3: Duration
The lease agreement shall be valid for a period of eleven months
from the date of signing, i.e., from January 1, 2024 to
November 30, 2024. The agreement may be renewed by mutual consent."""

    page1.insert_text((50, 50), content_p1, fontsize=10, fontname="helv")

    # ── Page 2 ────────────────────────────────────────────────────────────────
    page2 = doc.new_page()
    content_p2 = """Section 4: Termination
Either party may terminate this agreement with thirty days written
notice to the other party. Notice shall be served in writing via
registered post or email to the address mentioned in this agreement.

Section 5: Maintenance
The landlord shall ensure all electrical fittings, plumbing, and
structural elements are in working condition at the time of possession.
The tenant shall be responsible for day-to-day maintenance and minor
repairs not exceeding five hundred rupees per incident.

Section 6: Utilities
The tenant shall be responsible for payment of all utility bills
including electricity, water, and internet during the tenancy period.

Section 7: Arbitration
All disputes arising out of or in connection with this agreement
shall be resolved through arbitration in accordance with the
Arbitration and Conciliation Act, 1996. The seat of arbitration
shall be Bengaluru, Karnataka.

Section 8: Breach and Penalty
In case of breach of contract by either party, the defaulting party
shall pay a penalty of ten percent of the annual rent amount.
The non-defaulting party reserves the right to seek additional
remedies as available under applicable law."""

    page2.insert_text((50, 50), content_p2, fontsize=10, fontname="helv")

    # ── Page 3 ────────────────────────────────────────────────────────────────
    page3 = doc.new_page()
    content_p3 = """Section 9: Use of Property
The tenant shall use the property solely for residential purposes.
Commercial activities of any nature are strictly prohibited on
the premises.

Section 10: Modifications
The tenant shall not make any structural modifications, alterations,
or renovations to the property without prior written consent from
the landlord. Any approved modifications shall become part of
the property upon vacating.

Section 11: Pets
Keeping of pets on the premises is not permitted without prior
written approval from the landlord.

Section 12: Visitors
Overnight guests are permitted for a maximum of seven consecutive days.
Extended stays beyond this period require prior intimation to the landlord.

Section 13: Inspection
The landlord reserves the right to inspect the property with a
minimum of 24 hours prior notice to the tenant.

Section 14: Subletting and Assignment

Section 14(1): General Restriction
The tenant shall not assign this lease or any interest therein
without the prior written consent of the landlord.

Section 14(2): Subletting Conditions
14(2)(a) - The tenant may apply in writing for permission to sublet.
14(2)(b) - Subletting is strictly prohibited without written consent.
14(2)(c) - Any unauthorized subletting shall be grounds for immediate
           termination of this agreement.

Section 15: Governing Law
This agreement shall be governed by and construed in accordance
with the laws of the State of Karnataka, India.

SIGNATURES:

Landlord: _________________    Date: ____________
Mr. Rajesh Sharma

Tenant: __________________     Date: ____________
Mr. Gowtham M

Witness 1: _______________
Witness 2: _______________"""

    page3.insert_text((50, 50), content_p3, fontsize=10, fontname="helv")

    # Save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc.save(output_path)
    doc.close()
    print(f"✅ Sample PDF created: {output_path}")
    print(f"   Pages: 3")
    print(f"   Content: Full lease agreement with 15 sections")


if __name__ == "__main__":
    create_sample_pdf("data/docs/sample_lease_agreement.pdf")
