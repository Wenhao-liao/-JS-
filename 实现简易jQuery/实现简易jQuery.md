# 实现简易jQuery

`jQuery`的本质就是一个JavaScript函数。可以使用`typeof jQuery`或是`typeof $`查看返回值，返回值为`'function'`

其实，`jQuery`就是将一些常用的(反人类的)DOM API进行封装，方便我们调用，所以jQuery对象其实就是通过jQuery包装DOM对象后产生的对象 。



所以我们可以写一个函数，让它返回一个对象，对象里面包含一些有用的方法，然后赋值给一个全局的变量去模拟我们自己的jQuery



## 代码

```js
window.jQuery = function(nodeOrSelector){
    //jQuery返回的是一个伪数组，因此，我们在开始会用对象去模拟这样一个伪数组
	let nodes = {};
    if(typeof nodeSelector === 'string'){
        let temp = document.querySelectorAll(nodeOrSelector)；   //伪数组
        for(let i = 0;i<temp.length;i++){
            nodes[i] = temp[i]；
        }
        nodes.length = temp.length;
    }else if(nodeOrSelector instanceof Node){
        nodes = {
            0:nodeOrSelector,
            length:1
        }
    }
    
   
    nodes.addClass = function(value){
        for(let i = 0; i < node.length; i++){
            nodes[i].classList.add(value)
        }
    }
    nodes.text = function(text) {
        if(text === undefined){
            var texts = [];
            for(let i = 0;i<nodes.length;i++){
                texts.push(nodes[i].textContent)
            }
            return texts
        }else{
            for(let i = 0;i<nodes.length;i++){
                nodes[i].textContent = text
            }
        }
    }
     nodes.getSibilings = function(){
       //不实现了
    }
    return nodes
}
window.$ = window.jQuery
```