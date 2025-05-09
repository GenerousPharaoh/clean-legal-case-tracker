import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple 1x1 pixel PNG (base64 encoded)
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==';

const imagePath = path.join(__dirname, 'fixtures', 'image.png');
fs.writeFileSync(imagePath, Buffer.from(pngBase64, 'base64'));

console.log('Test image created successfully!'); 