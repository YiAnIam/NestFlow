import {msg} from './msg.js'
import {findVerb} from './builtInVerbs.js'

const findInName=(name,nest)=>
{ const nameProlog=nest.firstElementChild
  if(nameProlog.tagName!=='H6')return;
  let theWord=nameProlog.firstElementChild
  while(theWord && theWord.textContent!==name)
  { theWord=theWord.nextElementSibling
  } 
  return theWord//valid word node or null
}

const lookup=(word)=>
{ /*Returns a wordSpec specifying .out, a string of space-separated 3-char types beginning with out type, potentially followed by name type info; .vrb[0]==='n' or 'v' or 'f' or 'm' meaning Noun or builtin Verb or Function or Method; .vrb[1], an array of the arg types; .val, the value of the word.*/
  if(word==='')return;
  const builtInVerb=findVerb(word)
  if(builtInVerb)
  { /*.out===3-char outType; .vrb[0]==='v'; .vrb[1]===input signature ary, possibly empty; .val===a built-in NestFlow arrow function*/
    return builtInVerb
  }

  let wordSpec={}, stripQuotes=0
  try //to find JavaScript word
  { if(word.slice(-2)==='``' && word[0]==='`')
    { //strip quotes for literal lookup
      word=word.slice(1,-2)
      stripQuotes=1
    }
    let value=strToLit(word)
    //may abort to catch block
    wordSpec.val=value
    const type=v.type(value);
    if(type==='vrb')
    { wordSpec.out='any'
      wordSpec.vrb=['f',Nd]
      return wordSpec
    }
    wordSpec.out=type
    wordSpec.vrb=['n',Nd]
    return wordSpec;
  } 
  catch(e)
  { if(stripQuotes)
    { /*Failed litertal lookup.*/
      msg.push('noLiteral',[word])
      return Nd
    }
    if(word[0]==='`' && word.slice(-1)==='`')
    { /*Failed JavaScript string interpolation (likely due to a failed variable lookup); so NestFlow will now try to do that itself. It proceeds by successively partitioning word into a head, a ${...} value-filler, and a tail.*/
      let head='',filler='',
        tail=word.slice(1,-1);
      while(tail)
      { /*This finds the next ${...} filler in the tail, computes its string value, concatenates that with the head, and sets the tail to the string after the filler. If there is no filler, this concats the tail to the head and exits the loop. If there is a lookup failure, a message is pushed and Nd is returned.*/
        const fillStart=tail.indexOf('${')
        if(fillStart===-1)
        { head=head+tail
          break
        }
        const fillEnd=tail.indexOf('}')
        if(fillEnd===-1)
        { msg.push('illFormedString',[])
          return Nd
        }
        filler=tail.slice(fillStart+2,fillEnd).trim()
        const fillSpec=lookup(filler)
        if(!fillSpec)
        { msg.push('fillerNotFound',[filler])
          return Nd
        }
        head=head+tail.slice(0,fillStart)+String(fillSpec.val)
        tail=tail.slice(fillEnd+1)
      }
      wordSpec.out='str'
      wordSpec.vrb=['n',Nd]
      wordSpec.val=head
      return wordSpec;
    }
  }

  //try to find inName or outName
  { let nest=editNode.parentElement.parentElement
    let outName=''//inName on first pass
    while(nest.tagName === 'DIV')
    { const foundName=findInName(word,nest)
      if(foundName)
      { let foundAttr=foundName.getAttribute('out')
        wordSpec.out=foundAttr + outName
        wordSpec.val=foundName.val
        wordSpec.vrb=foundName.vrb
        return wordSpec;
      }
      nest=nest.parentElement
      outName=' abv' //above current nameProlog
    }
  }
  return Nd
}
conLog('lookup.js installed')
export {findInName, lookup}
