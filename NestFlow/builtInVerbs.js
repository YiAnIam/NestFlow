const vrb=
{ '-':a=>-a,
  '+':(a,b)=>
  { if(!a)a=0; if(!b)b=0; return Number(a)+Number(b)
  },
  '-+':(a,b)=>a-b,
  '/':a=>1/a,
  '*':(a,b)=>a*b, //multiply
  '/*':(a,b)=>a/b, //divide
  '~':(a,b)=>
  { if(!a)a=''; if(!b)b=''; return String(a)+String(b)
  },
  '%':(a,b)=>a%b,
  beep:()=>conLog('bEEeep'),
  ceil:Math.ceil,
  conLog:console.log,
  floor:Math.floor,
  random:Math.random,
  setTimeout:setTimeout,
  'skif=':(a,b)=>
  { if(a===b)return 1;
    return 0
  },
  strToLit:strToLit,
  type:(value)=>
  { if(value===Nd)return 'any'
    if(Array.isArray(value))return'ary'
    let type=(typeof(value)).slice(0,3);
    if(type==='fun')return'vrb'
    return type
  },
}
const sig= //signature: [outType,[inTypes]]
{ '-':['num',['num']],
  '+':['num',['num','num']],
  '-+':['num',['num','num']],
  '/':['num',['num']],
  '*':['num',['num','num']],
  '/*':['num',['num','num']],
  '~':['str',['str','str']],
  '%':['num',['num','num']],
  beep:['any',[]],
  ceil:['num',['num']],
  conLog:['str',['any']],
  floor:['num',['num']],
  random:['num',[]],
  setTimeout:['num',['vrb','num']],
  'skif=':['num',['any','any']],
  strToLit:['any',['str']],
  type:['str',['any']],
}
const findVerb=(word)=>
{ /*Returns a wordSpec specifying .out type; .vrb[0]==='v', meaning builtin verb; .vrb[1], an array of in types; .val, the arrow funtion defining the verb.*/
  const wordSpec={}
  //Careful, these are pithy early-out = BECOME assignments, NOT === equals comparisons.
  if(!(wordSpec.val=vrb[word]))return Nd
  if(!(wordSpec.out=sig[word][0]))return Nd
  if(word.slice(0,4)==='skif')
  { wordSpec.vrb=['s',sig[word][1]]
    return wordSpec
  }
  wordSpec.vrb=['v',sig[word][1]]
  return wordSpec
}
window.v=vrb
export{findVerb}
conLog('builtInVerbs.js loaded')
