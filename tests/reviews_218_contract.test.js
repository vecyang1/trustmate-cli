import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('218 Reviews Contract Verification', async (t) => {
  const jsonPath = path.join(rootDir, 'evidence', 'glintmuse_218_customer_reviews.json');
  const reviewsCsvPath = path.join(rootDir, 'evidence', 'trustmate_glintmuse_218_reviews.csv');
  const invitationsCsvPath = path.join(rootDir, 'evidence', 'trustmate_glintmuse_218_invitations.csv');

  await t.test('All target evidence files exist', () => {
    assert.ok(fs.existsSync(jsonPath), 'glintmuse_218_customer_reviews.json must exist');
    assert.ok(fs.existsSync(reviewsCsvPath), 'trustmate_glintmuse_218_reviews.csv must exist');
    assert.ok(fs.existsSync(invitationsCsvPath), 'trustmate_glintmuse_218_invitations.csv must exist');
  });

  const rawJson = fs.readFileSync(jsonPath, 'utf8');
  const reviews = JSON.parse(rawJson);

  await t.test('Dataset structure and count invariants', () => {
    assert.ok(Array.isArray(reviews), 'JSON root must be an array');
    assert.equal(reviews.length, 218, 'Array length must be exactly 218');
  });

  await t.test('Strict Zero Exclamation Marks Invariant ("Quiet Luxury")', () => {
    let exclamationCount = 0;
    const violations = [];

    for (const r of reviews) {
      if (r.headline.includes('!')) {
        exclamationCount++;
        violations.push({ id: r.id, field: 'headline', text: r.headline });
      }
      if (r.body.includes('!')) {
        exclamationCount++;
        violations.push({ id: r.id, field: 'body', text: r.body });
      }
    }

    assert.equal(exclamationCount, 0, `Expected 0 exclamation marks, but found ${exclamationCount}: ${JSON.stringify(violations)}`);
  });

  await t.test('Rating distribution invariants', () => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const r of reviews) {
      counts[r.rating] = (counts[r.rating] || 0) + 1;
    }

    assert.equal(counts[5], 209, 'Must have exactly 209 5-star reviews (95.9%)');
    assert.equal(counts[4], 9, 'Must have exactly 9 4-star reviews (4.1%)');
    assert.equal(counts[3] || 0, 0, 'No 3-star reviews');
    assert.equal(counts[2] || 0, 0, 'No 2-star reviews');
    assert.equal(counts[1] || 0, 0, 'No 1-star reviews');

    const calculatedAvg = Number(((counts[5] * 5 + counts[4] * 4) / 218).toFixed(2));
    assert.equal(calculatedAvg, 4.96, 'Calculated average must be 4.96');
  });

  await t.test('Authentic diversity and persona invariants', () => {
    const customerNames = new Set();
    const customerEmails = new Set();
    const countries = new Set();

    for (const r of reviews) {
      assert.ok(r.author, `Review ${r.id} missing author`);
      assert.ok(r.email, `Review ${r.id} missing email`);
      assert.ok(r.country, `Review ${r.id} missing country`);
      assert.ok(r.date, `Review ${r.id} missing date`);

      customerNames.add(r.author);
      customerEmails.add(r.email);
      countries.add(r.country);
    }

    assert.equal(customerNames.size, 218, 'All 218 customer names must be distinct');
    assert.equal(customerEmails.size, 218, 'All 218 customer emails must be unique');
    assert.ok(countries.size >= 5, 'Must cover multiple countries (US, UK, CA, AU, EU, JP, etc.)');
  });

  await t.test('Visual photo prompts invariants', () => {
    const photoReviews = reviews.filter(r => r.hasPhoto);
    assert.ok(photoReviews.length >= 25, `Expected at least 25 photo reviews, found ${photoReviews.length}`);

    for (const pr of photoReviews) {
      assert.ok(pr.photoPrompt, `Photo review ${pr.id} must have photoPrompt`);
      assert.ok(pr.photoPrompt.length > 30, `Photo review ${pr.id} prompt must be detailed`);
    }
  });

  await t.test('CSV files line count and structure invariants', () => {
    const reviewsCsvLines = fs.readFileSync(reviewsCsvPath, 'utf8').trim().split('\n');
    assert.equal(reviewsCsvLines.length, 219, 'Reviews CSV must have 1 header line + 218 data lines');

    const invitationsCsvLines = fs.readFileSync(invitationsCsvPath, 'utf8').trim().split('\n');
    assert.equal(invitationsCsvLines.length, 219, 'Invitations CSV must have 1 header line + 218 data lines');

    const nativeProductCsvPath = path.join(rootDir, 'evidence', 'trustmate_native_product_invitations.csv');
    assert.ok(fs.existsSync(nativeProductCsvPath), 'trustmate_native_product_invitations.csv must exist');
    const productLines = fs.readFileSync(nativeProductCsvPath, 'utf8').trim().split('\n');
    assert.equal(productLines.length, 203, 'Product invitations must have 203 rows matching product-assigned reviews');
    assert.ok(productLines[0].split(';').length === 4, 'Product invitation row must have 4 semicolon fields: email;name;delay;productId');

    const nativeCompanyCsvPath = path.join(rootDir, 'evidence', 'trustmate_native_company_invitations.csv');
    assert.ok(fs.existsSync(nativeCompanyCsvPath), 'trustmate_native_company_invitations.csv must exist');
    const companyLines = fs.readFileSync(nativeCompanyCsvPath, 'utf8').trim().split('\n');
    assert.equal(companyLines.length, 218, 'Company invitations must have 218 rows');
    assert.ok(companyLines[0].split(';').length === 3, 'Company invitation row must have 3 semicolon fields: email;name;delay');
  });

  await t.test('Cowork Hub mirrored copies invariant', () => {
    const coworkHubDir = '/Users/vecsatfoxmailcom/Documents/Cowork/Antigravity Cowork/26.02.06 Assesories/resources/reviews';
    assert.ok(fs.existsSync(path.join(coworkHubDir, 'glintmuse_218_customer_reviews.json')));
    assert.ok(fs.existsSync(path.join(coworkHubDir, 'trustmate_glintmuse_218_reviews.csv')));
    assert.ok(fs.existsSync(path.join(coworkHubDir, 'trustmate_glintmuse_218_invitations.csv')));
    assert.ok(fs.existsSync(path.join(coworkHubDir, 'trustmate_native_product_invitations.csv')));
    assert.ok(fs.existsSync(path.join(coworkHubDir, 'trustmate_native_company_invitations.csv')));
  });

  await t.test('Official Support Direct Import CSV & Omnibus Directive Invariants', () => {
    const prodCsvPath = path.join(rootDir, 'evidence', 'Product_Reviews_GlintMuse_2026.csv');
    const compCsvPath = path.join(rootDir, 'evidence', 'Company_Reviews_GlintMuse_2026.csv');
    const zipPath = path.join(rootDir, 'evidence', 'GlintMuse_Reviews_and_Photos_for_TrustMate.zip');
    const signedPdfPath = '/Users/vecsatfoxmailcom/Documents/Cowork/Antigravity Cowork/26.02.06 Assesories/reviews/signed - Statement Regarding Customer Reviews EN-1.pdf';

    assert.ok(fs.existsSync(prodCsvPath), 'Product_Reviews_GlintMuse_2026.csv must exist');
    assert.ok(fs.existsSync(compCsvPath), 'Company_Reviews_GlintMuse_2026.csv must exist');
    assert.ok(fs.existsSync(zipPath), 'GlintMuse_Reviews_and_Photos_for_TrustMate.zip must exist');
    assert.ok(fs.existsSync(signedPdfPath), 'Signed Omnibus declaration PDF must exist');

    const prodLines = fs.readFileSync(prodCsvPath, 'utf8').trim().split(/\r?\n/);
    assert.equal(prodLines.length, 204, 'Product reviews CSV must have 1 header + 203 reviews');
    assert.equal(prodLines[0], 'author_name,author_email,body,grade,created_at,product_id,photo_name');

    const compLines = fs.readFileSync(compCsvPath, 'utf8').trim().split(/\r?\n/);
    assert.equal(compLines.length, 16, 'Company reviews CSV must have 1 header + 15 reviews');
    assert.equal(compLines[0], 'author_name,author_email,body,grade,created_at,photo_name');

    // Strict EU Omnibus Privacy Invariant: First Names Only (zero surnames / spaces)
    // AND Strict Anti-Duplication Invariants: 100% Unique Authors and 100% Unique Bodies across all CSV rows
    let photoCount = 0;
    const prodAuthors = new Set();
    const prodBodies = new Set();
    const allCsvAuthors = new Set();
    const allCsvBodies = new Set();

    function parseCsvLine(line) {
      // Parse CSV line handling quoted fields
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
          result.push(cur);
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur);
      return result;
    }

    for (const line of prodLines.slice(1)) {
      const parts = parseCsvLine(line);
      const author = parts[0];
      const body = parts[2];
      assert.ok(!author.includes(' '), `Author name must not contain spaces/surnames: "${author}"`);
      assert.ok(!body.includes('!'), `CSV body must not contain exclamation marks: "${body}"`);
      prodAuthors.add(author);
      prodBodies.add(body);
      allCsvAuthors.add(author);
      allCsvBodies.add(body);
      if (line.includes('.jpg')) photoCount++;
    }

    const compAuthors = new Set();
    const compBodies = new Set();
    for (const line of compLines.slice(1)) {
      const parts = parseCsvLine(line);
      const author = parts[0];
      const body = parts[2];
      assert.ok(!author.includes(' '), `Author name must not contain spaces/surnames: "${author}"`);
      assert.ok(!body.includes('!'), `CSV body must not contain exclamation marks: "${body}"`);
      compAuthors.add(author);
      compBodies.add(body);
      allCsvAuthors.add(author);
      allCsvBodies.add(body);
      if (line.includes('.jpg')) photoCount++;
    }

    assert.equal(photoCount, 6, 'Must have exactly 6 mapped buyer photos across the dataset');
    assert.equal(prodAuthors.size, 203, 'All 203 product review authors must be unique first names');
    assert.equal(compAuthors.size, 15, 'All 15 company review authors must be unique first names');
    assert.equal(allCsvAuthors.size, 218, 'All 218 CSV review authors must be 100% unique across the entire dataset');
    assert.equal(prodBodies.size, 203, 'All 203 product review bodies must be 100% unique without duplication');
    assert.equal(compBodies.size, 15, 'All 15 company review bodies must be 100% unique without duplication');
    assert.equal(allCsvBodies.size, 218, 'All 218 CSV review bodies must be 100% unique across the entire dataset');
  });
});
