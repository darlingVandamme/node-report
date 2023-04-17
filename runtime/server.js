import express from 'express'
import hbs from 'express-handlebars'
import path from "path"
import { fileURLToPath } from 'url';
import { ReportEngine } from '../lib/reportEngine.js';

const app = express()
console.log(import.meta)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('.hbs', hbs.engine({extname: '.hbs'}));
app.use(express.static(path.join(__dirname, 'public')));

let reports = new ReportEngine("/settings/reporting.json")
// correct way???  check node-gallery
app.use((req,res,next)=>reports.init(req,res,next));
app.get("/report/:name.:type",(req,res,next)=>reports.express(req,res,next))
app.get("/report/:name",(req,res,next)=>reports.express(req,res,next))


//app.get("report/:report", (req,res) =>{
//
// })
app.get("/", (req,res)=>{
    //res.send("Test reporting engine")
    res.render("index", { user:{name:"Jules"}  })
})

app.listen(3000,() => {
    console.log(`App listening on port 3000!`);
})