
class InlineChannel {
    constructor(options) {
        // // console.log("setup Mysql Channel " + JSON.stringify(options))
        this.options = options.options
        this.name = options.name
    }

    init(ds, connection, params) {
        connection.data = params.data

    }

    load(ds, connection) {
        console.log("loading inline data "+JSON.stringify(connection.data))
        connection.data?.forEach(row => {
            ds.addRow(row)
        })
    }
}


export default InlineChannel