1. ##### webpack merge

   1. 用于进行webpack配置文件的拆分合并
   2. 将公共配置独立出来，线上环境和dev环境区分开，分别引入

2. ##### 在js代码打包时，生成一个hash文件名，保证缓存失效，新的文件生效

3. ##### 多页面打包

   1. 修改entry
   2. 修改output 【name】+hash
   3. 如果要进行代码抽离，还要注意html中的引入
   4. 增加htmlWebpackplugin chunks 中指定名称，进行特定文件的引入

4. ##### 抽离css文件

   1. dev环境下使用style loader来加载，样式会被打包到js文件中，性能较差
   2. 使用mini-css-extract-plugin，替换原本的style-loader，对css文件抽离并进行压缩

5. ##### 抽离公共部分

   1. 拆分第三方模块
   2. 公共引用部分拆分
   3. 使用splitchunks，
      1. chunks ：initial 只对同步导入的代码做分割
      2. chunks ：async 只对异步导入的代码做分割
      3. chunks ：all 对全部代码做分割
      4. 在htmlwebopackplugin中要注意引入的chunk
      5. 在配置模块加载时，要区分第三方模块和本身的模块，第三方模块引用一次就打包，本身模块至少两次才打包，并且区分大小，足够大才单独打包，否则还要发送http请求。
   
6. ##### 懒加载

   1. ```js
      setTimeout(()=>{
          import ('./dist/a.js').then(res=>{
          console.log(res.default.data)
      	})
      },200)
      返回的是一个promise
      vue react 异步组件的语法用的就是这个
      ```

   2. 原理是使用类似jsonp的方式，动态创建script标签来实现懒加载

   3. 在这里可以配置webpack的魔法注释

7. ##### moudle chunk budle区别

   1. moudle 源码文件，src目录下都是moudle，还有node——moudles
   2. chunk 打包在内存的文件，例如entry配置的入口，会打包到【name】这种chunk，使用import懒加载的模块也是chunk，再者使用split chunk实现的公共代码抽离
   3. bundle 是最终生成的文件

8. ##### 热更新 hmr

   1. 只更换改变的代码，不改变网页的状态

9. ##### happyPack 多进程打包

   1. 需要改变babel-loader的配置，打包的是css文件

10. ##### parallelUglifyPlugin 实现多进程压缩js

    1. 两个方式适合较大项目的打包，较小的项目由于进程间的开销反倒会降低性能

11. ##### ES6模块化引入 和 Common js

    1. ES6 静态引入，编译时引入
    2. common js 动态引入，执行时引入
    3. 只有ES6 Moudle才能实现静态分析，实现Tree Shacking

12. ##### babel

    1. presets 是一些plugin的集合，集成了一些常用的plugin
    2. babel polyfill 垫片，补丁，对浏览器不支持的方法函数进行引入
    3. babel-polyfill 是core js regernerator的集合，core js中不包含gererator的支持，所以需要使用regernerator
    4. 在babel7.4版本之后，被弃用，建议直接使用core js 
    5. 缺点，会污染全局环境，可以使用babel-runtime

13. ##### babel-runtime

    1. 可以重新取个变量名，不会污染全局环境



#### webpack考点总结

1. 拆分配置和merge

2. 启动本地服务

3. 处理es6

4. 处理样式

5. 处理图片

6. 多入口

7. 抽离css文件

8. 抽离公共代码

9. 懒加载

10. 处理jsx

11. 处理vue

12. ##### 优化构建速度 

    1. 优化babel-loader
    2. ignorePlugin
    3. noparse
    4. happyPack
    5. parallelUglifyPlugin
    6. 不能用于生产环境的
       1. 自动刷新
       2. 热更新
       3. dllPlugin

13. 小图片base64编码

14. bundle加hash

15. 懒加载

16. 提取公共代码

17. 使用cdn加速

18. ignorePlugin

19. 使用production

20. scope Hosting

21. babel配置

22. babelpolyfile

23. babel-runtime

24. 前端为何要使用打包构建

    1. 体积更小，加载速度更快
    2. 编译高级语言或语法，ts es6 模块化 scss
    3. 兼容性和语法检查
    4. 统一高效的开发环境
    5. 统一的构建流程和压缩标准
    6. 集成公司构建规范

25. loader plugin

    1. loader模块转换器
    2. plugin 拓展插件

26. babel 和webpack区别

    1. babel是一个语法的编译工具，也不关心模块化
    2. webpack是一个打包构建工具，不关心语法，是多个loader和plugin的集合