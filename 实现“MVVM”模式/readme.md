# 实现简易MVVM

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>MVVM</title>
</head>
<body>

<div id="mvvm-app">
    <input type="text" v-model="someStr">
    <input type="text" v-model="child.someStr">
    <!-- <p v-class="className" class="abc">
        {{someStr}}
        <span v-text="child.someStr"></span>
    </p> -->
    <p>{{ getHelloWord }}</p>
    <p v-html="htmlStr"></p>
    <button v-on:click="clickBtn">change model</button>
</div>

<script src="http://cdn.bootcss.com/vue/1.0.25/vue.js"></script>
<script src="./js/observer.js"></script>
<script src="./js/watcher.js"></script>
<script src="./js/compile.js"></script>
<script src="./js/mvvm.js"></script>
<script>
    var vm = new MVVM({
        el: '#mvvm-app',
        data: {
            someStr: 'hello ',
            className: 'btn',
            htmlStr: '<span style="color: #f00;">red</span>',
            child: {
                someStr: 'World !'
            }
        },

        computed: {
            getHelloWord: function() {
                return this.someStr + this.child.someStr;
            }
        },

        methods: {
            clickBtn: function(e) {
                var randomStrArr = ['childOne', 'childTwo', 'childThree'];
                this.child.someStr = randomStrArr[parseInt(Math.random() * 3)];
            }
        }
    });
    console.log(vm)
    vm.$watch('child.someStr', function() {
        console.log(arguments);
    });
</script>

</body>
</html>
```



## 需求描述

```js
// 类的方式去创建
var vm = new MVVM(options)
```

```js
/**
 * 选项：
 * el：
 * data：数据，需要代理到this（vm）上
 * computed：监听每一个方法内部的data属性，变化即执行函数，返回新的值并代理到this（vm）上
 * method：方法对象，可以绑定到模版里面
 */
var options = {
    el: '#mvvm-app',
    data: {
        someStr: 'hello ',
        className: 'btn',
        htmlStr: '<span style="color: #f00;">red</span>',
        child: {
            someStr: 'World !'
        }
    },

    computed: {
        getHelloWord: function() {
            return this.someStr + this.child.someStr;
        }
    },

    methods: {
        clickBtn: function(e) {
            var randomStrArr = ['childOne', 'childTwo', 'childThree'];
            this.child.someStr = randomStrArr[parseInt(Math.random() * 3)];
        }
    }
  }
```

```html
<!--
	能够解析下面的语法，包括{{}}、v-model、v-html、v-on
	1.{{xxx}}:中xxx是data中的属性，则读取出对应的值
	2.v-model:实现双向绑定：显示属性对应的值，同时表单元素值改变的时候同步修改对应属性的值
	3.v-html:在所在元素中插入html 相当于 xxx.innerHtml
  4.v-on:绑定选项中methods中的方法 
-->
<div id="mvvm-app">
    <input type="text" v-model="someStr">
    <input type="text" v-model="child.someStr">
    <!-- <p v-class="className" class="abc">
        {{someStr}}
        <span v-text="child.someStr"></span>
    </p> -->
    <p>{{ getHelloWord }}</p>
    <p v-html="htmlStr"></p>
    <button v-on:click="clickBtn">change model</button>
</div>
```



## 分析

分为3个大关键需求需要实现

1. 数据代理

   实现`this.xxx`的获取和更改（其中xxx为传入data选项的数据）

2. 数据响应

   通过数据的胁持和监视，从而实现数据的响应式

3. 模板解析

```txt
能够解析下面的语法，包括{{}}、v-model、v-html、v-on
	1.{{xxx}}:中xxx是data中的属性，则读取出对应的值
	2.v-model:实现双向绑定：显示属性对应的值，同时表单元素值改变的时候同步修改对应属性的值
	3.v-html:在所在元素中插入html 相当于 xxx.innerHtml
  4.v-on:绑定选项中methods中的方法 
```



## 数据代理

实现方式：

通过`Object.defineProperty()` 实现，当访问和设置`this.xxx属性`的时候，通过getter和setter去访问和设置

代码如下：

```js
class MVVM{
    constructor(options){
        let me = this;
        me._data = options.data
        // 数据代理
        Object.keys(options.data).forEach((item)=>{
            Object.defineProperty(me,item,{
                enumerable:true,
                get(){
                    return me._data[item]
                },
                set(value){
                    me._data[item] = value
                }
            })
        })
    }
}
```



## 数据响应

这里的数据响应实际上需要实现的是`双向数据绑定`

所谓双向数据绑定，指的是

1.数据改变视图改变

2.视图的表单元素输入改变，绑定的数据跟着改变

vue实现数据响应的总体思路是`数据挟持+发布订阅模式` ，通过Object.defineProperty()来挟持各个属性的setter和getter，在数据变动时发布消息给订阅者（watcher），触发相应的监听回调

具体的实现思路如下：

1. 实现一个数据监听器Observer，能够对数据对象的所有属性进行监听，如有变动可拿到最新值并通知订阅者
2. 实现一个指令解析器Compile，对每个元素节点的指令进行扫描和解析，指令（v-class,v-bind,v-text,v-html）和模版 `{{xxx.xxx}}` 会实现对应效果，同时，每一个指令和模版都是一个订阅者，解析的时候会触发上述监听属性的get将本订阅者加入对应属性订阅器中

### Observer文件

使用 Object.defineProperty()来挟持data各个属性

每一个属性都有一个订阅器 — `new Dep()` ，Dep实例里面会有subs属性，放watcher实例对象（订阅者），进行依赖收集



同时会有对应的get和set方法

get：

```js
// 第一次new Watcher的时候会触发，notify的时候也会触发
get() {
		// 这里的target是当前watcher实例
    if(Dep.target){                 // 模版解析之后（触发watcher）这里的Dep.target就是我的watcher实例对象
        // 建立联系
        dep.depend();
    }
    return val;
},
```

set:（发布消息）

```js
set(newVal){
    if(newVal === val){
        return 
    }
    val = newVal 
    // 新的值是object的话，进行数据挟持（加Dep监听器）
    childObj = observe(newVal)
    // 通知订阅者，执行回调函数，做相应的更新
    dep.notify(); 
}
```



## 模版解析

### Compile文件

1.拿到el元素

2.拿到模版，读取进去一个文档碎片对象中（document.createDocumentFragment()）

```html
<div id="mvvm-app">
    <input type="text" v-model="someStr">
    <input type="text" v-model="child.someStr">
    <p v-class="className" class="abc">
        {{someStr}}
        <span v-text="child.someStr"></span>
    </p>
    <p>{{ getHelloWord }}</p>
    <p v-html="htmlStr"></p>
    <button v-on:click="clickBtn">change model</button> <span>--点击会在第二个input框随机出现childOne、childTwo、childThree</span>
</div>
```

```js
// 将原生节点粘贴到fragment
while(child = el.firstChild){
    fragment.appendChild(child);
}
```

3.编译模版

读取上述文档碎片对象的childNode，分为元素和文本节点2种进行处理

注意：这里childNode里面的元素如果还有childNode，也需要处理（即需要递归处理）

```js
// 元素节点，拿里面的属性
if(me.isElementNode(node)){
    me.compile(node);
// 文本节点，进行替换
}else if(me.isTextNode(node) && reg.test(text)){
    // 将子节点的textContent替换成vm对应属性里面的
    me.compileText(node,RegExp.$1.trim())
}
```



4.处理过程

1. 元素节点

需要读取属性，分为自定义

看是否是“v-”的自定义指果是

再看是否是v-on的事件绑定指令，是的话用以下代码进行处理

```js
// 事件处理：其实就是addEventlistener去监听事件
eventHandler(node,vm,exp,dir){
    var eventType = dir.split(':')[1],
    fn = vm.$options.methods && vm.$options.methods[exp];
    // 拿到vm.$options.methods对应的方法
    if (eventType && fn) {
        // addEventListener将对应的node绑定事件
        node.addEventListener(eventType, fn.bind(vm), false);
    }
},
```

其他指令：普通指令 dir可能是v-text、html、bind、class、model。实现对应效果，同时，每一个指令和模版都是一个订阅者。

最后再把这个“v-”自定义指令移除`node.removeAttribute(attrName);`



2. 文本节点

其实就是解析`{{}}` 模版语法

拿到里面的内容，然后使用`compileUtil.text()`



### 其中涉及的watcher文件

Observer文件和Compile文件中涉及的watcher文件



解析的时候

对于上述的v-指令和模版，每一个事实上都会有一个监视器

每一个“v-”指令或者模版语法都是一个watcher，watch选项也是一个watcher，都会通过`new Watcher()` 创建一个实例对象

watcher会有exp或者fn（watch），然后会有一个回调函数cb

每个watcher会有一个depIds，保存一个或者多个dep实例（该watcher绑定的属性们）

同时，将observer文件中，会在初次解析的时候将自身实例加入属性的监听器Dep的subs数组中，同时记录下当前实例对应的属性（通过depIds对象去记录，每一个属性都有一个Dep实例，它拥有唯一id）

```js
// 创造watcher实例和Dep实例的联系
addDep(dep){
    if(!this.depIds.hasOwnProperty(dep.id)){
        // this => watcher实例对象
        dep.addSub(this)       // 全局dep的subs数组，增加该watcher实例对象
        this.depIds[dep.id] = dep   // watcher实例的depids对象=> {dep.id:dep实例}
    }
},
```

