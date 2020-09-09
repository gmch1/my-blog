### 面试官：请不要问我虚拟dom

#### 虚拟dom的引入

在前文中已经有提到，vue2.0中引入虚拟dom本质上是为了提升响应式的颗粒度，原本细颗粒度导致dom节点被直接进行依赖收集，导致内存开销较大，所以引入虚拟dom用来提升颗粒度，将颗粒度提升到组件级别，再由组件内部进行diff算法。

#### 虚拟dom的类型

虚拟dom节点的类型一共有如下几种：

- 注释节点
- 文本节点
- 克隆节点
- 元素节点
- 组件节点
- 函数式组件

下面开始逐个进行介绍

1. 注释节点

   - 注释节点本身有两个属性：

     ```js
     isComment：true; 用于标记节点类型
     text：string|void;
     ```

2. 文本节点

   - 文本节点较之注释节点，没有isComment属性：

     ```js
     text: string|void;
     ```

3. 克隆节点

   - 克隆节点是将原先的静态节点内容进行克隆，克隆完成后存在一个isCloned的标志位。

   - 克隆节点的作用是优化静态节点和插槽节点。

   - 以静态节点为例，静态节点仅在首次更新时创建，后续由于自身不会发生改变，所以不需要再执行渲染函数，获取虚拟dom，所以可以使用克隆节点的方式，使用克隆的节点进行渲染。

   - 克隆节点本身就是将原先节点复制一份，函数源码如下：

     ```js
     export function cloneVNode (vnode: VNode): VNode {
       const cloned = new VNode(
         vnode.tag,
         vnode.data,
         vnode.children,
         vnode.text,
         vnode.elm,
         vnode.context,
         vnode.componentOptions
       )
       cloned.ns = vnode.ns
       cloned.isStatic = vnode.isStatic
       cloned.key = vnode.key
       cloned.isCloned = true // 标志位
       return cloned
     }
     ```

4. 元素节点

   - 顾名思义，就是HTML的元素

   - 元素节点具有四种属性：

     ```js
     {
         children:vdom // 内部dom节点
         tag:'h1|p|div' // 标签
         data:'class|style' // class类名，节点样式
         context:'vm' // vue实例
     }
     ```

5. 组件节点

   - 即vue的组件

   - 组件节点具有两种特有属性：

     ```js
     {
       componentOptions: VNodeComponentOptions | void; // 组件节点的选项参数，包括children、tag、propsData
       componentInstance: Component | void; // component instance 组件的实例，每一个组件都是一个vue.js实例
     }
     ```

6. 函数式组件

   - 与组件节点类似

   - 具有一个特有属性 （vue2.6版本源码，之前还有一个functionalOptions）

     ```js
     {
         functionalContext: Component | void; // only for functional component root nodes
     }
     ```

vnode本身是一个类，通过传递不同的参数从而实例化出不同的node节点，当视图需要更新时，通过将新生成的视图和之前缓存的oldnode节点进行对比，就可以知道哪一部分需要被更新，针对性的更新，从而提升整体的性能。



#### patch方法

patch即vue中用于虚拟dom更新的方法，这部分也就涉及到面试中的重点，diff算法，下面开始由浅入深逐渐梳理这部分的结构。

##### patch方法介绍

patch方法原理就是将新旧vdom进行对比，找出不同，从而选择性更新这些不同的部分，从而实现dom结构的高效复用。实际上完全不适用diff算法也可以，直接将vdom替换原先oldvdom也是一种解决办法，但是不够高效。

patch方法核心流程有以下三个部分：

- 创建节点
- 删除节点
- 更新节点

##### 创建节点

当新生成的vdom和原先的oldVdom进行比较，发现新生成的vdom中的某个节点，再原先oldVdom中找不到对应节点时，就会创建新的node节点

##### 删除节点

新生成的vdom中不存在原先oldVdom中某个节点，就会执行删除的逻辑，移除原先vdom中的节点

##### 更新节点

新生成的vdom中某个节点和原先oldVdom中某个节点可以对应上，类型、key值均相同，则走到更新节点的逻辑，对节点内数据进行更新，节点保留。

##### patch方法的整体流程

由先前的讨论出发，我们可以得到patch的整体流程：

- 判断当前有没有oldVdom，首次渲染是没有oldVdom的，也就没有对比比较的过程，直接采用vdom渲染视图。
- 当oldVnode和vnode都存在时，判断二者是不是同一个节点，如果不是，使用vnode创建的真实dom替换原先的dom元素。
- 当oldVnode和Vnode是同一个节点时，进行更详细的比较，然后更新真实dom上的属性。



#### patch中成员方法介绍

patch方法执行流程先前已经讲过，现在开始详细分析一下patch方法中成员方法的执行流程。

##### 创建节点

创建节点部分内容实际上很简单，在vue.js中，只有三种节点会被插入到真实dom中，分别为注释节点、文本节点和元素节点，它们的特性我在先前有提到，没有印象的建议翻到第一部分仔细阅读以下。

###### 元素节点

元素节点本身含义就是HTML元素，在元素节点上有一个**tag**属性，用来标志它是哪种类型的节点，同时也有一个children属性，用来保存它的子节点。浏览器中插入元素直接调用parentNode.appendChild即可完成，至于它的子节点，循环children列表，进行递归调用即可。先生成dom节点，循环调用appendChild子节点，再将整体的节点插入到真实dom部分即可。

源码实现：

```js
// 此处为源码片段截取
vnode.elm = vnode.ns
    ? nodeOps.createElementNS(vnode.ns, tag)
: nodeOps.createElement(tag, vnode)
setScope(vnode)
if(weex){
    // 非web环境，不做讨论
}else {
    createChildren(vnode, children, insertedVnodeQueue)
    if (isDef(data)) {
        invokeCreateHooks(vnode, insertedVnodeQueue)
    }
    insert(parentElm, vnode.elm, refElm)
	}

    if (process.env.NODE_ENV !== 'production' && data && data.pre) {
        inPre--
    }
}
```

###### 注释节点

注释节点本身含义就是html中的注释，只不过是将vue模板中的注释渲染到真实dom中而已，注释节点的特征：isComment:true，通过判断这一点即可知道节点是不是注释节点，之后调用document.createComment即可创建。

源码实现：

```js
  // 此处为源码片段截取
  } else if (isTrue(vnode.isComment)) {
      vnode.elm = nodeOps.createComment(vnode.text)
      insert(parentElm, vnode.elm, refElm)
  }
```

###### 文本节点

文本节点含义就是html中的文本，它的特征：存在text属性，并且isComment:false，通过调用document.createTextNode即可完成创建。

源码实现：

```js
// 此处为截取的一部分
else {
      vnode.elm = nodeOps.createTextNode(vnode.text)
      insert(parentElm, vnode.elm, refElm)
    }

```

###### insert方法实现

```js
  function insert (parent, elm, ref) {
    if (isDef(parent)) {
      if (isDef(ref)) {
        if (ref.parentNode === parent) {
          nodeOps.insertBefore(parent, elm, ref)
        }
      } else {
        nodeOps.appendChild(parent, elm)
      }
    }
  }
```

###### isDef方法实现

```js
export function isDef (v: any): boolean %checks {
  return v !== undefined && v !== null
}
```

###### 创建节点的全流程：

- vnode是元素节点，如果是，则创建元素节点
- vnode是注释节点，如果是，则创建注释节点
- vnode是文本节点，如果是，则创建文本节点
- 插入到指定父节点中

##### 删除节点

可以看到，移除源码函数实现中，接受四个参数，父节点、vnode数组，起始下标和结束下标，在起始下标和结束下标下进行循环，遍历每一项。如果当前项是文本节点，则直接删除，如果是元素节点，先移除元素，再调用销毁的钩子函数。

###### removeVnodes源码实现：

```js
function removeVnodes (parentElm, vnodes, startIdx, endIdx) {
    for (; startIdx <= endIdx; ++startIdx) {
        const ch = vnodes[startIdx]
        if (isDef(ch)) {
            if (isDef(ch.tag)) {
                /*存在tag时*/
                /*移除节点并调用remove钩子*/
                removeAndInvokeRemoveHook(ch)
                /*调用destroy钩子*/
                invokeDestroyHook(ch)
            } else { // Text node
                /*不存在代表是一个text节点，直接移除*/
                removeNode(ch.elm)
            }
        }
    }
}
```

###### removeAndInvokeRemoveHook源码实现：

复杂的判断逻辑直接无视，跳到最后一行，可以看到核心是调用了removeNode这个钩子函数

```js
function removeAndInvokeRemoveHook (vnode, rm) {
    if (isDef(rm) || isDef(vnode.data)) {
      let i
      const listeners = cbs.remove.length + 1
      if (isDef(rm)) {
        // we have a recursively passed down rm callback
        // increase the listeners count
        rm.listeners += listeners
      } else {
        // directly removing
        rm = createRmCb(vnode.elm, listeners)
      }
      // recursively invoke hooks on child component root node
      if (isDef(i = vnode.componentInstance) && isDef(i = i._vnode) && isDef(i.data)) {
        removeAndInvokeRemoveHook(i, rm)
      }
      for (i = 0; i < cbs.remove.length; ++i) {
        cbs.remove[i](vnode, rm)
      }
      if (isDef(i = vnode.data.hook) && isDef(i = i.remove)) {
        i(vnode, rm)
      } else {
        rm()
      }
    } else {
      removeNode(vnode.elm)
    }
  }
```

###### removeVnode函数源码实现：

这个函数思路就很清晰，获取parent节点，然后判断非空，直接调用removeChild函数，删除对应的子节点。

```js
/*将某个el节点从文档中移除*/
function removeNode (el) {
    const parent = nodeOps.parentNode(el)
    // element may have already been removed due to v-html / v-text
    if (isDef(parent)) {
        nodeOps.removeChild(parent, el)
    }
}
```

为什么这块简单的逻辑要做这么复杂的实现？

原因在于，vue本身是一个跨端的JavaScript框架，不仅仅在浏览器端做适配，wexx、小程序上提供的接口、能力、拓展也有所差异，所以需要在框架这一层抹平这些差异，以便实现更好的复用。

##### 更新节点

更新节点逻辑中，会判断节点类型进行不同的更新操作，主要有以下几种方式：

- 静态节点
- 新虚拟节点有文本属性
- 新虚拟节点无文本属性
  - 有children情况
  - 无children情况

###### 静态节点

静态节点，顾名思义即静态html，不涉及动态数据，所以更新逻辑中直接复用先前节点即可，不需要做额外的操作。

###### 新虚拟节点有文本属性

当新旧vnode不是静态节点，且属性有所差异时，要以新虚拟节点为准来更新视图，这里分为两种情况：有text属性和没有text属性。

当有text属性时，会判断当前text属性值和真实dom：node.textContent值是否一致，如果一致则不进行操作，不一致修改node.textContent值即可。

###### 静态节点没有文本属性

如果静态节点没有文本属性，那他就是一个元素节点，元素节点处理也分为两种情况：有children和没有children，下面分别进行单独讨论。

###### 元素节点有children

当vnode节点中有children，这里还需要针对oldVnode的情况进行分别处理：

oldVnode有children，那说明之前的节点也是一个元素节点，这里就需要进行深层次的递归比较，找不同

如果oldVnode没有children，那说明之前节点要么是个空节点，要么是个文本节点或者是注释节点，清除其中的内容，然后将新生成的dom结构插入即可。

###### 元素节点没有children

这种情况下vnode不是注释节点、也不是文本节点，那么他就是个空节点。

对原先oldVnode进行判断，清除其中内容，有什么删什么，直到删成一个空标签为止。



#### 更新子节点

这一步分可以说是全文的重头戏，主要涉及vue的diff算法比较过程。

请看下篇详解，diff算法更新子节点