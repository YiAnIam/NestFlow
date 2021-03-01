import {installWord} from './compose.js';
import {msg} from './msg.js';

let selNode=editNode,
  nodeClip=null;

const select=(node)=>
{ if(selNode)selNode.removeAttribute('sel')
  selNode=node //could be null
  if(selNode)selNode.setAttribute('sel','')
}

window.enterEditNode=()=>
{ /*A DOM specialization used by all NestFlow modules, but dependent on select() and selNode. Attachment to window sidesteps repeated imports.*/
  if(!editNode.parentElement) return;
  select(editNode)
  sel.collapse(editText,1)
  editNode.focus()
  editNode.normalize()
}

const snip=()=>
{ /*Remove selected flo or nest and also remove any resulting ancestor emptiness.*/
  const snipUp=(node)=>
  { if(node===oNest)
    { oNest.append(makeFlo())
      enterEditNode()
      return;
    }
    const nodePa=node.parentElement,
      prevSibl=node.previousElementSibling;
    if(prevSibl&&prevSibl.hasAttribute('skif'))
    { /*remove the skif for this nest*/
      prevSibl.remove()
    }
    node.remove()
    selNode=nodePa; reFlowSelNest()
    const elmtCount=nodePa.childElementCount
    if(elmtCount===0)
    { snipUp(nodePa)
    }
    if(elmtCount===1)
    { const onlyChild=nodePa.firstElementChild
      if(onlyChild.tagName==='DIV')
      { /*a double-wrapped nest*/
        if(nodePa===oNest)
        { editNode.removeAttribute('id')
          onlyChild.setAttribute('id','oNest')
          oNest=onlyChild
        }
        nodePa.replaceWith(onlyChild)
      }
    }
  }
  if(!selNode)return;
  if(selNode===oNest)
  { msg.grnRed.query('deleteAll?')
    return;
  }
  argStack.length=0; parenStack.length=0
  {snipUp(selNode)}
  msg.displayArgStack()
}

const unFlo=(flo)=>
{ if(!flo||flo.tagName!=='H5') return;
  flo.removeAttribute('skif')
  if(flo.firstElementChild!==editNode)
  { //Unflow.
    while(argStack.length>0)
    { (argStack.pop()).node.nextElementSibling.textContent=' '
    }
    parenStack.length=0
    editText.textContent=' '+flo.textContent.trim()+' '
    flo.textContent=''
    flo.append(editNode)
    enterEditNode()
    return;
  }//flo is already unflowed, so abandon it.
  flo.textContent=editText.textContent
  editText.textContent='  '
  editNode.remove()
  flo.setAttribute('raw','')
  select(null)
  return;
}

const reFlowSelNest=()=>
{ if(!selNode||selNode.tagName!=='DIV')return;
  /*only a selected nest can be reflowed*/ 
  const nestStack=[], nest=selNode
  let nextElmt=selNode
  msg.chatty=false; msg.info('reflowing')
  const reFlow=(flow)=>
  { unFlo(flow)
    while(installWord())
    { if(argStack.length===0)
      { editNode.remove(); break}
    }
    if(argStack.length!==0)return 0;
    /*a flow interrupted by installWord*/
    else return 1 /*a successful flow*/
  }
  while(nextElmt)
  { if(nextElmt.tagName==='DIV')
    { nestStack.push(nextElmt)
      nextElmt=nextElmt.firstElementChild
      //remove nameProlog
      if(nextElmt&&nextElmt.tagName==='H6')
      { const nameProlog=nextElmt
        nextElmt=nextElmt.nextElementSibling
        nameProlog.remove()
      }
    }//is nextElmt a flow?
    if(nextElmt&&nextElmt.tagName==='H5')
    { if(!nextElmt.hasAttribute('raw'))
      { /*Do not reflow an abandoned flo.*/
        if(!reFlow(nextElmt))
        { /*reflow failed with failure msg*/
          msg.chatty=true; return;
        }
      }
      nextElmt=nextElmt.nextElementSibling
    }//if end of nest, hop over end.
    if(!nextElmt&&nestStack.length>1)
    { nextElmt=nestStack.pop().nextElementSibling
    }
  }
  select(nest); msg.chatty=true;
  msg.displayArgStack()
}

const grabSelectStart=(selStart)=>
{ const startNode=selStart.target
  if(startNode===editText)
  { /*A re-entry into compose mode--editText is absent in selection mode, so in that mode it never could have been seletStarted.*/
    msg.displayArgStack()
    return;
  }
  /*NestFlow makes all non-editNode selections itself because contenteditable selections would mangle the syntax.*/
  selStart.preventDefault()
  if(selNode===editNode)
  { /*Here, selStart was not editText (from the previous bailout), but it should have been since the selNode was in compose mode (from this bailout).*/
    msg.nogo('nonEditSelection',[])
    return;
  }
  /*If node is text, get its tagged parent element. Relevant elements now are a <b>word</b>, a <h5>flow</h5>, a <div>nest</div>.*/
  let selStrtElmt=startNode.tagName? startNode: startNode.parentElement,
    nodeTag=selStrtElmt.tagName

  //Treat infoNest selection separately.
  if(selNode===infoNest)
  { if(nodeTag==='B'&&selStrtElmt.parentElement===infoNest)
    { msg.respond(selStrtElmt.textContent)}
    return;
  }
  if(selStrtElmt===infoNest)
  { /*Eventually display menu, but for now just . . .*/
    return;
  }
  /*Here, selStrtElmt is neither editText nor infoNest; so, Is it in a flow or a nest?*/
  if(nodeTag!=='H5'&&nodeTag!=='DIV')
  { selStrtElmt=selStrtElmt.parentElement
    if(!selStrtElmt)return;//nodeTag was 'HTML'.
    nodeTag=selStrtElmt.tagName
  }
  if(selStrtElmt.hasAttribute('raw'))
  { //Un-abandon flo.
    selStrtElmt.removeAttribute('raw')
    editText.textContent=selStrtElmt.textContent
    selStrtElmt.firstChild.replaceWith(editNode)
    enterEditNode()
    return;
  }
  if(nodeTag==='H5'||nodeTag==='DIV')
  { if(selNode)selNode.removeAttribute('sel')
    if(selStrtElmt===selNode)
    { selNode=null
      return;
    }/*Here selStrtElmt!==selNode.*/
    selNode=selStrtElmt
    selNode.setAttribute('sel','')
    return;
  }/*Otherwise, selStrtElmt was not a valid selection.*/
}

const grabKeyDown=(keyDown)=>
{ const key=keyDown.key
  if(selNode===editNode)
  { //compose-mode responses
    const flo=editNode.parentElement
    if(key==='Enter')
    { keyDown.preventDefault()
      unFlo(flo)
      msg.displayArgStack()
      return;
    }
    if(key==='Tab')
    { keyDown.preventDefault()
      return;
    }
    if(keyDown.metaKey)
    { if(key==='a')//select all
      { keyDown.preventDefault()
        sel.setBaseAndExtent(editText,1,editText,editText.length-1)
        return;
      }
      if(key==='v')//paste raw text only
      { keyDown.preventDefault()
        const range=sel.getRangeAt(0)
        range.deleteContents()
        navigator.clipboard.readText().then(clipText=>
        { range.insertNode(document.createTextNode(clipText))
          editNode.normalize()
        })
        return;
      }
    }
    if(key==='Backspace'||key==='Delete')
    { if(editText.length < 3)
      { keyDown.preventDefault()
        editNode.remove()
        select(flo)
        snip()
        return;
      }
      if(key==='Backspace')
      { if(sel.anchorOffset===1&&sel.focusOffset===1)
        { //Keep cursor one blank from left
          keyDown.preventDefault()
          return;
        }
        return;
      }//key==='Delete'
      if(sel.focusOffset >= (editText.length-1))
      { keyDown.preventDefault()
      }
    }
    return;
  }
  /*Selection mode responses: selNode !== editNode, which is detached*/
  keyDown.preventDefault()
  if(!selNode||selNode===infoNest)return;
  const nodeTag=selNode.tagName
  if(!nodeTag==='H5'||!nodeTag==='DIV')return;
  /*selNode is now either a scope, or a flow*/
  if(key==='Enter')
  { if(nodeTag==='DIV')
    { reFlowSelNest()
      return;
    }
    if(nodeTag==='H5')
    { unFlo(selNode)
      msg.displayArgStack()
    }
    return;
  }
  if(key==='Backspace'||key==='Delete')
  { snip(selNode)
    return;
  }
  if(selNode===oNest)return;
  /*selNode is now an inner scope, or a flow */
  if(key==='ArrowLeft'||key==='ArrowRight')
  { let newNestOrFlo
    if(!keyDown.metaKey)
    { newNestOrFlo=(keyDown.shiftKey)? makeNest(): makeFlo()
      if(key==='ArrowLeft')
      { selNode.before(newNestOrFlo)
        enterEditNode()
        return;
      }
      /*now ArrowRight*/
      selNode.after(newNestOrFlo)
      enterEditNode()
      return;
    } /*metaKey--paste clip before or after selNode*/
    newNestOrFlo=nodeClip.cloneNode(true)
    if(key==='ArrowLeft')
    { selNode.before(newNestOrFlo)
      select(selNode.parentElement)
      reFlowSelNest()
      return;
    }
    /*now ArrowRight*/
    selNode.after(newNestOrFlo)
    select(selNode.parentElement)
    reFlowSelNest()
    return;
  }
  if(keyDown.metaKey)
  { if(key==='x') //cut
    { nodeClip=selNode
      snip()
      nodeClip.removeAttribute('sel')
      return;
    }
    if(key==='c') //copy
    { nodeClip=selNode.cloneNode(true)
      nodeClip.removeAttribute('sel')
      return;
    }
  }
  if(nodeTag==='H5'&&key===' ')/*"advance" key*/
  { let thisFlow=selNode,
      nextFlow=thisFlow.nextElementSibling;
    if(thisFlow.hasAttribute('skif=1'))
    { nextFlow=nextFlow.nextElementSibling
    }
    while(!nextFlow)/*bottom of a nest*/
    { thisFlow=thisFlow.parentElement
      if(thisFlow===oNest)return;
      nextFlow=thisFlow.nextElementSibling
    }
    if(nextFlow.tagName==='DIV')
    { /*top of a nest*/
      nextFlow=nextFlow.firstElementChild
      while(nextFlow.tagName!=='H5')
      { nextFlow=nextFlow.nextElementSibling
      }
    }/*nextFlow.tagName==='H5'*/
    select(nextFlow)
    unFlo(selNode)
    msg.displayArgStack()
    return;
  }
}
/*initialize*/
document.addEventListener('selectstart',grabSelectStart,true)
document.addEventListener('keydown',grabKeyDown,true)
conLog('select.js installed')
export{select,unFlo}
