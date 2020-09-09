## HTML常见问题与知识点总结

#### 1.标准模式和混杂模式

1. \<!DOCTYPE>声明位于文档中的最前面，处于\<html>标签之前。告知浏览器以何种模式来渲染文档。
   
2. 严格模式的排版和JS运作模式是以该浏览器支持的最高标准运行。
3. 在混杂模式中，页面以宽松的向后兼容的方式显示。模拟老式浏览器的行为以防止站点无法工作。
4. \\<!DOCTYPE>不存在或格式不正确会导致文档以混杂模式呈现。

#### canvas和svg的区别

1. canvas是html5提供的新元素，而svg已经存在很长时间。svg最初是用xml超文本拓展语言描述二维图行的语言。
2. svg生成图形是靠特定数学公式计算而成的，由各种四边形、点线构建成的图像，所以不管放大缩小，图像都不会模糊。
3. canvas是一个画布，绘制出的图形为标量图，即位图，放大之后会出现各种像素点。
4. canvas绘制的图形不能被搜索引擎抓取，要求canvas中某个图形跟随鼠标事件，可以使用canvas.onmouseover=func()。
5. canvas绘制过程中多是由JavaScript实现，而svg大多是由标签构成。

#### 行内元素有哪些？会级元素有哪些？行内块元素有哪些？

1. 行内元素

   a b span em i strong

   特点

   ​	设置宽高无效

   ​	对margin仅设置左右方向有效，上下无效；padding设置上下左右都有效，即会撑大空间，行内元素尺寸由其内含的内容决定。

2. 块级元素

   div ul ol li dl dt dd h1 h2 h3 h4 p nav aside header footer section article

   特点

   ​	能够识别宽高

   ​	margin和padding上下左右值均有效

   ​	可以自动换行

   ​	多个元素写在一起，默认从上到下

3. 行内块元素

   img、input、td、select、textarea、label；

   行内块元素综合了行内元素和块级元素的特性，但有所取舍

   特点

   ​	不自动换行

   ​	能够识别宽高

   ​	默认排列方式为从左往右
   
4. 空元素

   常见

   ​	br hr img input link meta

   不常见

   ​	area base col command embed param

   #### 

   #### 页面导入样式时，使用link 和 @import 有什么区别？

   1. link属于XHTML标签，除了加载CSS外，还可以用于定义RSS，定义rel连接属性等作用，而@import 只能用于加载CSS
   2. 页面被加载时link会同时被加载，而@import引用的CSS会等页面被加载完成再加载,需要注意，这个加载时机比js加载还慢
   3. import是CSS2.1提出的，只有IE5以上才会被识别
   4. link支持使用js控制DOM去改变样式，而@import不能
   5. 使用@import引入的样式，会比link的样式加载的慢，但是加载后会提到顶部，导致最后被同名样式层叠掉

   #### 

   #### HTML5

   1. 新的语义化元素
      1. header 、 footer 、 nav 、 main 、 article 、 section
      2. 删除了一些纯样式标签
   2. 表单增强
   3. 新的API
      1. 离线 applicationCache
      2. 音视频 audio video
      3. 图形 canvas
      4. 实时通信 websocket 
      5. 本地存储
      6. 设备能力 定位

   

   #### em与i区别

   1. 效果都是斜体
   2. em是语义化标签，表强调
   3. i是样式标签，表斜体

   

   #### 自闭合标签

   1. 表单元素 input
   2. img
   3. br hr
   4. meta link

   

   #### HTML DOM 关系

   1. HTML是字符串
   2. DOM由HTML解析而来
   3. JS 可以 维护DOM

   

   #### property 和 attribute区别

   - **property能够从attribute中得到同步**；
   - **attribute不会同步property上的值**；
   - attribute和property之间的数据绑定是单向的，attribute->property；
   - 更改property和attribute上的任意值，都会将更新反映到HTML页面中；



#### HTML 语义化

1. 用正确的标签做正确的事情
2. 让页面的内容结构化，结构更清晰，便于浏览器、搜索引擎解析
3. 即使没有CSS情况下也能以一种文档格式显示，且容易阅读
4. 利于SEO优化，提升网站排名



#### title和alt区别

1. 图片不输出信息的时候，会显示alt信息，鼠标放上去，图片正常读取不会出现alt
2. 图片正常输出时，放上去会出现title信息
3. 除了纯装饰图片外，都需要设置有意义的值，搜索引擎会分析



#### defer 和 async区别

1. defer async 在加载方面是相同的，都是异步加载，可以和html元素并行加载
2. 执行时机
   - defer是在页面加载完成之后进行，contentload之前完成
   - async是加载完成就会立即执行，此时html解析阻塞
   - defer是按序执行，但需要注意defer实际实现与规范有出入