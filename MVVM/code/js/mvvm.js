/**
 * MVVM主文件
 */

class MVVM{
    constructor(options){
        this.$options = options || {}
        let data = this._data = options.data
        
        // 数据代理
        this._proxyData(data,this)

        // 计算属性
        this._initComputed();

        // 数据挟持
        observe(data,this)

        // 模版解析
        this.$compile = new Compile(options.el || document.body,this)

    }
    $watch(key, cb, options) {
        // 
        new Watcher(this, key, cb);
    }
    _proxyData(data,me){
        // 数据代理
        Object.keys(data).forEach((key)=>{
            Object.defineProperty(me,key,{
                enumerable:true,
                get(){
                    return me._data[key]
                },
                set(value){
                    me._data[key] = value
                }
            })
        })
    }
    _initComputed() {
        var me = this;
        var computed = this.$options.computed;
        if (typeof computed === 'object') {
            Object.keys(computed).forEach(function(key) {
                Object.defineProperty(me, key, {
                    // 这里看不懂
                    get: typeof computed[key] === 'function' 
                            ? computed[key] 
                            : computed[key].get,    // 兼容get/set的写法 
                    set: function() {}
                });
            });
        }
    }
        

}

