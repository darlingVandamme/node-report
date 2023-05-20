
class InlineChannel {
    constructor(options) {
        // // console.log("setup Mysql Channel " + JSON.stringify(options))
        this.options = options.options
        this.name = options.name
    }

    load(ds, connection, params) {
        //console.log("loading inline data "+JSON.stringify(connection.data))
        params.data?.forEach(row => {
            ds.addRow(row)
        })
        return Promise.resolve(ds)
    }
}


export default InlineChannel