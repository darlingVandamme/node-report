import mysql from "mysql2/promise"
import {profileStats} from "../profileStats.js";

function IncludeChannel(options) {
    // // console.log("setup Mysql Channel " + JSON.stringify(options))
    this.options = options.options
    this.name = options.name

    this.connect = function (dataset) {
        //// console.log("connecting Mysql Channel connected" )
        dataset.init = init
        dataset.load = load
    }
}

function init(ds, channel, params){
    return Promise.resolve()
}

function load(ds, channel, params){
    console.log("loading inline data "+JSON.stringify(params))
    params.data?.forEach(row =>{
        ds.addRow(row)
    })
}



export default IncludeChannel