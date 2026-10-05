#!/usr/bin/env node
/**
 * Send Signed Statement, Compliant CSVs & Photos directly to Paulina Zając / TrustMate Support (support@trustmate.io)
 * via macOS Mail.app from 123hxsmyxh@gmail.com
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const recipient = 'support@trustmate.io';
const sender = '123hxsmyxh@gmail.com';
const subject = 'Re: Odp.:Import Reviews & Buyer Photos for GlintMuse (glintmuse.com)';

const signedPdfPath = '/Users/vecsatfoxmailcom/Documents/Cowork/Antigravity Cowork/26.02.06 Assesories/reviews/signed - Statement Regarding Customer Reviews EN-1.pdf';
const prodCsvPath = path.join(rootDir, 'evidence', 'Product_Reviews_GlintMuse_2026.csv');
const compCsvPath = path.join(rootDir, 'evidence', 'Company_Reviews_GlintMuse_2026.csv');
const zipPath = path.join(rootDir, 'evidence', 'GlintMuse_Reviews_and_Photos_for_TrustMate.zip');

const filesToAttach = [
  { name: 'Signed Declaration PDF', path: signedPdfPath },
  { name: 'Product Reviews CSV', path: prodCsvPath },
  { name: 'Company Reviews CSV', path: compCsvPath },
  { name: 'Complete Archive ZIP', path: zipPath }
];

for (const item of filesToAttach) {
  if (!fs.existsSync(item.path)) {
    console.error(`Required file not found: [${item.name}] at ${item.path}`);
    process.exit(1);
  }
}

const bodyContent = `Hi Paulina,

Thank you for your prompt response and clear instructions!

We have prepared all the required materials in strict accordance with your guidelines:

1. Signed Declaration:
   Attached is the completed and signed declaration ("signed - Statement Regarding Customer Reviews EN-1.pdf") executed by our authorized representative (Vector Yang, GlintMuse LLC).

2. Reviews CSV Files:
   We have updated our reviews and separated them into the two requested CSV structures, ensuring all authors contain only first names without surnames:
   - "Product_Reviews_GlintMuse_2026.csv": 203 product reviews with columns [author_name, author_email, body, grade, created_at, product_id, photo_name].
   - "Company_Reviews_GlintMuse_2026.csv": 15 store & brand experience reviews with columns [author_name, author_email, body, grade, created_at, photo_name].

3. Buyer Show Photos & Complete Archive:
   - For reviews with photos, the 'photo_name' column contains the exact filename (e.g. 01_selenite_plate_bedside_snapshot.jpg).
   - The full archive ("GlintMuse_Reviews_and_Photos_for_TrustMate.zip") is attached, containing all high-resolution JPG images, the two CSVs, and the signed declaration.

Store Account Details:
- Domain: https://glintmuse.com/
- TrustMate Account ID: 27487 (glintmuse.com)

Could you please proceed with the import for our account? Please let us know if anything else is needed.

Thank you very much for your wonderful support!

Best regards,
Vector Yang
GlintMuse Team
123hxsmyxh@gmail.com
`;

console.log(`Preparing AppleScript to dispatch reply via Mail.app...`);
console.log(`From   : ${sender}`);
console.log(`To     : ${recipient}`);
console.log(`Subject: ${subject}`);
console.log(`Attachments:`);
for (const item of filesToAttach) {
  const stats = fs.statSync(item.path);
  console.log(` - ${item.name}: ${item.path} (${stats.size} bytes)`);
}

function escapeAs(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

let attachmentLines = '';
for (const item of filesToAttach) {
  attachmentLines += `        set theFile to (POSIX file "${escapeAs(item.path)}") as alias\n`;
  attachmentLines += `        tell content\n`;
  attachmentLines += `            make new attachment with properties {file name:theFile} at after the last paragraph\n`;
  attachmentLines += `        end tell\n`;
}

const appleScript = `
tell application "Mail"
    set theSubject to "${escapeAs(subject)}"
    set theContent to "${escapeAs(bodyContent)}"
    set theSender to "${escapeAs(sender)}"
    set theRecipient to "${escapeAs(recipient)}"
    
    set msg to make new outgoing message with properties {subject:theSubject, content:theContent & linefeed & linefeed, visible:true}
    tell msg
        set sender to theSender
        make new to recipient at end of to recipients with properties {address:theRecipient}
${attachmentLines}
    end tell
    delay 3
    send msg
end tell
`;

const tempScriptPath = '/tmp/send_trustmate_reply.applescript';
fs.writeFileSync(tempScriptPath, appleScript, 'utf8');

try {
  const result = execSync(`osascript "${tempScriptPath}"`, { encoding: 'utf8' });
  console.log('AppleScript executed successfully:', result.trim() || '(Message sent to TrustMate support)');
  fs.unlinkSync(tempScriptPath);
} catch (err) {
  console.error('Failed to execute AppleScript:', err.message);
  process.exit(1);
}
