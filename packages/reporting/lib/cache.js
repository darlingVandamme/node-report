
function cache(options){
    if (!options) return null
    if (!options.type) return null
    if (options.type == "memory"){
        return new memoryCache(options)
    }
    if (options.type == "file"){

    }
    if (options.type == "memcache"){

    }

}

class memoryCache{
    constructor(options) {
        console.log("Setup cache Memory")
        this.cache = new Map()
        // size. expire, ....
    }

    get(key,options){
        if (this.cache.has(key)){
            // check timeout
            const val = this.cache.get(key)
            console.log("retrieve from cache ",key,val)
            // check timeout
            return val.data
        }
    }

    set(key,data,options){
        this.cache.set(key,{
            data:data,
            timestamp:Date.now(),
            timeout: (options?.timeout || 1000)
        })

    }
}





export {cache}