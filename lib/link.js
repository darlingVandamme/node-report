import {URL} from 'node:url';

// https://nodejs.org/api/url.html#new-urlinput-base

// create from  express route + report name?

class Link{

    constructor(url, base, options) {
        this.url = new URL(url, base)
        this.options = options
    }
    // url.searchParams.delete('output')
    // url.searchParams.set('output','html')

    //extension??
    // handle options
    setExtension(ext){
        //using split(".") & join?
        if (this.url.pathname.indexOf(".")>0){
            // search for  last .
            this.url.pathname = this.url.pathname.replace( /\.([^.]*$)/ ,"."+ext)
        } else {
            this.url.pathname = this.url.pathname+"."+ext
        }
        //// console.log("pathname "+this.url.pathname)
        //// console.log("pathname "+this.url.href)
    }

    getExtension(includePoint){
        let i = (includePoint?0:1)
        if (this.url.pathname.indexOf(".")>0){
            // search for  last .
            return this.url.pathname.substr( this.url.pathname.search ( /\.([^.]*$)/ )+i , this.url.pathname.length)
        } else {
            return ""
        }
    }

    getReportPath(){
        let split = this.url.pathname.split("/")
        split.pop()
        return split.join("/")
    }

    getReportName(){
        let split = this.url.pathname.split("/")
        let rep = split.pop()
        let ext = this.getExtension(true)
        rep = rep.substr(0, (rep.length - ext.length))
        return split.join("/")
    }

    setReportName(reportName,extension){
        if (!extension) {extension = this.getExtension(false)}
        let path = this.getReportPath()
        path = path+"/"+reportName
        if (extension.length>0){
            path = path+"."+extension
        }
        this.url.pathname = path
    }

    set(key,value){
        this.url.searchParams.set(key, value)
        return this
    }
    delete(key){
        this.url.searchParams.delete(key)
        return this
    }

    // todo get relative

    toString() {return this.url.href}

    relative(){return this.url.pathname+this.url.search}

}

export {Link}