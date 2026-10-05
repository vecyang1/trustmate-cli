#!/usr/bin/env node
/**
 * Send GlintMuse 218 Reviews & Buyer Show Photos directly to TrustMate Customer Service (support@trustmate.io)
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
const subject = 'Import Reviews & Buyer Photos for GlintMuse (glintmuse.com)';

const zipPath = path.join(rootDir, 'evidence', 'GlintMuse_Reviews_and_Photos_for_TrustMate.zip');
const uploadCsvPath = path.join(rootDir, 'evidence', 'Reviews_to_Upload_GlintMuse_2026.csv');

if (!fs.existsSync(zipPath)) {
  console.error(`Zip file not found at: ${zipPath}`);
  process.exit(1);
}
if (!fs.existsSync(uploadCsvPath)) {
  console.error(`Upload CSV not found at: ${uploadCsvPath}`);
  process.exit(1);
}

const bodyContent = `Hi Klaudia & TrustMate Support Team,

Hope this email finds you well.

We previously worked together on importing customer reviews for our other brand (Beloved Pals). We have now launched our luxury gemstone and crystal jewelry store GlintMuse:
- Store Domain: https://glintmuse.com/
- TrustMate Account ID: 27487 (glintmuse.com)

Our product catalog has already been fully synchronized into TrustMate via the product feed (all 72 products and SKUs are currently active in account 27487).

We would like to request your assistance to import our customer reviews and customer show photos into our GlintMuse account:

1. Reviews File:
   Attached CSV ("Reviews_to_Upload_GlintMuse_2026.csv") containing 218 reviews covering our product catalog and store feedback.
   - For reviews with photos, the 'Photo' column contains the exact image filename without extension (matching the files in the photos folder, as per your guidelines).

2. Buyer Photos:
   Inside the attached ZIP file ("GlintMuse_Reviews_and_Photos_for_TrustMate.zip"), the 'buyer_show_photos' folder contains the high-resolution JPG images corresponding to the Photo column names.

Could you please help us import these reviews and photos into our GlintMuse account (ID: 27487)?

Please let us know if any further information or signature statement is required from our end.

Thank you so much for your continuous support!

Best regards,
Vy
GlintMuse Team
123hxsmyxh@gmail.com
`;

console.log(`Preparing AppleScript to dispatch email via Mail.app...`);
console.log(`From   : ${sender}`);
console.log(`To     : ${recipient}`);
console.log(`Subject: ${subject}`);
console.log(`Attachments:`);
console.log(` - ${zipPath}`);
console.log(` - ${uploadCsvPath}`);

function escapeAs(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

const appleScript = `
tell application "Mail"
    set theSubject to "${escapeAs(subject)}"
    set theContent to "${escapeAs(bodyContent)}"
    set theSender to "${escapeAs(sender)}"
    set theRecipient to "${escapeAs(recipient)}"
    
    set theZip to (POSIX file "${escapeAs(zipPath)}") as alias
    set theUploadCsv to (POSIX file "${escapeAs(uploadCsvPath)}") as alias
    
    set msg to make new outgoing message with properties {subject:theSubject, content:theContent & linefeed & linefeed, visible:true}
    tell msg
        set sender to theSender
        make new to recipient at end of to recipients with properties {address:theRecipient}
        tell content
            make new attachment with properties {file name:theZip} at after the last paragraph
            make new attachment with properties {file name:theUploadCsv} at after the last paragraph
        end tell
    end tell
    delay 2
    send msg
end tell
`;

const tempScriptPath = '/tmp/send_trustmate_support_mail.applescript';
fs.writeFileSync(tempScriptPath, appleScript, 'utf8');

try {
  const result = execSync(`osascript "${tempScriptPath}"`, { encoding: 'utf8' });
  console.log('AppleScript executed successfully:', result.trim() || '(Message sent to TrustMate support)');
  fs.unlinkSync(tempScriptPath);
} catch (err) {
  console.error('Failed to execute AppleScript:', err.message);
  process.exit(1);
}
