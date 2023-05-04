import {URL} from 'node:url';

// https://nodejs.org/api/url.html#new-urlinput-base

// create from  express route + report name?

function Link(url, base, options){
    this.url = new URL(url , base)
    this.options = options

    // url.searchParams.delete('output')
    // url.searchParams.set('output','html')

    //extension??
    // handle options
    this.setExtension = function(ext){
        if (this.url.pathname.indexOf(".")>0){
            // search for  last .
            this.url.pathname = this.url.pathname.replace( /\.([^.]*$)/ ,"."+ext)
        } else {
            this.url.pathname = this.url.pathname+"."+ext
        }
        //// console.log("pathname "+this.url.pathname)
        //// console.log("pathname "+this.url.href)
    }

    this.getExtension = function(includePoint){
        let i = (includePoint?0:1)
        if (this.url.pathname.indexOf(".")>0){
            // search for  last .
            return this.url.pathname.substr( this.url.pathname.search ( /\.([^.]*$)/ )+i , this.url.pathname.length)
        } else {
            return ""
        }
    }

    this.getReportPath = function(){
        let split = this.url.pathname.split("/")
        split.pop()
        return split.join("/")
    }

    this.getReportName = function(){
        let split = this.url.pathname.split("/")
        let rep = split.pop()
        let ext = this.getExtension(true)
        rep = rep.substr(0, (rep.length - ext.length))
        return split.join("/")
    }

    this.setReportName = function(reportName,extension){
        if (!extension) {extension = this.getExtension(false)}
        let path = this.getReportPath()
        path = path+"/"+reportName
        if (extension.length>0){
            path = path+"."+extension
        }
        this.url.pathname = path
    }

    this.set = function(key,value){
        this.url.searchParams.set(key, value)
        return this
    }
    this.delete = function(key){
        this.url.searchParams.delete(key)
        return this
    }

    // todo get relative

    this.toString = function(){return this.url.href}

    this.relative = ()=>{return this.url.pathname+this.url.search}

}

export {Link}