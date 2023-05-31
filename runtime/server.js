import express from 'express'
import { create } from 'express-handlebars';
import path from "path"
import { fileURLToPath } from 'url';
import { ReportEngine } from '@darling_be/report';

const app = express()
const hbs = create({extname: '.hbs'});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root =  process.cwd()
console.log(process.cwd())
console.log(import.meta)

// override report module statics
app.use("/reporting",express.static(path.join(root, './runtime/public')));

/*app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('.hbs', hbs.engine );
 */
// app.use("/reporting",express.static(path.join(root, './packages/reporting/public')));


const reports = new ReportEngine("runtime/settings/reporting.json")
// correct way???
app.use((req,res,next)=>reports.init(req,res,next));
/*reports.usage = async (item) => {
    let m = reports.getChannel("localMongo")
    if (m) {
        let conn = await m.connection
        conn.db("reporting").collection("usage").insertOne(item)
    }
}*/

app.get("/report/:name.:type",(req,res,next)=>reports.express(req,res,next))
app.get("/report/:name",(req,res,next)=>reports.express(req,res,next))

//app.get("report/:report", (req,res) =>{
//
// })
app.get("/", (req,res)=>{
    //res.send("Test reporting engine")
    res.send("Reporting Demo setup ")
})

app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})
app.listen(3000,() => {
    console.log(`App listening on port 3000!`);
})