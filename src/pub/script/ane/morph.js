/**
 * 衍生于 morphdom
 * 
 * - 不同类型节点对应的节点序号： window.Node.XXXXX
 */
import {bindRef, playEffect} from './hook.js';

const doc = typeof document === "undefined" ? undefined : document;
// const HAS_TEMPLATE_SUPPORT = !!doc && "content" in doc.createElement("template");
// const HAS_RANGE_SUPPORT = !!doc && doc.createRange && "createContextualFragment" in doc.createRange();

// 可复用 Range 实例
let range;

// 向 fromNode 上更新 toNode 的属性
function morphAttrs(fromNode, toNode) {
  var toNodeAttrs = toNode.attributes;
  var attr;
  var attrName;
  var attrNamespaceURI;
  var attrValue;
  var fromValue;

  // document fragment 节点没有属性
  if (toNode.nodeType === 11 || fromNode.nodeType === 11) {
    return;
  }

  // 逐个比对 toNode 和 fromNode 的属性，不同则更新 toNode
  for (var i = toNodeAttrs.length - 1; i >= 0; i--) {
    attr = toNodeAttrs[i];
    attrName = attr.name;
    attrNamespaceURI = attr.namespaceURI;
    attrValue = attr.value;

    if (attrNamespaceURI) {
      attrName = attr.localName || attrName;
      fromValue = fromNode.getAttributeNS(attrNamespaceURI, attrName);

      if (fromValue !== attrValue) {
        if (attr.prefix === "xmlns") {
          attrName = attr.name; // It's not allowed to set an attribute with the XMLNS namespace without specifying the `xmlns` prefix
        }
        fromNode.setAttributeNS(attrNamespaceURI, attrName, attrValue);
      }
    } else {
      fromValue = fromNode.getAttribute(attrName);

      if (fromValue !== attrValue) {
        fromNode.setAttribute(attrName, attrValue);
      }
    }
  }

  // Remove any extra attributes found on the original DOM element that
  // weren't found on the target element.
  var fromNodeAttrs = fromNode.attributes;

  for (var d = fromNodeAttrs.length - 1; d >= 0; d--) {
    attr = fromNodeAttrs[d];
    attrName = attr.name;
    attrNamespaceURI = attr.namespaceURI;

    if (attrNamespaceURI) {
      attrName = attr.localName || attrName;

      if (!toNode.hasAttributeNS(attrNamespaceURI, attrName)) {
        fromNode.removeAttributeNS(attrNamespaceURI, attrName);
      }
    } else {
      if (!toNode.hasAttribute(attrName)) {
        fromNode.removeAttribute(attrName);
      }
    }
  }
}


// 同步 toEl 的 Boolean 型特性到 fromEl 上
function syncBooleanAttrProp(fromEl, toEl, name) {
  if (fromEl[name] !== toEl[name]) {
    fromEl[name] = toEl[name];
    if (fromEl[name]) {
      fromEl.setAttribute(name, "");
    } else {
      fromEl.removeAttribute(name);
    }
  }
}

const specialElHandlers = {
  OPTION: function (fromEl, toEl) {
    var parentNode = fromEl.parentNode;
    if (parentNode) {
      var parentName = parentNode.nodeName.toUpperCase();
      if (parentName === "OPTGROUP") {
        parentNode = parentNode.parentNode;
        parentName = parentNode && parentNode.nodeName.toUpperCase();
      }
      if (parentName === "SELECT" && !parentNode.hasAttribute("multiple")) {
        if (fromEl.hasAttribute("selected") && !toEl.selected) {
          // Workaround for MS Edge bug where the 'selected' attribute can only be
          // removed if set to a non-empty value:
          // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/12087679/
          fromEl.setAttribute("selected", "selected");
          fromEl.removeAttribute("selected");
        }
        // We have to reset select element's selectedIndex to -1, otherwise setting
        // fromEl.selected using the syncBooleanAttrProp below has no effect.
        // The correct selectedIndex will be set in the SELECT special handler below.
        parentNode.selectedIndex = -1;
      }
    }
    syncBooleanAttrProp(fromEl, toEl, "selected");
  },
  /**
   * The "value" attribute is special for the <input> element since it sets
   * the initial value. Changing the "value" attribute without changing the
   * "value" property will have no effect since it is only used to the set the
   * initial value.  Similar for the "checked" attribute, and "disabled".
   */
  INPUT: function (fromEl, toEl) {
    syncBooleanAttrProp(fromEl, toEl, "checked");
    syncBooleanAttrProp(fromEl, toEl, "disabled");

    if (fromEl.value !== toEl.value) {
      fromEl.value = toEl.value;
    }

    if (!toEl.hasAttribute("value")) {
      fromEl.removeAttribute("value");
    }
  },
  TEXTAREA: function (fromEl, toEl) {
    var newValue = toEl.value;
    if (fromEl.value !== newValue) {
      fromEl.value = newValue;
    }

    var firstChild = fromEl.firstChild;
    if (firstChild) {
      // Needed for IE. Apparently IE sets the placeholder as the
      // node value and vise versa. This ignores an empty update.
      var oldValue = firstChild.nodeValue;

      if (
        oldValue == newValue ||
        (!newValue && oldValue == fromEl.placeholder)
      ) {
        return;
      }

      firstChild.nodeValue = newValue;
    }
  },
  SELECT: function (fromEl, toEl) {
    if (!toEl.hasAttribute("multiple")) {
      var selectedIndex = -1;
      var i = 0;
      // We have to loop through children of fromEl, not toEl since nodes can be moved
      // from toEl to fromEl directly when morphing.
      // At the time this special handler is invoked, all children have already been morphed
      // and appended to / removed from fromEl, so using fromEl here is safe and correct.
      var curChild = fromEl.firstChild;
      var optgroup;
      var nodeName;
      while (curChild) {
        nodeName = curChild.nodeName && curChild.nodeName.toUpperCase();
        if (nodeName === "OPTGROUP") {
          optgroup = curChild;
          curChild = optgroup.firstChild;
        } else {
          if (nodeName === "OPTION") {
            if (curChild.hasAttribute("selected")) {
              selectedIndex = i;
              break;
            }
            i++;
          }
          curChild = curChild.nextSibling;
          if (!curChild && optgroup) {
            curChild = optgroup.nextSibling;
            optgroup = null;
          }
        }
      }

      fromEl.selectedIndex = selectedIndex;
    }
  },
  ARTICLE: function (fromEl, toEl) {
    // 不做更新操作，保持旧 article 标签下的所有内容
    // fromEl;
    // toEl;
  }
};

// 比对两个节点的 nodeName 相同返回 true
function compareNodeNames(fromEl, toEl) {
  var fromNodeName = fromEl.nodeName;
  var toNodeName = toEl.nodeName;

  if (fromNodeName === toNodeName) {
    return true;
  }

  const fromCodeStart = fromNodeName.charCodeAt(0);
  const toCodeStart = toNodeName.charCodeAt(0);

  // If the target element is a virtual DOM node or SVG node then we may
  // need to normalize the tag name before comparing. Normal HTML elements that are
  // in the "http://www.w3.org/1999/xhtml"
  // are converted to upper case
  if (fromCodeStart <= 90 && toCodeStart >= 97) {
    // from is upper and to is lower
    return fromNodeName === toNodeName.toUpperCase();
  } else if (toCodeStart <= 90 && fromCodeStart >= 97) {
    // to is upper and from is lower
    return toNodeName === fromNodeName.toUpperCase();
  } else {
    return false;
  }
}

// 将 fromEl 中的子节点逐个转移到 toEl 下，并返回 toEl
export function moveChildren(fromEl, toEl) {
  var curChild = fromEl.firstChild;
  while (curChild) {
    var nextChild = curChild.nextSibling;
    toEl.appendChild(curChild);
    curChild = nextChild;
  }
  return toEl;
}

function noop() {}

function defaultGetNodeKey(node) {
  if (!node) {return ;}
  return (node.getAttribute && node.getAttribute("id")) || node.id;
}

// 修改 fromNode 以和 toNode 保持一致
export default function morphdom(fromNode, toNode, options = {}) {
  // 预处理 toNode
  const str = toNode.trim();
  if (typeof document !== 'undefined' && "content" in document.createElement("template")) {
    // IE 中不支持 template 标签
    const template = doc.createElement("template");
    template.innerHTML = str;
    toNode = template.content.childNodes[0];
  } else if (typeof document !== 'undefined' && document.createRange && "createContextualFragment" in document.createRange()) {
    // createContextualFragment 不支持 `<tr><th>Hi</th></tr>` 等内容
    if (!range) {
      range = doc.createRange();
      range.selectNode(doc.body);
    }
    const fragment = range.createContextualFragment(str);
    toNode = fragment.childNodes[0];
  } else {
    var fragment = doc.createElement("body");
    fragment.innerHTML = str;
    toNode = fragment.childNodes[0];
  }

  // 选项解析
  var getNodeKey = options.getNodeKey || defaultGetNodeKey;
  var onBeforeNodeAdded = options.onBeforeNodeAdded || noop;
  // var onNodeAdded = options.onNodeAdded || noop;
  const onNodeAdded = function(node) {
    const ref = node.getAttribute && node.getAttribute('ref');
    if (ref) {
      bindRef(ref, node);
    }
  }
  var onBeforeElUpdated = options.onBeforeElUpdated || noop;
  // var onElUpdated = options.onElUpdated || noop;
  const onElUpdated = function(node) {
    const ref = node.getAttribute && node.getAttribute('ref');
    if (ref) {
      bindRef(ref, node);
    }
  }
  var onBeforeNodeDiscarded = options.onBeforeNodeDiscarded || noop;
  var onNodeDiscarded = options.onNodeDiscarded || noop;
  var onBeforeElChildrenUpdated = options.onBeforeElChildrenUpdated || noop;
  var childrenOnly = options.childrenOnly === true;

  // 用于快速定位 fromNode 中所有被 key 标记的原件
  var fromNodesLookup = Object.create(null);
  // 记录需要移除的有 key 标记的节点
  var keyedRemovalList = [];

  // 触发索引建立
  indexTree(fromNode);

  let morphedNode = fromNode;
  let morphedNodeType = morphedNode.nodeType;
  let toNodeType = toNode.nodeType;

  // 操作根节点
  if (!childrenOnly) {
    if (morphedNodeType === 1) {
      if (toNodeType === 1) {
        // 相同不做更新，不同则新建节点替换
        if (!compareNodeNames(fromNode, toNode)) {
          onNodeDiscarded(fromNode);
          const {nodeName, namespaceURI} = toNode;
          const toNodeNew = !namespaceURI || namespaceURI === 'http://www.w3.org/1999/xhtml'
            ? doc.createElement(nodeName)
            : doc.createElementNS(namespaceURI, nodeName)
          morphedNode = moveChildren(fromNode, toNodeNew);
        }
      } else {
        // toNode 非元件节点，如 文本节点 直接替换
        morphedNode = toNode;
      }
    } else if (morphedNodeType === 3 || morphedNodeType === 8) {
      // 文本或注释节点
      if (toNodeType === morphedNodeType) {
        // 转换为同类型节点，直接替换 nodeValue 内容
        if (morphedNode.nodeValue !== toNode.nodeValue) {
          morphedNode.nodeValue = toNode.nodeValue;
        }
        // 没必要在深入比较，提前返回
        return morphedNode;
      } else {
        // 转换为不同类节点，直接替换
        morphedNode = toNode;
      }
    }
  }

  if (morphedNode === toNode) {
    // morphedNode 被前述过程直接替换为了 toNode
    onNodeDiscarded(fromNode);
  } else {
    // 递归入口，更新 morphedNode 以和 toNode 保持一致
    morphEl(morphedNode, toNode, childrenOnly);
    // 逐个移除被 key 标记的节点
    if (keyedRemovalList) {
      for (var i = 0, len = keyedRemovalList.length; i < len; i++) {
        const elToRemove = fromNodesLookup[keyedRemovalList[i]];
        elToRemove && removeNode(elToRemove, elToRemove.parentNode, false);
      }
    }
  }

  // 之前过程 morphedNode 由 fromNode 变为 toNode
  // 则需要在所属文档中用 toNode 代替 fromNode
  if (!childrenOnly && morphedNode !== fromNode && fromNode.parentNode) {
    if (morphedNode.actualize) {
      morphedNode = morphedNode.actualize(fromNode.ownerDocument || doc);
    }
    fromNode.parentNode.replaceChild(morphedNode, fromNode);
  }

  // 所有渲染更新完成，执行所有 effect 钩子
  playEffect();

  // 返回新的节点
  return morphedNode;

  // 记录一个 key 
  function addKeyedRemoval(key) {
    keyedRemovalList.push(key);
  }

  // 遍历废弃的子节点
  function walkDiscardedChildNodes(node, skipKeyedNodes) {
    if (node.nodeType !== 1) {return ;}
    let curChild = node.firstChild;
    while (curChild) {
      let key = undefined;

      if (skipKeyedNodes && (key = getNodeKey(curChild))) {
        addKeyedRemoval(key);
      } else {
        // Only report the node as discarded if it is not keyed. We do this because
        // at the end we loop through all keyed elements that were unmatched
        // and then discard them in one final pass.
        onNodeDiscarded(curChild);
        if (curChild.firstChild) {
          walkDiscardedChildNodes(curChild, skipKeyedNodes);
        }
      }

      curChild = curChild.nextSibling;
    }
  }

  // 从 fromNode 中移除一个节点
  function removeNode(node, parentNode, skipKeyedNodes) {
    if (onBeforeNodeDiscarded(node) === false) {
      return;
    }

    if (parentNode) {
      parentNode.removeChild(node);
    }

    onNodeDiscarded(node);
    walkDiscardedChildNodes(node, skipKeyedNodes);
  }

  // 递归遍历一个节点树，索引其中被 key 标记的所有节点
  // 遍历也可以使用原生接口 document.createTreeWalker 和 document.createNodeIterator
  // 但是二者并没有比 JS 实现的递归更快
  function indexTree(node) {
    if (node.nodeType === 1 || node.nodeType === 11) {
      var curChild = node.firstChild;
      while (curChild) {
        var key = getNodeKey(curChild);
        if (key) {
          fromNodesLookup[key] = curChild;
        }

        // 递归
        indexTree(curChild);

        curChild = curChild.nextSibling;
      }
    }
  }

  // 处理新增的节点
  function handleNodeAdded(el) {
    onNodeAdded(el);

    var curChild = el.firstChild;
    while (curChild) {
      var nextSibling = curChild.nextSibling;

      var key = getNodeKey(curChild);
      if (key) {
        var unmatchedFromEl = fromNodesLookup[key];
        // if we find a duplicate #id node in cache, replace `el` with cache value
        // and morph it to the child node.
        if (unmatchedFromEl && compareNodeNames(curChild, unmatchedFromEl)) {
          curChild.parentNode.replaceChild(unmatchedFromEl, curChild);
          morphEl(unmatchedFromEl, curChild);
        } else {
          handleNodeAdded(curChild);
        }
      } else {
        // recursively call for curChild and it's children to see if we find something in
        // fromNodesLookup
        handleNodeAdded(curChild);
      }

      curChild = nextSibling;
    }
  }

  // 清空 fromEl
  function cleanupFromEl(fromEl, curFromNodeChild, curFromNodeKey) {
    // We have processed all of the "to nodes". If curFromNodeChild is
    // non-null then we still have some from nodes left over that need
    // to be removed
    while (curFromNodeChild) {
      var fromNextSibling = curFromNodeChild.nextSibling;
      if ((curFromNodeKey = getNodeKey(curFromNodeChild))) {
        // Since the node is keyed it might be matched up later so we defer
        // the actual removal to later
        addKeyedRemoval(curFromNodeKey);
      } else {
        // NOTE: we skip nested keyed nodes from being removed since there is
        //       still a chance they will be matched up later
        removeNode(curFromNodeChild, fromEl, true /* skip keyed nodes */);
      }
      curFromNodeChild = fromNextSibling;
    }
  }

  // 更新匹配成功的 toEl 到 fromEl
  function morphEl(fromEl, toEl, childrenOnly) {
    const toElKey = getNodeKey(toEl);

    if (toElKey) {
      // If an element with an ID is being morphed then it will be in the final
      // DOM so clear it out of the saved elements collection
      delete fromNodesLookup[toElKey];
    }

    // 更新当前旧节点的属性，并触发相关回调
    if (!childrenOnly) {
      if (onBeforeElUpdated(fromEl, toEl) === false) {
        return;
      }

      // 将 toEl 的属性更新到 fromEl 上
      morphAttrs(fromEl, toEl);

      onElUpdated(fromEl);

      if (onBeforeElChildrenUpdated(fromEl, toEl) === false) {
        return;
      }
    }

    // /post 列表页，不比对和更新
    if (fromEl.id === 'posts') {
      return ;
    }
    
    const specialElHandler = specialElHandlers[fromEl.nodeName];
    if (!specialElHandler) {
      morphChildren(fromEl, toEl);
    } else {
      specialElHandler(fromEl, toEl);
    }
  }

  // 更新 toEl 到 fromEl 中
  // 使用递归，深度优先遍历 DOM 树，每层匹配到的节点按新顺序复用，没有匹配到的后置
  // 最后统一插入新未匹配节点移除旧未匹配节点
  function morphChildren(fromEl, toEl) {
    let curToNodeChild = toEl.firstChild;
    let curFromNodeChild = fromEl.firstChild;
    let curToNodeKey;
    let curFromNodeKey;

    let fromNextSibling;
    let toNextSibling;
    let matchingFromEl;

    // 遍历子节点
    outer: while (curToNodeChild) {
      toNextSibling = curToNodeChild.nextSibling;
      curToNodeKey = getNodeKey(curToNodeChild);

      // 遍历 fromNode 的子节点，逐个和 toNode 对应节点进行比对
      while (curFromNodeChild) {
        fromNextSibling = curFromNodeChild.nextSibling;

        if (
          curToNodeChild.isSameNode &&
          curToNodeChild.isSameNode(curFromNodeChild)
        ) {
          curToNodeChild = toNextSibling;
          curFromNodeChild = fromNextSibling;
          continue outer;
        }

        curFromNodeKey = getNodeKey(curFromNodeChild);

        const curFromNodeType = curFromNodeChild.nodeType;

        // this means if the curFromNodeChild doesnt have a match with the curToNodeChild
        var isCompatible = undefined;

        if (curFromNodeType === curToNodeChild.nodeType) {
          if (curFromNodeType === 1) {
            // 两者都是 Element 类型节点
            if (curToNodeKey) {
              // 检查两者的 key 是否相同，以区分操作
              if (curToNodeKey !== curFromNodeKey) {
                // 同一个位置的两个节点 key 不同，查找 key 对应的元件
                if ((matchingFromEl = fromNodesLookup[curToNodeKey])) {
                  if (fromNextSibling === matchingFromEl) {
                    // 特殊情况，单独某个节点被删除，为了避免打断 CSS 过度等，抛弃当前节点，等待下一个循环实现匹配
                    isCompatible = false;
                  } else {
                    // 发现一个匹配 key 的节点，把它移动到当前位置，并和当前目标节点进行比对
                    fromEl.insertBefore(matchingFromEl, curFromNodeChild);

                    // fromNextSibling = curFromNodeChild.nextSibling;

                    if (curFromNodeKey) {
                      // 带有 key 的现节点，暂时放置在移除队列中，后续匹配到后可能会恢复
                      addKeyedRemoval(curFromNodeKey);
                    } else {
                      // 不带 key 的现节点，直接从 DOM 树中移除，跳过带 key 的节点的移除
                      removeNode(curFromNodeChild, fromEl, true /* skip keyed nodes */);
                    }

                    curFromNodeChild = matchingFromEl;
                  }
                } else {
                  // 目标节点含有一个 key 而当前所有节点都不匹配 key
                  isCompatible = false;
                }
              }
            } else if (curFromNodeKey) {
              // The original has a key
              isCompatible = false;
            }

            // 进一步比对节点名，以保障节点不需要替换，只需要更新
            isCompatible = isCompatible !== false && compareNodeNames(curFromNodeChild, curToNodeChild);

            // 新旧节点完美匹配，只需要更新属性和递归子节点，不需要替换节点
            if (isCompatible) {
              morphEl(curFromNodeChild, curToNodeChild);
            }
          } else if (curFromNodeType === 3 || curFromNodeType == 8) {
            // 新旧节点都是 Text 节点 或 都是 Comment 节点，只需要更新文本内容属性，不需要替换
            isCompatible = true;
            if (curFromNodeChild.nodeValue !== curToNodeChild.nodeValue) {
              curFromNodeChild.nodeValue = curToNodeChild.nodeValue;
            }
          }
        }

        // 新旧节点匹配成功，上述过程完成递归，不需要做后续的替换操作，直接进入下一个循环
        if (isCompatible) {
          curToNodeChild = toNextSibling;
          curFromNodeChild = fromNextSibling;
          continue outer;
        }

        // 新旧节点匹配失败，移除旧节点，游标移动到下一个节点，并重新执行匹配
        if (curFromNodeKey) {
          addKeyedRemoval(curFromNodeKey);
        } else {
          removeNode(curFromNodeChild, fromEl, true);
        }
        curFromNodeChild = fromNextSibling;
      }

      if (
        curToNodeKey &&
        (matchingFromEl = fromNodesLookup[curToNodeKey]) &&
        compareNodeNames(matchingFromEl, curToNodeChild)
      ) {
        // 如果新节点含有 key 并找到匹配的旧节点，将对应节点附加到所有节点之后
        fromEl.appendChild(matchingFromEl);
        // 更新属性和递归子节点
        morphEl(matchingFromEl, curToNodeChild);
      } else {
        // 新节点没有匹配的旧节点，新建节点并附加到所有节点之后
        const onBeforeNodeAddedResult = onBeforeNodeAdded(curToNodeChild);
        if (onBeforeNodeAddedResult !== false) {
          if (onBeforeNodeAddedResult) {
            curToNodeChild = onBeforeNodeAddedResult;
          }
          if (curToNodeChild.actualize) {
            curToNodeChild = curToNodeChild.actualize(
              fromEl.ownerDocument || doc
            );
          }
          fromEl.appendChild(curToNodeChild);
          handleNodeAdded(curToNodeChild);
        }
      }

      // 遍历到下一个节点
      curToNodeChild = toNextSibling;
      curFromNodeChild = fromNextSibling;
    }

    // 清理最后没有匹配的所有旧节点
    cleanupFromEl(fromEl, curFromNodeChild, curFromNodeKey);

    // 特殊操作
    const specialElHandler = specialElHandlers[fromEl.nodeName];
    specialElHandler && specialElHandler(fromEl, toEl);
  }
}
