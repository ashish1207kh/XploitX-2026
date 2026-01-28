const fs = require('fs');

const filePath = 'e:\\hackathon\\styles.css';

try {
    let content = fs.readFileSync(filePath, 'binary'); // Read as binary to preserve bytes

    // 1. Fix the UTF-16LE append issue (The corrupted tail)
    // The previous 'type' command likely appended UTF-16LE text to a UTF-8 file.
    // We need to find where the corruption starts. 
    // It starts with "/* --- WHAT TO EXPECT" but likely with null bytes.
    // We'll search for the signature of the append.

    // The good file ended around line 1304 with a closing brace of a media query.
    // Let's find the LAST occurrence of "/* --- WHAT TO EXPECT" and replace everything after it with the clean CSS.
    // OR simpler: The corrupted text has null bytes (\x00). We can just strip all null bytes from the file?
    // But wait, the file is mixed. The first part is UTF-8 (no nulls), the second part is UTF-16 (has nulls).
    // If we strip nulls, UTF-16 "t\0" becomes "t". This might fix it!

    // Let's try stripping null bytes first.
    // content is a string but read as binary ('latin1').

    let fixedContent = content.replace(/\x00/g, '');

    // 2. Fix the corrupted .node-role-label middle part
    // I accidentally replaced .node-role-label with .text-box strong...
    const brokenMiddle = `.node-rol.text-box strong {
            color: #ffffff;
            font-size: 1.1rem;
            margin-bottom: 4px;
            letter-spacing: 0.5px;
            font-weight: bold;
        }

        .text-box span {
            color: #b0b0b0;
            /* Light grey for better readability */
            font-size: 0.9rem;
            font-family: 'Share Tech Mono', monospace;
        }`;

    const fixedMiddle = `.node-role-label {
            color: #aaa;
            font-size: 1rem;
            margin-bottom: 20px;
            display: block;
            letter-spacing: 1px;
            font-family: 'Share Tech Mono', monospace;
        }`;

    // Normalize newlines for matching
    // fixedContent might have varying newlines.

    // Let's do a more robust replace for the middle part
    if (fixedContent.includes('.node-rol.text-box strong')) {
        console.log("Found broken middle part, fixing...");
        // We'll use a regex to match the block loosely
        fixedContent = fixedContent.replace(
            /\.node-rol\.text-box strong\s*\{[^}]+\}\s*\.text-box span\s*\{[^}]+\}/s,
            fixedMiddle
        );
    } else {
        console.log("Could not find broken middle part via exact match.");
    }

    // 3. Ensure the colors at the end are correct (they might be the old ones #888 if the append was the old file)
    // Wait, Step 85 created styles-new.css with lines:
    // .text-box strong { color: #fff ... }
    // .text-box span { color: #888 ... }
    // Then Step 108 tried to update them to #ffffff and #b0b0b0 but failed (replaced middle).
    // So the tail (now cleaned of nulls) will still have #fff and #888.
    // We need to update them to #ffffff and #b0b0b0.

    fixedContent = fixedContent.replace(
        /\.text-box strong\s*\{\s*color:\s*#fff;/g,
        '.text-box strong {\n    color: #ffffff;\n    font-weight: bold;'
    );

    fixedContent = fixedContent.replace(
        /\.text-box span\s*\{\s*color:\s*#888;/g,
        '.text-box span {\n    color: #b0b0b0;'
    );


    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log("Successfully fixed styles.css");

} catch (err) {
    console.error("Error fixing styles:", err);
}
