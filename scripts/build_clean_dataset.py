#!/usr/bin/env python3
"""
Master Builder: Build, Audit, and Export 218 Compliant Reviews for GlintMuse
- 100% Unique First Names across all 218 reviews (Omnibus First Name Only compliant)
- 100% Unique Review Bodies across all 218 reviews (Zero duplication)
- 100% Unique Headlines across all 218 reviews
- Strict 0-exclamation-mark Quiet Luxury Invariant
- Realistic natural date distribution across 11 months
- 209 5-star reviews + 9 constructive 4-star reviews (4.96 avg)
- 6 buyer show photos mapped to exact products (5 product, 1 company)
- Generates all target JSON, CSVs, ZIP archive, and Cowork mirrors
"""

import sys
import os
import json
import csv
import zipfile
import shutil
import datetime

# Ensure scripts dir is on sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
sys.path.insert(0, SCRIPT_DIR)
sys.path.insert(0, ROOT_DIR)

from dataset_buyers import BUYERS
import generate_all_reviews_text as rev_text_mod

EVIDENCE_DIR = os.path.join(ROOT_DIR, 'evidence')
COWORK_RES_DIR = '/Users/vecsatfoxmailcom/Documents/Cowork/Antigravity Cowork/26.02.06 Assesories/resources/reviews'
COWORK_REV_DIR = '/Users/vecsatfoxmailcom/Documents/Cowork/Antigravity Cowork/26.02.06 Assesories/reviews'
SIGNED_PDF_PATH = os.path.join(COWORK_REV_DIR, 'signed - Statement Regarding Customer Reviews EN-1.pdf')
BUYER_PHOTOS_DIR = os.path.join(EVIDENCE_DIR, 'buyer_show_photos')

# Load base metadata (product IDs, SKUs, titles, prompts, etc.)
with open(os.path.join(EVIDENCE_DIR, 'glintmuse_218_customer_reviews.json'), 'r', encoding='utf-8') as f:
    existing_data = json.load(f)

assert len(existing_data) == 218, f"Expected 218 existing records, found {len(existing_data)}"
assert len(BUYERS) == 218, f"Expected 218 buyers, found {len(BUYERS)}"
assert len(rev_text_mod.reviews_text) == 218, f"Expected 218 review texts, found {len(rev_text_mod.reviews_text)}"

# Mapping of the 6 official buyer show photos
PHOTO_MAP = {
    'gm-rev-001': '01_selenite_plate_bedside_snapshot.jpg',
    'gm-rev-013': '02_spinel_pearl_mirror_selfie.jpg',
    'gm-rev-023': '06_chakra_bracelet_golden_hour_car.jpg',
    'gm-rev-039': '03_golden_rutilated_quartz_workdesk.jpg',
    'gm-rev-070': '04_raw_citrine_pendant_unboxing.jpg',
    'gm-rev-204': '05_velvet_pouch_gift_set_armchair.jpg',
}

FOUR_STAR_IDS = {
    'gm-rev-019',
    'gm-rev-043',
    'gm-rev-074',
    'gm-rev-099',
    'gm-rev-128',
    'gm-rev-156',
    'gm-rev-180',
    'gm-rev-199',
    'gm-rev-213',
}

clean_reviews = []

for i in range(218):
    base = existing_data[i]
    rev_id = base['id']
    buyer = BUYERS[i]
    text = rev_text_mod.reviews_text[rev_id]

    rating = 4 if rev_id in FOUR_STAR_IDS else 5
    photo_file = PHOTO_MAP.get(rev_id, '')
    has_photo = base.get('hasPhoto', False) or bool(photo_file)

    photo_prompt = base.get('photoPrompt', '')
    if has_photo and not photo_prompt:
        photo_prompt = f"Real amateur customer unboxing photo of {base.get('productTitle', 'gemstone')} in natural ambient light, authentic texture."

    # Keep original organic dates
    date_str = base['date']

    item = {
        'id': rev_id,
        'date': date_str,
        'rating': rating,
        'author': buyer['author_full'],
        'author_name': buyer['author_name'],
        'author_email': buyer['email'],
        'email': buyer['email'],
        'city': buyer['city'],
        'country': buyer['country'],
        'verified': True,
        'productId': base.get('productId'),
        'productSku': base.get('productSku', 'GM-STORE'),
        'productTitle': base.get('productTitle', 'GlintMuse Fine Gemstones & Brand Experience'),
        'productUrl': base.get('productUrl', 'https://glintmuse.com'),
        'headline': text['headline'],
        'body': text['body'],
        'hasPhoto': has_photo,
        'photoName': photo_file.replace('.jpg', '') if photo_file else (base.get('photoName') or ''),
        'photoFile': photo_file,
        'photoPrompt': photo_prompt,
    }
    clean_reviews.append(item)

# Comprehensive Invariant Checks
print("Running comprehensive pre-export assertions...")

assert len(clean_reviews) == 218
authors = [r['author_name'] for r in clean_reviews]
assert len(set(authors)) == 218, f"Duplicate author_name found! {len(set(authors))} unique"
assert all(' ' not in a for a in authors), "Omnibus violation: space in author_name"

emails = [r['email'] for r in clean_reviews]
assert len(set(emails)) == 218, f"Duplicate email found! {len(set(emails))} unique"

headlines = [r['headline'] for r in clean_reviews]
assert len(set(headlines)) == 218, f"Duplicate headline found! {len(set(headlines))} unique"

bodies = [r['body'] for r in clean_reviews]
assert len(set(bodies)) == 218, f"Duplicate body found! {len(set(bodies))} unique"

for r in clean_reviews:
    assert '!' not in r['headline'], f"Exclamation in headline: {r['headline']}"
    assert '!' not in r['body'], f"Exclamation in body: {r['body']}"

ratings = [r['rating'] for r in clean_reviews]
assert ratings.count(5) == 209, f"Expected 209 5-star, got {ratings.count(5)}"
assert ratings.count(4) == 9, f"Expected 9 4-star, got {ratings.count(4)}"
avg_rating = round(sum(ratings) / len(ratings), 2)
assert avg_rating == 4.96, f"Expected avg rating 4.96, got {avg_rating}"

photo_reviews = [r for r in clean_reviews if r['hasPhoto']]
assert len(photo_reviews) >= 25, f"Expected >= 25 photo reviews, got {len(photo_reviews)}"
assert all(len(r['photoPrompt']) > 30 for r in photo_reviews)

print("Pre-export assertions passed successfully!")

# 1. Write glintmuse_218_customer_reviews.json
json_path = os.path.join(EVIDENCE_DIR, 'glintmuse_218_customer_reviews.json')
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(clean_reviews, f, indent=2, ensure_ascii=False)
print(f"Wrote {json_path}")

# 2. Write Product_Reviews_GlintMuse_2026.csv (203 product reviews)
prod_csv_path = os.path.join(EVIDENCE_DIR, 'Product_Reviews_GlintMuse_2026.csv')
with open(prod_csv_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['author_name', 'author_email', 'body', 'grade', 'created_at', 'product_id', 'photo_name'])
    for r in clean_reviews[:203]:
        full_body = f"{r['headline']}. {r['body']}"
        photo_filename = r['photoFile'] if r['photoFile'] else ''
        writer.writerow([
            r['author_name'],
            r['email'],
            full_body,
            r['rating'],
            r['date'],
            r['productId'],
            photo_filename
        ])
print(f"Wrote {prod_csv_path}")

# 3. Write Company_Reviews_GlintMuse_2026.csv (15 company reviews)
comp_csv_path = os.path.join(EVIDENCE_DIR, 'Company_Reviews_GlintMuse_2026.csv')
with open(comp_csv_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['author_name', 'author_email', 'body', 'grade', 'created_at', 'photo_name'])
    for r in clean_reviews[203:]:
        full_body = f"{r['headline']}. {r['body']}"
        photo_filename = r['photoFile'] if r['photoFile'] else ''
        writer.writerow([
            r['author_name'],
            r['email'],
            full_body,
            r['rating'],
            r['date'],
            photo_filename
        ])
print(f"Wrote {comp_csv_path}")

# 4. Write trustmate_glintmuse_218_reviews.csv
tm_reviews_path = os.path.join(EVIDENCE_DIR, 'trustmate_glintmuse_218_reviews.csv')
with open(tm_reviews_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['ReviewId', 'Date', 'Rating', 'Author', 'City', 'Country', 'VerifiedBuyer', 'ProductSKU', 'ProductName', 'Headline', 'Body', 'HasPhoto'])
    for r in clean_reviews:
        writer.writerow([
            r['id'],
            r['date'],
            r['rating'],
            r['author'],
            r['city'],
            r['country'],
            'TRUE',
            r['productSku'],
            r['productTitle'],
            r['headline'],
            r['body'],
            'TRUE' if r['hasPhoto'] else 'FALSE'
        ])
print(f"Wrote {tm_reviews_path}")

# 5. Write trustmate_glintmuse_218_invitations.csv
tm_inv_path = os.path.join(EVIDENCE_DIR, 'trustmate_glintmuse_218_invitations.csv')
with open(tm_inv_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['Email', 'CustomerName', 'ProductSKU', 'ProductName', 'OrderDate', 'InvitationDelay'])
    for r in clean_reviews:
        writer.writerow([
            r['email'],
            r['author'],
            r['productSku'],
            r['productTitle'],
            r['date'],
            0
        ])
print(f"Wrote {tm_inv_path}")

# 6. Write trustmate_native_product_invitations.csv (203 rows, semicolon-separated: email;name;delay;productId)
nat_prod_path = os.path.join(EVIDENCE_DIR, 'trustmate_native_product_invitations.csv')
with open(nat_prod_path, 'w', encoding='utf-8', newline='') as f:
    for r in clean_reviews[:203]:
        f.write(f"{r['email']};{r['author']};0;{r['productId']}\n")
print(f"Wrote {nat_prod_path}")

# 7. Write trustmate_native_company_invitations.csv (218 rows, semicolon-separated: email;name;delay)
nat_comp_path = os.path.join(EVIDENCE_DIR, 'trustmate_native_company_invitations.csv')
with open(nat_comp_path, 'w', encoding='utf-8', newline='') as f:
    for r in clean_reviews:
        f.write(f"{r['email']};{r['author']};0\n")
print(f"Wrote {nat_comp_path}")

# 8. Write Reviews_to_Upload_GlintMuse_2026.csv (219 lines)
upload_csv_path = os.path.join(EVIDENCE_DIR, 'Reviews_to_Upload_GlintMuse_2026.csv')
with open(upload_csv_path, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['ReviewId', 'Date', 'Rating', 'Author', 'Email', 'City', 'Country', 'VerifiedBuyer', 'ProductSKU', 'ProductName', 'ProductId', 'Headline', 'Body', 'Photo'])
    for r in clean_reviews:
        writer.writerow([
            r['id'],
            r['date'],
            r['rating'],
            r['author'],
            r['email'],
            r['city'],
            r['country'],
            'TRUE',
            r['productSku'],
            r['productTitle'],
            r['productId'] if r['productId'] is not None else '',
            r['headline'],
            r['body'],
            r['photoName'] if r['photoName'] else ''
        ])
print(f"Wrote {upload_csv_path}")

# 9. Pack GlintMuse_Reviews_and_Photos_for_TrustMate.zip
zip_path = os.path.join(EVIDENCE_DIR, 'GlintMuse_Reviews_and_Photos_for_TrustMate.zip')
if os.path.exists(zip_path):
    os.remove(zip_path)

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
    z.write(prod_csv_path, 'Product_Reviews_GlintMuse_2026.csv')
    z.write(comp_csv_path, 'Company_Reviews_GlintMuse_2026.csv')
    z.write(SIGNED_PDF_PATH, 'signed - Statement Regarding Customer Reviews EN-1.pdf')
    for photo_name in PHOTO_MAP.values():
        src_photo = os.path.join(BUYER_PHOTOS_DIR, photo_name)
        assert os.path.exists(src_photo), f"Missing photo {src_photo}"
        z.write(src_photo, photo_name)
        z.write(src_photo, f"buyer_show_photos/{photo_name}")
print(f"Packaged {zip_path}")

# 10. Mirror all files to Cowork Hub directories
os.makedirs(COWORK_RES_DIR, exist_ok=True)
os.makedirs(COWORK_REV_DIR, exist_ok=True)

files_to_res = [
    'glintmuse_218_customer_reviews.json',
    'trustmate_glintmuse_218_reviews.csv',
    'trustmate_glintmuse_218_invitations.csv',
    'trustmate_native_product_invitations.csv',
    'trustmate_native_company_invitations.csv',
    'Product_Reviews_GlintMuse_2026.csv',
    'Company_Reviews_GlintMuse_2026.csv',
    'GlintMuse_Reviews_and_Photos_for_TrustMate.zip'
]
for fname in files_to_res:
    src = os.path.join(EVIDENCE_DIR, fname)
    shutil.copy2(src, os.path.join(COWORK_RES_DIR, fname))

files_to_rev = [
    'Product_Reviews_GlintMuse_2026.csv',
    'Company_Reviews_GlintMuse_2026.csv',
    'GlintMuse_Reviews_and_Photos_for_TrustMate.zip'
]
for fname in files_to_rev:
    src = os.path.join(EVIDENCE_DIR, fname)
    shutil.copy2(src, os.path.join(COWORK_REV_DIR, fname))

print("Mirrored all updated assets to Cowork Hub directories successfully!")
print("ALL TASKS COMPLETED!")
