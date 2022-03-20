// 获取元素的子元素节点
function elemChildren(node) {
  var temp = {
    length: 0,
    push: Array.prototype.push,
    splice: Array.prototype.splice,
  };
  var children = node.childNodes,
      len = children.length,
      item;

  for (var i = 0; i < len; i++) {
    item = children[i];
    // nodeType === 1 是元素节点，只返回元素节点
    if (item.nodeType === 1) {
      temp.push(item);
    }
  }
  return temp;
}

// 寻找元素第n层父节点
function elemParent(node, n) {
  var type = typeof n;

  if (type === 'undefined') {
    // 不传n，默认返回当前元素父节点
    return node.parentNode;
  } else if (n <= 0 || type !== 'number') {
    return undefined;
  }

  while (n) {
    node = node.parentNode;
    n--;
  }

  return node;
}


// 滚动条距离 
function getScrollOffset() {
  // IE8以上使用pageXOffset获取滚动条距离
  if (window.pageXOffset) {
    return {
      left: window.pageXOffset,
      top: window.pageYOffset,
    };
  } else {
    // IE8及以下获取滚动条距离，一定有一个值的value是0，所以相加一定能获取结果
    return {
      left: document.body.scrollLeft + document.documentElement.scrollLeft,
      top: document.body.scrollTop + document.documentElement.scrollTop,
    };
  }
}

// 文档宽高
function getScrollSize() {
  if (document.body.scrollHeight) {
    return {
      width: document.body.scrollWidth,
      height: document.body.scrollHeight,
    };
  } else {
    return {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    };
  }
}

/* 浏览器可视区域的尺寸
常规: window.innerHeight window.innerWidth 包括滚动条
IE8 / IE9及以下
标准: document.documentElement.clientWidth / clientHeight 不包括滚动条
怪异: document.body.clientWidth / clientHeight
封装可视区域(通过模式判断)
 */
function getViewportSize() {
  if (window.innerWidth) {
    // 常规判断浏览器可视尺寸
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  } else {
    if (document.comatMode === 'BackCompat') {
      // 怪异模式下浏览器的可视尺寸document.body.clientWidth
      return {
        width: document.body.clientWidth,
        height: document.body.clientHeight,
      };
    } else {
      // 标准模式下的浏览器可视尺寸
      return {
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight,
      };
    }
  }
}

// 找到元素相对于文档定位
function getElemDocPostion(el) {
  /*  offsetLeft / offsetTop 相对于有定位的元素父级来计算,
   直到找到有定位的父级, 如果找不到就是body 
   offsetParent 找有定位的父级, 返回节点元素, 如果没有, 就返回body*/
  var parent = el.offsetParent,
    offsetLeft = el.offsetLeft,
    offsetTop = el.offsetTop;
  while (parent) {
    /* 相对文档定位-> 元素相对父级元素位置 
                  + 父级元素相对父级元素位置 + ... */
    offsetLeft += parent.offsetLeft;
    offsetTop += parent.offsetTop;
    parent = parent.offsetParent;
  }
  return {
    left: offsetLeft,
    top: offsetTop,
  };
}
 

// 访问元素计算样式 （16进制颜色转化成rgb ，非px转化成px）
function getstyles(elem, prop) {
  // getComputedStyle 读取的样式是最终样式，包括了内联样式、嵌入样式和外部样式。
  if (window.getComputedStyle) {
    if (prop) {
      return window.getComputedStyle(elem, null)[prop];
    } else {
      return window.getComputedStyle(elem, null);
    }
  } else {
    // IE8及以下不支持getComputedStyle， 需要使用elem.currentStyle
    if (prop) {
      return elem.currentStyle[prop];
    } else {
      return elem.currentStyle;
    }
  }
}


// 事件绑定
function addEvent(el, type, fn) {
  if (el.addEventListener) {
    el.addEventListener(type, fn, false);
  } else if (el.attachEvent) {
    el.attachEvent('on' + type, function () {
      fn.call(el);
    });
  } else {
    // 句柄写法兼容最好
    el['on' + type] = fn;
  }
}

// 移除事件绑定
function removeEvent(el, type, fn) {
  if (el.addEventListener) {
    el.removeEventListener(type, fn, false);
  } else if (el.attachEvent) {
    el.detachEvent('on' + type, fn);
  } else {
    el['on' + type] = null;
  }
}

// 取消事件冒泡
function cancelBubble(e) {
  var e = e || window.event;
  if (e.stopPropagation) {
    // event.stopPropagation :阻止捕获和冒泡阶段中当前事件的进一步传播。IE8及以下不支持
    e.stopPropagation();
  } else {
    //IE8及以下使用cancelBubble
    e.cancelBubble = true;
  }
}


// 阻止事件默认行为
function preventDefaultEvent(e) {
  var e = e || window.event;
  // e.preventDefault IE9不兼容，IE9以下需要使用e.returnValue = false
  if (e.preventDefault) {
    e.preventDefault();
  } else {
    e.returnValue = false;
  }
}

/* 计算鼠标至文档的距离
(重写pageX),因为pageX的兼容性很差
使用滚动条高度+鼠标相对浏览器可视区域高度-浏览器的偏移量(margin) */
function pagePos(e) {
  var sLeft = getScrollOffset().left,
    sTop = getScrollOffset().top,
    // document.documentElement.clientLeft，在某些浏览器中可能有值(IE8),不过通常来说是undefined或0
    cLeft = document.documentElement.clientLeft || 0,
    cTop = document.documentElement.clientTop || 0;

  return {
    X: e.clientX + sLeft - cLeft,
    Y: e.clientY + sTop - cTop,
  };
}

// 元素拖拽
function elemDrag(elem) {
  var x, y;
  /*
   * getstyles(box, 'left'), getstyles(box, 'top') 是元素距离文档的距离
   * pagePos(e).X pagePos(e).Y 是鼠标距离文档的距离
   * x,y 是鼠标距离元素的距离
   * 这样可以保证拖拽的时候鼠标在选中元素时候的相对坐标不变
   */
  addEvent(elem, 'mousedown', function (e) {
    var e = e || window.event;
    x = pagePos(e).X - parseInt(getstyles(elem, 'left'));
    y = pagePos(e).Y - parseInt(getstyles(elem, 'top'));
    h = parseInt(getstyles(elem, 'height'));
    w = parseInt(getstyles(elem, 'width'));
    console.log(x, y, h, w);
    console.log(getViewportSize());

    // 这里使用document.onmousemove 和 document.onmouseup。因为在鼠标移动速度过快的时候会移出元素，当移出元素的时候, 事件就不在元素上了，函数也就不会继续执行
    addEvent(document, 'mousemove', mouseMove);
    // 鼠标抬起的时候,取消事件绑定
    addEvent(document, 'mouseup', mouseUp);
  });
  function mouseMove(e) {
    var e = e || window.event,
      eX = pagePos(e).X - x,
      eY = pagePos(e).Y - y;
    if (eX <= 0) {
      elem.style.left = '0px';
    } else if (eX >= getViewportSize().width - w) {
      elem.style.right = '0px';
    } else {
      elem.style.left = pagePos(e).X - x + 'px';
    }
    if (eY <= 0) {
      elem.style.top = '0px';
    } else if (eY >= getViewportSize().height - h) {
      elem.style.bottom = '0px';
    } else {
      elem.style.top = pagePos(e).Y - y + 'px';
    }
  }
  function mouseUp(e) {
    var e = e || window.event;
    removeEvent(document, 'mousemove', mouseMove);
    removeEvent(document, 'mouseup', mouseUp);
  }
}

// 判断点是否在一个三角形内，鼠标行为预测
function vec(a, b) {
  return {
    x: b.x - a.x,
    y: b.y - a.y,
  };
}
function vecProduct(v1, v2) {
  return v1.x * v2.y - v2.x * v1.y;
}
function sameSymbols(a, b) {
  return (a ^ b) >= 0;
}
function pointInTriangle(p, a, b, c) {
  var PA = vec(p, a),
    PB = vec(p, b),
    PC = vec(p, c),
    R1 = vecProduct(PA, PB),
    R2 = vecProduct(PB, PC),
    R3 = vecProduct(PC, PA);
  return sameSymbols(R1, R2) && sameSymbols(R2, R3);
}
