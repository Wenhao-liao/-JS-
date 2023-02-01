// 监视器 exp:插值语法的值或者v-属性的属性名
// v-text（有可能是插值）,v-html,v-bind,v-class都会触发
function Watcher(vm,expOrFn,cb){
    this.cb = cb;  // 操作效果的函数
    this.vm = vm;
    this.expOrFn = expOrFn;     // 对应的watcher已经保存了exp
    this.depIds = {};           // 每个实例对象都设置一个depIds,保存一个或者多个dep实例
    // 
    if(typeof expOrFn === 'function'){
        this.getter = expOrFn
    }else{
        this.getter = this.parseGetter(expOrFn.trim())    // 返回一个函数
    }
    this.value = this.get();    // 每一个表达式的值都存在该表达式对应的实例对象中，每次get都会触发addDep，然后建立该watcher实例
}

Watcher.prototype = { 
    constructor:Watcher,
    update(){
        this.run()
    },
    run(){
        // this是watcher实例，保存了一些值，包括value，和get方法
        var value = this.get(); // 
        var oldValue = this.value;  // 这个是以前保存的值
        if(value !== oldValue){
            this.value = value;
            this.cb.call(this.vm,value,oldValue)
        }
    },
    // 创造watcher实例和Dep实例的联系
    addDep(dep){
        if(!this.depIds.hasOwnProperty(dep.id)){
            // this => watcher实例对象
            dep.addSub(this)       // 全局dep的subs数组，增加该watcher实例对象
            this.depIds[dep.id] = dep   // watcher实例的depids对象=> {dep.id:dep实例}
        }
    },
    get(){
        Dep.target = this;  // 给Dep函数对象加一个target属性，this是watcher实例对象
        var value = this.getter.call(this.vm, this.vm);     // 拿到exp对应的值，会触发挟持的get
        Dep.target = null;
        return value;
    },
    // 
    parseGetter(exp){
        if(/[^\w.$]/.test(exp)) return; 

        // ['msg']
        var exps = exp.split('.');

        // 返回的是一个函数
        return function(obj) {
            for(var i=0,len = exps.length;i<len;i++){
                if(!obj) return 
                obj = obj[exps[i]]  // vm['msg']   触发挟持的get
            }
            return obj
        }
    }
}