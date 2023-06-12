import * as fs from "fs/promises";

function cache(options){
    if (!options) return null
    if (!options.type) return null
    if (options.type == "memory"){
        return new memoryCache(options)
    }
    if (options.type == "file"){

    }
    if (options.type == "firestore"){
//        return new firestoreCache(options)
    }

}

class memoryCache{
    constructor(options) {
        console.log("Setup cache Memory")
        this.cache = new Map()
        // size. expire, ....
    }

    get(key,options){
        /*this.cache.forEach( (val, key) =>{
            console.log("cache:  "+ key )
        })*/

        if (this.cache.has(key)){
            // check timeout
            const val = this.cache.get(key)
            // console.log("retrieve from cache ",key,val)
            // check timeout
            if (Date.now() > (val.timestamp + (val.timeout * 1000))){
                console.log(" remove from cache timeout "+key )
                this.cache.delete(key)
                return null
            }
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

/*

class firestoreCache{
    constructor(options) {
        console.log("Setup cache Firestore ",options)
        this.options = options
        let serviceAccount
        if (options.auth){
            fs.readFile('/home/geert/projects/AdLens/online/settings/GCP_auth.json').then( data=>{
                console.log(data)
                serviceAccount = JSON.parse(data)
                console.log(serviceAccount)

                initializeApp({
                    credential: cert(serviceAccount)
                });
                this.db = getFirestore();

            })
        }
// https://firebase.google.com/docs/firestore/quickstart

    }

    async get(key, options) {
        return null
        const collection = this.options.collection
        const res = await this.db.collection(collection).doc(key).set(data);
        if (res){
            // check timeout
            return res.data
        }
        console.log("result ")
        console.log(res)
        return null
    }

    set(key,data,options){
        const item = {
            key:key,
            data:data,
            timestamp:Date.now(),
            timeout: (options?.timeout || 1000)
        }
        const collection = this.options.collection
        this.db.collection(collection).doc(key).set(data);
        console.log("Save in cache "+key)
    }
}


*/

export {cache}