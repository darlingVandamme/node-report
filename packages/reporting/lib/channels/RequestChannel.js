class RequestChannel {
    constructor(options, engine) {
        this.options = options.options
        this.name = options.name
    }

    async load(ds, connection, params) {
        console.log("request data ",params)
        const req = ds.report.req
        if (this.options.data == "query" || params.data=="query"){
            console.log("add req.query")
            ds.addRow(req.query)
        }
        if (this.options.data == "headers" || params.data=="headers"){
            ds.addRow(req.headers)
        }
        if (this.options.data == "request" || params.data=="request"){
            ds.addRow({
                "baseUrl": req.baseUrl,
                "url": req.url,
                "hostname": req.hostname,
                "ip": req.ip,
                "ips": req.ips,
                "method": req.method,
                "originalUrl": req.originalUrl,
                "path": req.path,
                "protocol": req.protocol
            })
        }

    }
}

export default RequestChannel