/**
 * 数据挟持文件
 */

function observe(value) {
    if (!value || typeof value !== 'object') {
        return;
    }
    return new Observer(value)
};

class Observer{
    constructor(data){
        this.data = data;
        this.walk(data);
    }
    walk(data) {
        var me = this;
        // data:{
        //    msg:'xxx'， // 基本类型
        //    obj:{prop1:'yyy',innerObj:{innerProp1:'zzz'}} // 引用类型
        // }
        // => ['msg']
        // 为每一个属性执行下面的这个函数
        Object.keys(this.data).forEach(function(key) {
            me.defineReactive(me.data,key, data[key]);
        });
    }
    // 数据挟持
    defineReactive(data,key,val){
        // 每一个属性（key），都会实例化一个Dep
        let dep = new Dep();

        let childObj = observe(val);    // 递归，目的是深层地给每一个属性一个监听器dep

        Object.defineProperty(data,key,{
            enumerable:true, // 可枚举
            configurable:false, // 不能再define
            get() {
                if(Dep.target){                 // 模版解析之后（触发watcher）这里的Dep.target就是我的watcher实例对象
                    // 建立联系
                    dep.depend();
                }
                return val;
            },
            set(newVal){
                if(newVal === val){
                    return 
                }
                val = newVal 
                // 新的值是object的话，进行数据挟持（加Dep监听器）
                childObj = observe(newVal)
                // 通知订阅者
                dep.notify();
            }       
        })
    }
}

// 全局的，在Vue实例运行的时候，创建属性会有对应的Dep，Dep的id是唯一的
let uid = 0;

class Dep { // Dependency 依赖收集
    constructor() {
        this.id = uid++;
        this.subs = [] // 订阅者们
    }
    addSub(sub) {
        this.subs.push(sub)
    }
    // 第一次new Watcher的时候会触发，notify的时候也会触发
    depend() {
        // 挟持之后，在get里面调用depend方法，再在这里调addDep方法
        Dep.target.addDep(this)
    }
    removeSub(sub) {
        let index = this.subs.indexOf(sub)
        if(index != -1){
            this.subs.splice(index,1)
        }
    }
    notify(){
        // 该通知会遍历订阅者去修改 this=>Dep实例
        this.subs.forEach((sub)=>{
            sub.update()
        })
    }
}

Dep.target = null