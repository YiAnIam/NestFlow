/*This is the main entry into the module hierarchy--all modules ultimately support this one.*/
import './builtInVerbs.js';
import {msg} from './msg.js';
import {select,unFlo} from './select.js';
import {findInName,lookup} from './lookup.js';

const grabSelectionChange=()=>
{ /*Used only in editNode to provide unencroachable end spaces.*/
  if(sel.anchorNode!==editText && sel.focusNode!==editText)
  { sel.collapse(editText,1)
    return;
  }
  const ancrPos=sel.anchorOffset,
    end=editText.length-1;
  if(sel.isCollapsed)
  { if(ancrPos===0)
    { sel.collapse(editText,1)
      return;
    }
    if(ancrPos>=end)
    { sel.collapse(editText,end)
      return;
    }
  } //sel is a range with ancrPos
    //in editText not 0, not end;
    //and focsNode in editText
  const focsPos=sel.focusOffset
  if(focsPos>=end)
  { sel.extend(editText,end)
    return;
  }
  if(focsPos===0)
  { sel.extend(editText,1)
    return;
  }
}

const updateOutAttr=(attr,newType)=>
{ /*This updates a non-initial name assignment. attr has form 'typ var' or 'typ fix' + possibly ' sha', where typ is the type of the out value, and ' sha' is a shadowed name. These will be appended by ' abv' for an outName, meaning 'above'. The ' fix' attribute might be further accompanied by ' nxx', meaning prior initial assignment to a nullary literal, which functions as a mere declaration.*/
  if(attr.includes(' nxx'))
  { /*Allow nullary literal assignments to remain fixed on second assignment*/
    attr=attr.replace(' nxx','')
    //Set out type to second-assignment type
    attr=attr.replace(attr.slice(0,3),newType)
    return attr;
  }//Now, a regular non-initial assignment
  if(attr.includes(' fix'))
  { attr=attr.replace(' fix',' var')
  }
  if(!(attr.includes(newType)))
  { attr=attr.replace(attr.slice(0,3),'any')
  }
  return attr;
}

const assignInName=(wordNode,value,verbSpec)=>
{ const wordText=wordNode.textContent,
    newType=(wordNode.getAttribute('out')).slice(0,3);
  let nest=wordNode.parentElement.parentElement,
    //<b> to <h5> to <div>
    nameProlog=nest.firstElementChild
    //a presumption
  const appendNewName=()=>
  { const newName=wordNode.cloneNode(true)
    newName.removeAttribute('at')
    //fixName, inName presumption for new assignment:
    let newOutAttr=newType+' fix'
    //Does it shadow an outName?:
    nest=nest.parentElement
    while(nest.tagName==='DIV')
    { if(findInName(wordText,nest))
      { newOutAttr=newOutAttr+' sha'
        break
      }
      nest=nest.parentElement
    }
    /*Was newName assigned to a nullary literal?*/
    const beforeNameText=wordNode.previousElementSibling.previousElementSibling.textContent
    if(beforeNameText.length<=2 && 'NdNoNnNsNt'.includes(beforeNameText))
    { newOutAttr=newOutAttr+' nxx'
    }
    newName.setAttribute('out',newOutAttr)
    wordNode.setAttribute('out',newOutAttr)
    newName.vrb=verbSpec
    newName.val=value
    nameProlog.append(newName)
    nameProlog.append(' ')
    newName.onmouseenter=()=>
    { infoStash=infoNest.innerHTML
      msg.displayValue(newName)
    }
    newName.onmouseleave=()=>
    { infoNest.innerHTML=infoStash
    }
  }
  if(nameProlog.tagName!=='H6')
  { nameProlog=makeNode('h6','')
    nest.prepend(nameProlog)
    appendNewName()
    return S
  }
  /*nameProlog already exists*/
  let foundWord=nameProlog.firstElementChild
  while(foundWord && foundWord.textContent !== wordText)
  { foundWord=foundWord.nextElementSibling
  } 
  if(!foundWord)
  { appendNewName()
    return S
  }
  /*Here, wordNode was found in the nameProlog*/
  const newOutAttr=updateOutAttr(foundWord.getAttribute('out'),newType)
  foundWord.setAttribute('out',newOutAttr)
  wordNode.setAttribute('out',newOutAttr)
  foundWord.vrb=verbSpec
  foundWord.val=value
}

const assignOutName=(wordNode,value,verbSpec)=>
{ const wordText=wordNode.textContent
  let nest=editNode.parentElement.parentElement
  if(findInName(wordText,nest))
  { msg.nogo('premptedOutName',[wordText])
    /*undo the attempted name assignment*/
    unFlo(editNode.parentElement)
    return N;
  }
  nest=nest.parentElement
  while(nest.tagName==='DIV')
  { const foundName=findInName(wordText,nest)
    if(foundName)
    { const newOutAttr=updateOutAttr(foundName.getAttribute('out'),(wordNode.getAttribute('out')).slice(0,3));
      foundName.setAttribute('out',newOutAttr)
      wordNode.setAttribute('out',newOutAttr+' abv')
      //outName in some ' abv' nameProlog
      foundName.vrb=verbSpec
      foundName.val=value
      return S;
    }
    nest=nest.parentElement
  }
  msg.nogo('outNameNotFound',[wordText])
  /*undo the attempted name assignment*/
  unFlo(editNode.parentElement)
  return N;
}

const installWord=()=>
{ let word,outType,trimmedEditText,
    prefix,closeParen;
  const getNextWord=()=>
  { outType='any'
    trimmedEditText=editText.textContent.trimLeft()
    let preIndx=0
    while(trimmedEditText[preIndx]==='(')
    { parenStack.push(argStack.length)
      preIndx++
    }
    prefix=trimmedEditText.slice(0,preIndx)
    closeParen=0
    if(trimmedEditText[preIndx]===')')
    { preIndx++
      closeParen=1
    }
    trimmedEditText=trimmedEditText.slice(preIndx)
    let wordEnd=trimmedEditText.indexOf(' ')
    if(trimmedEditText[0]==='`')
    { //Parse string "word"
      wordEnd=0
      do
      { wordEnd=trimmedEditText.indexOf('`',wordEnd+1)
      } while(trimmedEditText[wordEnd-1]==='\\')
      outType='str'
      wordEnd++
      if(trimmedEditText[wordEnd]==='`')
      { /*a double post-ticked literal to be unquoted in lookup(word)*/
        wordEnd++
      }
    }
    { word=trimmedEditText.slice(0,wordEnd)
      trimmedEditText=trimmedEditText.slice(wordEnd).trim()
      return 1
    }
  }

  let argTie
  const placeWord=()=>
  { const wordNode=makeNode('b',word)
    wordNode.setAttribute('out',outType)
    const argTieNode=makeNode('s',argTie)
    argTieNode.setAttribute('at','.')
    editNode.before(wordNode)
    editNode.before(argTieNode)
    editText.textContent=' '+trimmedEditText+' '
    sel.collapse(editText,1)
    return wordNode
  }

  const consumedArgs=[]
  let argsNeeded,argsAtHand,funArgs
  const connectVerb=()=>
  { let argsDescent=0 //baseline
    const verbNode=placeWord()
    if(argTie!=='| '&& outType==='any')
    { verbNode.nextElementSibling.setAttribute('warn','')
      msg.push('anyOut',[word])
    }
    if(argsNeeded)
    { //specify argsDescent
      const leftArg=argStack[argStack.length-argsNeeded].node
      const leftArgDesc=Number(leftArg.getAttribute('at'))
      if(argTie==='@'||argTie==='@@')
      //inName or outName assignment
      { //Put name two spaces adjacent to its value.
        const tieNode=leftArg.nextElementSibling
        tieNode.innerText=' '
        tieNode.setAttribute('at',leftArgDesc)
        argStack.pop()
        verbNode.before(' ') //unclutter
        verbNode.setAttribute('at',leftArgDesc)
        verbNode.nextElementSibling.setAttribute('at',leftArgDesc+'t')
        //'t' makes a flow 't'erminator (@ or @@ here) bold black
        return verbNode;
      } //Now verb is not name assignment: argTie==='o ' or '| '
      let nextWord=leftArg.nextElementSibling.nextElementSibling
      while(nextWord!==verbNode)
      { nextWord=nextWord.nextElementSibling.nextElementSibling
        const betweenDescent=Number(nextWord.getAttribute('at'))
        if(betweenDescent<=argsDescent)
        { argsDescent=betweenDescent-1
        }
      }
      /*keep new verb on a different level from leftArg verb*/
      if(argsDescent === leftArgDesc)argsDescent--
      if(argsDescent<-4)
      { msg.nogo('tooDeep',[word])
        const finalArgTie=editNode.previousElementSibling
        if(finalArgTie.textContent==='o ')finalArgTie.textContent=' '
        unFlo(editNode.parentElement)
        return N
      }
      /*connect args to verb*/
      const argTypes=[]
      while(argsNeeded>0)
      { const arg=argStack.pop(),
          argWord=arg.node,
          argType=(argWord.getAttribute('out')).slice(0,3);
        consumedArgs.unshift(arg.val)
        argTypes.unshift(argType)
        const nextTieNode=argWord.nextElementSibling
        //remove output marker
        nextTieNode.innerText=' '
        //set argTie descent
        nextTieNode.setAttribute('at',argsDescent)
        argsNeeded--
      }
      if(funArgs)
      { let argLen=funArgs.length
        if(argLen !== argTypes.length)
        { msg.push('typeMismatch',[word,funArgs,argTypes])
          argLen=0 //to skip while
        }
        while(argLen)
        { const expectedArgType=funArgs[argLen-1]
          if(argTypes[argLen-1] !== expectedArgType && expectedArgType !== 'any')
          { msg.push('typeMismatch',[word,funArgs,argTypes])
            break
          }
          argLen--
        }
      }
    }
    verbNode.setAttribute('at',argsDescent)
    verbNode.nextElementSibling.setAttribute('at',argsDescent+'.')
    return verbNode
  }

  /*Excecution of installWord() begins here.*/
  getNextWord()
  const lastChar=word.slice(-1);
  if(lastChar==='@')
  { /*Assign inName or outName. Both function as a unary verb.*/
    word=word.slice(0,-1)
    argTie='@'//presume inName
    if(word.slice(-1) === '@')
    { //outName
      word=word.slice(0,-1)
      argTie='@@'
    }
    try
    { Function(`let ${word}=undefined`)
    }
    catch
    { msg.nogo('invalidName',[word+argTie])
      return N
    }
    if(argStack.length!==1)
    { msg.nogo('notSingleArg',[word+argTie,argStack.length])
      return N
    }
    if(parenStack.length!==0)
    { msg.nogo('unclosedParens',[])
      return N
    }
    const lastArg=argStack[0],
      value=lastArg.val,
      verbSpec=[v.type(value)==='vrb'?'f':'n',Nd];
    if(lastArg.node.nextElementSibling !== editNode.previousElementSibling)
    { msg.nogo('notAdjacentToArg',[word+argTie])
      return N
    }
    outType=(lastArg.node.getAttribute('out')).slice(0,3)
    argsNeeded=1; funArgs=['any'];
    if(argTie === '@')
    { assignInName(connectVerb(),value,verbSpec)
      return S
    } //argTie === '@@'
    assignOutName(connectVerb(),value,verbSpec)
    return S
  }
  //not name assignment now
  //Verb output-blocking or nominalization?
  if(`|,`.includes(lastChar))word=word.slice(0,-1)
  argTie=(lastChar==='|')? '| ' : 'o '
  const wordSpec=lookup(word)
  if(!wordSpec)
  { let preLen=prefix.length
    while(preLen)
    { //Undo (-prefix processing of getNextWord()
      parenStack.pop()
      preLen--
    }
    msg.nogo('notFound',[word])
    return N
  }
  editNode.before(prefix)
  outType=wordSpec.out
  const wordObj={val:wordSpec.val}
  /*wordObj will also acquire a .node; and this .val will replace itself if it consumes other values. Then, wordObjs that are args will go on the argStack.*/
  if(wordSpec.vrb[0]==='n')
  { /*a noun viewed as a unary verb*/
    if(closeParen)
    { msg.nogo('noNounInvocation',[word])
      return N
    }
    wordObj.node=placeWord()
    argStack.push(wordObj)
    return S;
  }
  funArgs=wordSpec.vrb[1]
  if(wordSpec.vrb[0]==='s')
  { /*a skif*/
    if(closeParen)
    { msg.nogo('noSkifParens',[])
      return;
    }
    if(parenStack.length!==0)
    { msg.nogo('unclosedParens',[])
      return;
    }
    argsNeeded=funArgs.length
    argsAtHand=argStack.length
    if(argsNeeded!==argsAtHand)
    { msg.nogo('skifArgsMismatch',[word,argsNeeded,argsAtHand])
      return;
    }
    const skifNode=connectVerb()
    if(!skifNode) return;
    skifNode.nextElementSibling.remove()
    skifNode.setAttribute('at',skifNode.getAttribute('at')+'t')
    const thisFlow=skifNode.parentElement
    thisFlow.setAttribute('skif',wordObj.val(...consumedArgs))
    consumedArgs.length=0
    let skipNest=thisFlow.nextElementSibling
    if(!skipNest || skipNest.tagName!=='DIV')
    { skipNest=makeNest()
      thisFlow.after(skipNest)
      enterEditNode()
      return;
    }
    return S
  }
  if(wordSpec.vrb[0]==='v')
  {  /*a v-erb*/
    if(lastChar===',')
    { /*a verb as a noun*/
      word=word+','
      if(closeParen)
      { msg.nogo('noNounInvocation',[word])
        return;
      }
      outType='vrb'
      wordObj.node=placeWord()
      argStack.push(wordObj)
      return S;
    }
    if(funArgs)
    { /*A built-in verb.*/
      argsAtHand=argStack.length
      if(parenStack.length)
      { argsAtHand=argsAtHand-parenStack.slice(-1)
      }
      argsNeeded=funArgs.length
      if(closeParen)
      { if(!parenStack.length)
        { msg.nogo('noOpenParen',[word])
          return;
        }
        if(argsAtHand===0 && argsNeeded!==0)
        { msg.push('typeMismatch',[word,funArgs,[]])
        }
        parenStack.pop()
        argsNeeded=argsAtHand
        editNode.before(')')
      }
      if(argsAtHand < argsNeeded)
      { msg.nogo('notEnoughArgs',[word,argsNeeded,argsAtHand])
        return;
      }
    }
    if(!funArgs) //explict else for clarity.
    { /*An external verb*/
      if(!closeParen)
      { msg.nogo('unknownSignature',[word])
        return N
      }
      if(!parenStack.length)
      { msg.nogo('noOpenParen',[word])
        return N
      }
      argsAtHand=argStack.length-parenStack.pop()
      argsNeeded=argsAtHand
      editNode.before(')')
    }
    wordObj.node=connectVerb()
    if(!wordObj.node) return;
    /*apply this verb to its args.*/
    const verbVal=wordObj.val
    wordObj.val=verbVal(...consumedArgs)
    consumedArgs.length=0
    if(lastChar==='|')return S
    argStack.push(wordObj)
    return S
  }
  return;
}

const composeWord=(keydown)=>
{ const flo=editNode.parentElement
  if(!flo)return;
  const key=keydown.key
  if(key===' ')
  { if(keydown.shiftKey) return;
    keydown.preventDefault()
    if(!installWord())return;
    if(argStack.length===0)
    { if(parenStack.length!==0)
      { msg.nogo('unclosedParens',[])
        return;
      }
      //a complete non-vacuous flow
      editNode.remove()
      select(flo)
    }
    msg.displayArgStack()
  }
}

/*initialize*/
document.addEventListener('selectionchange',grabSelectionChange,true)//used only by editNode
editNode.addEventListener('keydown',composeWord,true)
enterEditNode()
conLog('compose.js installed')
export{installWord}
