class ServerChannel {
    constructor(options, engine) {
        this.options = options.options
        this.name = options.name
        this.engine = engine
    }

    async load(ds, connection, params) {
        // console.log("request data ",params)
        if (this.options.data == "engine" || params.data=="engine"){
            const data ={
                timestamp:Date.now(),
                uptime:(Date.now() - this.engine.runtime.startTime),
                reports:this.engine.runtime.reports,
                bytes:this.engine.runtime.bytes,
                errors:this.engine.runtime.errors,
                paths:this.engine.paths,
                configFile:this.engine.configFile,
                cacheTotal:this.engine.cache.tries,
                cacheHits:this.engine.cache.hits,
                cacheRatio: ((this.engine.cache.hits/this.engine.cache.tries) || 0),
                channels:Object.keys(this.engine.channels)
            }
            ds.addRow(data)
        }
        // memory,
        // network https://nodejs.org/api/net.html
        // OS  https://nodejs.org/api/os.html
        // process
        //

    }
}

export default ServerChannel