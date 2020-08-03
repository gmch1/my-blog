### CSS部分

#### 22.重绘、回流及其优化

1. ##### 渲染机制

   - 浏览器采用流式布局模型
   - 浏览器会把HTML解析成DOM，把CSS解析成CSSOM，DOM和CSSOM合并就产生了渲染树
   - 有了渲染树，我们就知道了所有节点的样式，然后计算它们再页面上的大小和位置，最后把节点会知道页面上。
   - 由于浏览器采用流式布局，对渲染树的计算通常只需要遍历一次就可以完成，**但table及其内部元素除外，它们可能需要多次计算，通常要花费3倍于同等元素的事件，这也是为什么要避免使用table布局的原因之一**。
   - **渲染流水线**![image](https://tva1.sinaimg.cn/large/005SSskyly1ghbew36q1mj30ie09hjs7.jpg)

2. ##### 重绘

   由于节点的非几何属性发生改变或者由于样式发生改变而不会影响布局的，称为重绘，例如outline、visibility、color、background-color等，重绘的代价是高昂的，因为浏览器必须验证DOM树上其他元素的可见性。

   重绘过程：

   ![image](https://tvax4.sinaimg.cn/large/005SSskyly1ghbevdvxsej30il03cweo.jpg)

   跳过了生成布局树和建立图层树的阶段，直接生成绘制列表，然后继续进行分块、生成位图等后面一系列的操作。

3. ##### 回流

   回流是布局属性或者几何属性需要改变。回流是影响浏览器性能的关键因素，因为其变化涉及到部分页面（或者是整个页面）的布局更新。一个元素回流可能会导致其所有子元素以及DOM中紧随其后的节点、祖先节点元素的随后回流。

   **需要注意**

   当我们访问元素的一些属性的时候，会导致浏览器强制清空队列，进行强制同步布局。


   下面这段代码，在每次循环的时候，都读取了box的一个offsetWidth属性值，然后利用它来更新p标签的width属性。这就导致了每一次循环的时候，浏览器都必须先使上一次循环中的样式更新操作生效,才能响应本次循环的样式读取操作。

   ```js
   //  这段代码在执行时，每次循环都会强制浏览器刷新队列
   function initP() {
       for (let i = 0; i < paragraphs.length; i++) {
           paragraphs[i].style.width = box.offsetWidth + 'px';
       }
   }
   // 修改后
   const width = box.offsetWidth;
   function initP() {
       for (let i = 0; i < paragraphs.length; i++) {
           paragraphs[i].style.width = width + 'px';
       }
   }
   ```

   会导致回流的操作：

   - 一个DOM元素的几何属性发生变化，常见的几何属性有width、height、padding、margin、left、top、border。
   - 使DOM节点发生增减或移动。
   - 读写offset、scroll、clinet族元素的时候，浏览器为了获取准确的值，会强制进行回流。
   - 调用window.getComputedStyle方法。

   回流过程：

   ![image](https://tvax4.sinaimg.cn/large/005SSskyly1ghbeum8vgsj30j506p3yx.jpg)

   **大部分的回流将导致页面的重新渲染，回流必定会发生重绘，重绘不一定会引发回流。**

4. ##### 合成

   还有一种情况：直接合成。比如利用CSS3的transform、opacity、filter这些属性就可以实现合成的效果，也就是常说的GPU加速。

   ###### GPU加速的原因

   在合成的情况下，会直接跳过布局和绘制流程，直接进入非主线程处理的部分，即直接交给合成线程处理。

   使用合成线程处理的好处：

   1. 能够充分发挥GPU的优势，合成线程生成位图的过程中会调用线程池，并在其中使用GPU加速进行加速生成，而GPU是最擅长处理位图数据的。
   2. 没有占用主线程的资源，即使主线程卡住了，效果依然能够流程展示。

5. ##### 浏览器优化

   现代浏览器大多数都是通过队列机制来批量更新布局，浏览器会把修改操作放在队列中，至少一个浏览器刷新（16.6ms）才会清空队列，但当你**获取布局信息的时候，队列中可能会有影响这些属性或方法返回值的操作，即使没有，浏览器也会强制清空队列，触发回流与重绘来确保返回正确的值**。

   主要包括以下的属性和方法：

   - `offsetTop`、`offsetLeft`、`offsetWidth`、`offsetHeight`

   - `scrollTop`、`scrollLeft`、`scrollWidth`、`scrollHeight`

   - `clientTop`、`clientLeft`、`clientWidth`、`clientHeight`

   - `width`、`height`

   - `getComputedStyle()`

   - `getBoundingClientRect()`

     所以，我们应该尽量比频繁的使用上述的属性，它们都会强制刷新渲染队列。

6. ##### 减少重绘与回流

   1. CSS
      - **使用transform代替top**
      - **使用visibility替换display:none**，前者只会引起重绘，而后者会导致回流
      - **避免使用table布局**，可能很小的一个改动都会造成整个table的重新布局
      - **尽可能在DOM树最末端改变class**，回流是不可避免的，但可以减小其范围。尽可能在DOM树最末端改变class，可以限制了回流的范围，使其影响尽可能少的节点。
      - **避免设置多层内联样式**，CSS选择符从右往左匹配查找，避免节点层次过多，造成额外的递归查找性能开销，保持HTML层级扁平
      - **将动画设置到position属性为absolute或fixed的元素上**，避免影响其他元素的布局，这样只是一个重绘，而不是回流，同时控制动画速度可以选择requestAnimationFrame
      - **避免使用CSS表达式**，可能会引发回流
      - **将频繁重绘或回流的节点设置为图层**，图层能阻止该节点的渲染行为影响别的节点，例如`will-change`、`video`、`iframe`等标签，浏览器会自动将该节点变为图层。
      - **CSS3硬件加速**，使用GPU加速，直接调用合成线程
   2. JavaScript
      - **避免频繁操作样式**，最好一次性重写style属性，或者将样式列表定义为class，并一次性更改class属性。
      - **避免频繁操作DOM**，创建一个documentFragment，在它上面应用所有的DOM操作，最后再把它添加到文档中。
      - **避免频繁读取会引发回流、重绘的属性**，如果确实需要多次使用，可以使用变量缓存起来。
      - 对具有复杂动画的元素使用绝对定位，使它脱离文档流，否则会引起父元素及后续元素频繁回流。



#### 39.BFC及其应用

1. ##### 常见布局方案

   在了解BFC之前，先来讲一下常见的定位方案，定位方案是控制元素的布局，有三种常见方案：

   - 普通流

     在普通流中，元素按照其在HTML中的先后位置自上至下布局，在这个过程中，行内元素水平排列，直到当行被占满然后换行，块级元素则会被渲染为完整的一个新行，除非另外指定，否则所有元素默认都是普通流定位，也可以说，普通流中元素的位置由该元素在HTML文档中的位置决定。

   - 浮动

     在浮动布局中，元素首先按照普通流的位置出现，然后根据浮动的方向尽可能的向左边或右边偏移，其效果与印刷排版的文字环绕相似。

   - 绝对定位

     绝对定位中，元素会整体脱离普通流，因此绝对定位元素不会对其兄弟元素造成影响，而元素的具体位置由绝对定位的坐标决定。

2. ##### BFC概念

   Formatting context（格式化上下文）是W3C CSS2.1规范中的一个概念。它是页面中的一块渲染区域，并且有一套渲染规则，它决定了其子元素将如何定位，以及和其他元素的关系及相互作用。

   BFC 即块级格式化上下文，它属于上述定位方案中的普通流。

   **具有BFC特性的元素可以看作是隔离了的独立容器，容器里面的元素不会在布局上影响外面的元素，并且BFC具有普通容器所没有的一些特性**。

   

3. ##### 触发BFC

   只要元素满足下面任一条件，即可触发BFC特性

   - body 根元素
   - 浮动元素 float除none以外的值
   - 绝对定位元素 position （absolute、fixed）
   - display 为inline-block、table-cells、flex
   - overflow 除了 visible 以外的值 （hidden、auto、scroll）

4. ##### BFC特性及应用

   1. ###### 同一个BFC下外边距会发生重叠

      ```html
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Document</title>
          <style>
            * {
              margin: 0;
              padding: 0;
            }
            .left {
              float: left;
            }
            div {
              width: 200px;
              height: 200px;
              margin: 100px;
            }
            .father {
              background-color: pink;
            }
            .child {
              background-color: yellow;
            }
          </style>
        </head>
        <body>
          <div class="father"></div>
          <div class="child"></div>
        </body>
      </html>
      ```

      上面代码中，设置div宽高均为200px，margin值为100px，而实际由于bfc的缘故会存在margin合并的问题：

      <img src="https://tvax3.sinaimg.cn/large/005SSskyly1ghbicia0esj30c90kwmx6.jpg" alt="image" style="zoom: 50%;" />

      可以看到实际的margin只有100px，因为两个div元素都处于同一个BFC容器下（这里值body元素），所以第一个div的margin-bottom和第二个div的margin-top发生了重叠，两个盒子之间的距离也就只有100px。

      首先，这不是CSS的bug，可以将其理解为一种规范，如果想避免外边距的重叠，可以将其放在不同的BFC容器中：

      ```html
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Document</title>
          <style>
        	/* 新增 */      
            .content{
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          <!-- 修改 -->
          <div class="content">
            <div class="father"></div>
          </div>
          <div class="content">
            <div class="child"></div>
          </div>
        </body>
      </html>
      
      ```

      ![image](https://tva2.sinaimg.cn/large/005SSskyly1ghbin3il3aj309u0hma9z.jpg)

      这时候，两个盒子的边距就变成了200px。

   2. ###### BFC可以包含浮动的元素（清除浮动）

      修改先前代码

      ```html
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Document</title>
          <style>
            * {
              margin: 0;
              padding: 0;
            }
            .left {
              float: left;
            }
            div {
            }
            .father {
              border: 2px solid green;
            }
            .child {
              width: 200px;
              height: 200px;
              margin: 10px;
              background-color: yellow;
            }
            .content {
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          <div class="father">
            <div class="child left"></div>
          </div>
        </body>
      </html>
      
      ```

      可以看到，由于子元素左浮动，脱离文档流，导致父元素没有被撑开。

      如果触发容器的BFC，那么容器将会包裹着浮动元素。

      <img src="https://tvax2.sinaimg.cn/large/005SSskyly1ghbirlp6lqj30di08f0sl.jpg" alt="image" style="zoom:80%;" />

      修改CSS样式如下

      ```css
      .father {
          overflow: hidden;
          border: 2px solid green;
      }
      ```

      <img src="https://tvax1.sinaimg.cn/large/005SSskyly1ghbiu8y6m4j30d708q745.jpg" alt="image" style="zoom:80%;" />

   3. ###### BFC可以阻止元素被浮动元素覆盖

      ```html
      <!DOCTYPE html>
      <html lang="en">
        <body>
          <div
            style="height: 100px; width: 100px; float: left; background: lightblue;"
          >
            我是一个左浮动的元素
          </div>
          <div style="width: 200px; height: 200px; background: #eee;">
            我是一个没有设置浮动, 也没有触发 BFC 元素, width: 200px; height:200px;
            background: #eee;
          </div>
        </body>
      </html>
      ```

      ![image](https://tva4.sinaimg.cn/large/005SSskyly1ghbivxnaa4j308m07y0ss.jpg)

      这时候其实第二个元素有部分被浮动元素所覆盖，(但是文本信息不会被浮动元素所覆盖) 如果想避免元素被覆盖，可触第二个元素的 BFC 特性，在第二个元素中加入 **overflow: hidden**，就会变成：

      ![image](https://tva3.sinaimg.cn/large/005SSskyly1ghbiwuzs4qj30bn085q31.jpg)

      这个方法可以用来实现两列自适应布局，效果不错，这时候左边的宽度固定，右边的内容自适应宽度(去掉上面右边内容的宽度)。



#### 52.水平垂直居中

```html
<div class="father">
    <div class="child"></div>
</div>
```

1. ###### 水平居中

   - 对于行内元素 text-align ：center

   - 对于确定宽度的块级元素：

     - margin 和 width 实现 ：margin ：0 auto；
     - 绝对定位和margin-left：-width/2，前提是父元素相对定位

   - 对于宽度未知的块级元素

     - table布局配合margin auto

       ```css
       display: table;
       margin: auto;
       ```

     - inline-block 和 text-align ： center

     - 绝对定位 + transfrom，translateX移动本身元素50%

     - flex布局使用     justify-content: center;

2. ###### 垂直居中

   1. 利用line-height 实现居中，适用于纯文字。

   2. 设置父元素相对定位，子元素绝对定位，通过 margin实现自适应居中。

   3. 弹性布局flex，父元素display：flex；子元素margin：auto；

   4. 父元素相对定位，子元素设置绝对定位，再利用transform。

   5. table布局

      ```css
      div.parent {
      	display: table;
      }
      div.child {
          display: table-cell
          vertical-align: middle;
          text-align: center;
      }
      ```

   6. grid布局

      ```css
      div.parent{
          display:grid; 
      }
      div.child{
          margin:auto; 
      }
      ```



#### 57.opacity、visibility、display区别

1. ###### 结构：

   display:none: 会让元素完全从渲染树中消失，渲染的时候不占据任何空间, 不能点击，
   visibility: hidden:不会让元素从渲染树消失，渲染元素继续占据空间，只是内容不可见，不能点击
   opacity: 0: 不会让元素从渲染树消失，渲染元素继续占据空间，只是内容不可见，可以点击

2. ###### 继承：

   display: none和opacity: 0：是非继承属性，子孙节点消失由于元素从渲染树消失造成，通过修改子孙节点属性无法显示。
   visibility: hidden：是继承属性，子孙节点消失由于继承了hidden，通过设置visibility: visible;可以让子孙节点显式。

3. ###### 性能

   displaynone : 修改元素会造成文档回流,读屏器不会读取display: none元素内容，性能消耗较大
   visibility:hidden: 修改元素只会造成本元素的重绘,性能消耗较少读屏器读取visibility: hidden元素内容
   opacity: 0 ： 修改元素会造成重绘，性能消耗较少

4. ###### 联系

   它们都能让元素不可见



#### 60.修改图片宽度

```html
<img src="1.jpg" style="width:480px!important;”>
```

1. ```html
   <img src="1.jpg" style="width:480px!important; max-wdth:300px;”>
   ```

2. ```html
   <img src="1.jpg" style="width:480px!important; width:300px!important;”>
   ```

3. ```html
   <img src="1.jpg" style="width:480px!important; box-sizing:border-box;padding:0 90px ”>
   ```

4. ```html
   <img src="1.jpg" style="width:480px!important; transform(0.625,1)”>
   ```

5. ```css
   img{
       animation: test 0s forwards;
   }
   @keyframes test{
       from{
           width:300px;
       }
       to{
           width:300px;
       }
   }
   // 利用css动画的样式优先级比！important高的特性
   ```



#### 68.移动端1px问题

​	伪元素::after + height 1px ，再进行缩放

 

#### 73.介绍下BFC、IFC、GFC和FFC

- ##### BFC

  - 块级格式化上下文
  - 页面上一个隔离的渲染区域
  - 触发方式 ---见上面 ⬆

- ##### IFC

  - 内联格式化上下文

  - IFC的高度由其包含行内元素中最高的实际高度计算而来（不受到垂直方向的padding/margin影响）IFC中的line box一般左右都紧贴整个IFC，但是会因为float元素而扰乱。float元素会位于IFC与line box之间，使得line box宽度缩短。通过IFC下的多个line box高度会不同

  - IFC中是不可能有块级元素的，当插入块级元素时，会产生两个匿名块与div分隔开，即产生两个IFC，每个IFC对外表现为块级元素，与div垂直排列。

  - IFC作用

    1. 水平居中

       当一个块要再环境中水平居中时，设置其为inline-block则会再外层产生IFC，通过text-align则可以使其水平居中。

    2. 垂直居中

       创建一个IFC，用其中一个元素撑开父元素的高度，然后设置其vertical-align:middle，其他行内元素则可以在此父元素下垂直居中。

- FFC

  - 自适应格式化上下文
  - display值为flex或者inline-flex的元素将会生成自适应容器（flex-container）。Flex Box由伸缩容器和伸缩项目组成。通过设置元素的display属性为flex或inline-flex可以得到一个伸缩容器。设置为flex的容器被渲染为一个块级元素，而设置为inline-flex的容器则渲染为一个行内元素。伸缩容器中的每一个子元素都是一个伸缩项目。伸缩项目可以是任意数量的。伸缩容器外和伸缩项目内的一切元素都不受影响。简单来说，Flexbox定义了伸缩容器内伸缩项目该如何布局。



#### 127.多行文本省略

- ##### 单行

  ```css
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  ```

- ##### 多行

  ```css
  diplay:-webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3; //行数
  overflow: hidden;
  ```

  

#### flex布局