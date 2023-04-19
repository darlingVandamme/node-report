
function profileStats(name){
    this.name = name
    this.startTime = Date.now()

    this.requests = 0
    // todo keep recent timer (array)
    // keep list of all timers

    this.totalTime = 0

    this.addTime = function(time){
        this.totalTime += time
        this.requests ++
        // console.log(" profile "+this.name+" "+time+" "+this.requests+" requests,  "+this.totalTime+" totalTime")
    }

    this.start = () => {return Date.now()}
    this.stop = (startDate) => {this.addTime(Date.now()-startDate)}
}


export {profileStats}