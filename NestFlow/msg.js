import {select} from './select.js';

const nodifyVal=(argNode)=>
{ let value=argNode.val,
    type=v.type(value);
  const toString=()=>
  { if(value)
    { if(type!=='vrb')
      { value=JSON.stringify(value)
        return
      }//value is now a verb
      value=value.toString()
      return
    } //value is now falsy
    if(value===0)
    { value='N'; return}
    if(value===undefined)
    { value='Nd'; return}
    if(value==='')
    { value='Ns'; return}
    if(value===null)
    { value='No'; return}
    if(value===false)
    { value='Nt'; return}
    if(Number.isNaN(value))value='Nn'
  }; toString()
  //No IIFEs--too obscure and ugly.
  return `<b out="${type}">${value}</b> `
}

const msg=
{ chatty:true,
  stash:[],
  info:(html)=>infoNest.innerHTML=html,
  nogo:(verb,args)=>
  { msg.stash.push(msg[verb](...args))
    msg.displayArgStack()
  },
  push:(verb,args)=>
  { if(msg.chatty)msg.stash.push(msg[verb](...args))
  },
  currentResponses:{}, //to infoNest query
  respond:(str)=>
  { const action=msg.currentResponses[str.trim()]
    if(!action)return;
    action()
  },
  anyOut:(verb)=>
  (`"${verb}" outputs nothing in particular.`),
  fillerNotFound:(filler)=>
  (`String filler "${filler}" was not found.`),
  illFormedString:()=>
  (`This string is ill-formed.`),
  invalidName:(name)=>
  (`"${name}" is an invalid string for a name.`),
  nonEditSelection:()=>
  (`Selection outside editNode cannot be done until that node is removed by completing, deleting, or abandoning its flo.`),
  noNounInvocation:(word)=>
  (`Noun "${word}"cannot invoke arguments`),
  noOpenParen:(word)=>
  (`The closing paren on ${word} has no opening paren`),
  noSkifParens:()=>
  (`Skif args cannot be constrained by parenthesis.`),
  notAdjacentToArg:(name)=>
  (`The arg for "${name}" must immediately precede it.`),
  notEnoughArgs:(word,needed,onHand)=>
  (`"${word}" needs ${needed} args; only ${onHand} available.`),
  notFound:(word)=>
  (`"${word}" not found.`),
  notSingleArg:(name,onHand)=>
  (`"${name}" should terminate a flow by consuming one last arg, but there were ${onHand} available.`),
  outNameNotFound:(word)=>
  (`outName assignment "${word}@@" is invalid--it was not found in any higher scope. Please recompose.`),
  premptedOutName:(word)=>
  (`outName assignment "${word}@@" is invalid--it was found as an inName. Please recompose.`),
  skifArgsMismatch:(skif,needed,atHand)=>
  (`"${skif}" needs exactly ${needed} args to terminate this flow: ${atHand} available.`),
  tooDeep:(word)=>
  (`"${word}" would exceed max flow depth. Please recompose for less depth.`),
  typeMismatch:(word,expected,encountered)=>
  (`"${word}" expected (${expected.join(', ')}) args but encountered (${encountered.join(', ')}).`),
  unclosedParens:()=>
  (`This flow has unclosed parenthesis.`),
  unknownSignature:(verb)=>
  (`"${verb}" is a verb with unknown signature; so its arguments must be explicitly collected with parenthesis.`),
}
msg.displayArgStack=()=>
{ /*Displays the argStack prefixed by any info pushed onto msg.stash*/
  let text=' '
  while(msg.stash.length)
  { text=text+msg.stash.pop()+'<br/>'
  }
  text=text+'argStack: '
  //display values as wordNodes
  const argLen=argStack.length
  let argIndx=0, parenIndx=0;
  while(argIndx<argLen)
  { while(parenStack[parenIndx]===argIndx)
    { text=text+'('
      parenIndx++
    }
    text=text+nodifyVal(argStack[argIndx])
    argIndx++
  }
  infoNest.innerHTML=text
}
msg.displayValue=(nameNode)=>
{ infoNest.innerHTML=`${nameNode.outerHTML} has value ${nodifyVal(nameNode)}`
}
msg.grnRed=
{ query:function(type)
  { const msgStr=(query,grnStr,redStr)=>
    (`${query}<br/><b grn>&nbsp;${grnStr}&nbsp;</b>&nbsp;&nbsp;&nbsp;<b red>&nbsp;${redStr}&nbsp;</b>`)
    infoNest.innerHTML=msgStr(...this[type].strngs)
    select(infoNest)
    msg.currentResponses=this[type].responses
  },
  'deleteAll?':
  { strngs:['Do you really want to delete your entire program?','Cancel.','Yes.'],
    responses:
    { 'Cancel.':()=>
      { select(null)
        msg.displayArgStack()
      },
      'Yes.':()=>
      { oNest.textContent=''
        oNest.append(makeFlo())
        msg.displayArgStack()
        enterEditNode()
      },
    },
  },
}
conLog('msg.js installed')
export {msg}
