/**
 * 模板解析文件
 */

class Compile{
    constructor(el,vm){
        this.$vm = vm
        // 有可能option里面的el就是一个元素，也有可能是字符串
        this.$el = this.isElementNode(el) ? el : document.querySelector(el)

        if(this.$el){
            this.$fragment = this.node2Fragment(this.$el);
            // 开始进行模版解析
            this.init()
            this.$el.appendChild(this.$fragment)
        }
    }
    node2Fragment(el){
        let fragment = document.createDocumentFragment(),
            child;
        
        // 将原生节点粘贴到fragment
        while(child = el.firstChild){
            fragment.appendChild(child);
        }
        
        return fragment
    }
    init(){
        this.compileElement(this.$fragment)
    }
    compileElement(el){
        var childNodes = el.childNodes,
            me = this;
        // 伪数组转真数组
        [].slice.call(childNodes).forEach((node)=>{
            var text = node.textContent;
            var reg = /\{\{(.*)\}\}/;
            // 元素节点，拿里面的属性
            if(me.isElementNode(node)){
                me.compile(node);
            // 文本节点，进行替换
            }else if(me.isTextNode(node) && reg.test(text)){
                // 将子节点的textContent替换成vm对应属性里面的
                me.compileText(node,RegExp.$1.trim())
            }
            // 递归，将里面所有的node进行上面的操作
            if(node.childNodes && node.childNodes.length){
                me.compileElement(node)
            }
        })
    }
    compile(node){
        var nodeAttrs = node.attributes,
            me = this;
        [].slice.call(nodeAttrs).forEach((attr)=>{
            var attrName = attr.name;
            // 判断属性是否是指令，是指令就处理一下
            if(me.isDirective(attrName)){
                var exp = attr.value;
                var dir = attrName.substring(2)
                // 是否是事件指令
                if(me.isEventDirective(dir)){
                    compileUtil.eventHandler(node,me.$vm,exp,dir)
                // 是否是普通指令 dir可能是v-text、html、bind、class    
                }else{
                    compileUtil[dir] && compileUtil[dir](node,me.$vm,exp)
                }
                node.removeAttribute(attrName);
            }
        })
    }
    compileText(node,exp){
        // 相当于v-text，将{{msg}}这样的替换掉
        compileUtil.text(node,this.$vm,exp)
    }
    isDirective(attr){
        return attr.indexOf('v-') == 0
    }
    isEventDirective(attr){
        return attr.indexOf('on') === 0
    }
    isElementNode(node) {
        return node.nodeType == 1;
    }
    isTextNode(node) {
        return node.nodeType == 3;
    }
}

// 指令处理集合
var compileUtil = {
    // v-text
    text(node,vm,exp){
        this.bind(node,vm,exp,'text');
    },
    html(node,vm,exp){
        this.bind(node,vm,exp,'html');
    },
    model(node,vm,exp){
        this.bind(node,vm,exp,'model');
        var me = this,
            val = this._getVMVal(vm,exp);
        node.addEventListener('input',(e)=>{
            var newValue = e.target.value;
            if(val === newValue){
                return 
            }
            me._setVMVal(vm,exp,newValue);
            val = newValue
        });
    },
    class(node,vm,exp){
        this.bind(node,vm,exp,'class')
    },
    // 表达式
    bind(node,vm,exp,dir){
        var updaterFn = updater[dir + 'Updater']

        updaterFn && updaterFn(node,this._getVMVal(vm,exp));

        // 监视器 exp:插值语法的值或者v-属性的属性名
        // v-text（有可能是插值）,v-html,v-bind,v-class都会触发
        new Watcher(vm,exp,(value,oldValue)=>{
            updaterFn && updaterFn(node,value,oldValue);
        })
    },
    // 事件处理
    eventHandler(node,vm,exp,dir){
        var eventType = dir.split(':')[1],
        fn = vm.$options.methods && vm.$options.methods[exp];
        // 拿到vm.$options.methods对应的方法
        if (eventType && fn) {
            // addEventListener将对应的node绑定事件
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    },
    // exp是属性的值，比如：msg
    _getVMVal(vm,exp){
        var val = vm;
        exp = exp.split(',')
        exp.forEach((k)=>{
            val = val[k]
        })
        return val
    },
    // vm是实例对象，exp是属性的值（比如msg），value是input事件新输入的值
    _setVMVal(vm,exp,value){
        var val = vm;
        exp = exp.split('.');
        exp.forEach((k,i)=>{
            // 下面代码是确保如果有对象的嵌套层级，比如obj.msg，那么就到最内层去设置
            if(i < exp.length - 1){
                val = val[k]
            }else{
                val[k] = value
            }

        })
    }
}

// v-text,v-html,v-bind,v-class对应的最后的操作
var updater = {
    // v-text指令和{{msg}}这样的都会使用这个方法
    textUpdater(node,value){
        node.textContent = typeof value == 'undefined' ? '' : value
    },
    htmlUpdater(node,value){
        node.innerHTML = typeof value == 'undefined' ? '' : value
    },
    classUpdater(node,value,oldValue){
        var className = node.className;
        className = className.replace(oldValue,'').replace(/\s$/,'');  // 监听改变，将旧值
        var space = className && String(value) ? ' ' : '';
        node.className = className + space + value;
    },
    modeUpdater(node,value,oldValue){
        node.value = typeof value == 'undefined' ? '' : value
    }
}

