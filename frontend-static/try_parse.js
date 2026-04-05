const fs = require('fs');
const s = fs.readFileSync('app.js','utf8');
try{
  new Function(s);
  console.log('PARSE_OK');
}catch(e){
  console.error('PARSE_ERROR', e && e.message);
  if(e && e.stack) console.error(e.stack);
  process.exit(1);
}
