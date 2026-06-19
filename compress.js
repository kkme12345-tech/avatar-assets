const sharp = require('sharp');
sharp('assets/boy/base.png')
  .webp({ quality: 80 })
  .toFile('assets/boy/base.webp')
  .then(() => console.log('Compression Done'))
  .catch(console.error);
