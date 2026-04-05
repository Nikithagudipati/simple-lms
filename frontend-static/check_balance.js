const fs = require('fs');
const s = fs.readFileSync('app.js','utf8');
let stack = [];
const opens = {'{':'}','(':')','[':']'};
const closes = {'}':'{',')':'(',']':'['};
for(let i=0;i<s.length;i++){
  const ch=s[i];
  if(opens[ch]){stack.push({ch,idx:i});}
  else if(closes[ch]){
    if(stack.length===0){console.log('Unmatched close',ch,'at',i);process.exit(0);} 
    const top=stack[stack.length-1];
    if(top.ch!==closes[ch]){console.log('Mismatched close',ch,'at',i,'expected',opens[top.ch],'top idx',top.idx);process.exit(0);} 
    stack.pop();
  }
}
if(stack.length) console.log('Unclosed openings remain:', stack.map(x=>x.ch+'@'+x.idx).slice(0,10)); else console.log('All balanced');
