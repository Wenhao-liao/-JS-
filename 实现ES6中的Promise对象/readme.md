# 手写Promise

JS异步编程的一种解决方案

注意下面手写的代码只是为了训练我们编码能力，不能用于生产环境



## 基本的测试用例

```js
// 使用方式如下：
new Promise((resolve,reject)=>{
	// 1.同步方式使用
	// resolve() // 或者 reject('抛出错误')
	// 2.异步方式使用（常用）
	setTimeout(()=>{
	  if(res.code === 200){
			resolve(data)
	  }else{
			reject(res.msg)
	  }
	},2000)
}).then((data)=>{ // Promise实例调用.then方法
	console.log(data)
},(reason)=>{
	console.log(reason)
}}).catch((reason)=>{
	console.log(reason)
})
```



## 自定义promise

### 第一步：回忆使用方法，写出主函数

```js
/** 第一步，回忆使用方法，写出主函数
  1.他是一个类
  2.他接收一个回调函数作为参数
  3.回调函数会自动接收到2个实参函数
  4.可以往实参函数里面传参数
  代码实现如下：
*/
class self_promise {
	constructor(excutor){
    // 实参函数resolve
		function resolve(data){

    }
    // 实参函数reject
    function reject(reason){

    }
    // 执行传递进来的回调函数
    excutor(resolve,reject)
  }
	
}
```



### 第二步：根据具体实现，完善代码主函数的实现细节

```js
 /** 第二步，根据具体实现，完善代码主函数的实现细节
  1.调用resolve或者reject后，会有2个直接改变：1）参数作为数据保存到实例中（后续会在.then()或者.catch()中用到） 2）状态改变，起始状态为pending，调用resolve后变为fulfilled，调用reject后变为rejected
  2.因此，Promise实例自身需要维护2个数据 1）结果  2）当前状态（默认为pending），在调用resolve或者reject函数时改变自身维护的这两个值
  3.另外，需要注意的是，状态只能改变一次。多次调用resolve或者reject，以第一次调用为准。这里的实现是通过判断state是否是pending确定的。
 */
class self_promise {
	constructor(excutor){
		// const self = this  // 保存this，因为作为参数的回调函数调用后this会指向window；也可以使用箭头函数去避免这个问题。
		this.data = null
		this.state = 'pending'
		const resolve = (data)=>{
			if(this.state !== 'pending') return 
			this.data = data
			this.state = 'fulfilled'
		}
		const reject = (data)=>{
			if(this.state !== 'pending') return 
			this.data = data
			this.state = 'rejected'
		}
		excutor(resolve,reject)
	}
}
```

写完上面的代码后，可以小小地进行一下测试，这里使用了5条测试用例

```js
// 测试同步，测试用例1
let p = new self_promise((resolve,reject)=>{
	// 1.同步+resolve
	resolve('data') 
})

// 测试同步，测试用例2
let p = new self_promise((resolve,reject)=>{
	// 2.同步+reject
	reject('抛出错误') 
})

// 测试同步，测试用例3
let p = new self_promise((resolve,reject)=>{
	// 2.同步+resolve和reject
	resolve('data')
	reject('抛出错误') 
})

// 测试异步，测试用例4
let p = new self_promise((resolve,reject)=>{
	setTimeout(()=>{
	  let res = {code:200,msg:"测试信息",data:'异步的数据'}
	  if(res.code === 200){
		resolve(res.data)
	  }else{
		reject(res.msg)
	  }
	},2000)
})

// 测试异步，测试用例5
let p = new self_promise((resolve,reject)=>{
	setTimeout(()=>{
	  let res = {code:500,msg:"测试信息",data:'异步的数据'}
	  if(res.code === 200){
		resolve(res.data)
	  }else{
		reject(res.msg)
	  }
	},2000)
})
```

经过测试，以上用例均符合预期，下面继续写



### 第三步：完善配套的Promise.prototype.then和Promise.prototype.catch方法

```js
// 第三步，完善配套的Promise.prototype.then和Promise.prototype.catch方法
class self_promise {
	constructor(excutor){
		// const self = this  // 保存this，因为作为参数的回调函数调用后this会指向window；也可以使用箭头函数去避免这个问题。
		this.data = null;
		this.state = 'pending'
		const resolve = (data)=>{
			if(this.state !== 'pending') return 
			this.data = data
			this.state = 'fulfilled'
		}
		const reject = (data)=>{
			if(this.state !== 'pending') return 
			this.data = data
			this.state = 'rejected'
		}
		excutor(resolve,reject)
	}
	/** 思路如下：
	  1.then函数接受2个回调函数作为参数，返回一个新的promise
	  2.then函数内部需要判断当前Promise实例状态，决定是执行第一个参数的函数还是第二个参数的函数
	  3.返回值是一个新的Promise实例，这里我们需要根据onResolve和onReject和返回值和执行情况判断then返回的Promise实例：
		1）如果参数的回调函数内部（onResolve，onReject）执行报错，则调用reject，这里我们需要使用try..catch去捕获
		2）如果是一个Promise实例，则直接返回这个实例，否则将返回值作为参数调用resolve
	*/
	then(onResolve,onReject){
		let result;
		try{
		  if(this.state === "fulfilled" && onResolve && typeof onResolve === 'function'){
		    result = onResolve(this.data)
		  }
		  if(this.state === "rejected" && onReject && typeof onReject === 'function'){
		    result = onReject(this.data)
		  }
		}catch(err){
			return new self_promise((resolve,reject)=>{
				reject(err)  
			}) 
		}

		if(result && result instanceof self_promise){
			return result
		}else{
			return new self_promise((resolve,reject)=>{
				resolve(result)  
			})
		}

	}
	// 基于已经写好的then()方法去实现
	catch(onReject){
		self_promise.prototype.then(undefined,onReject)
	}
}
```





