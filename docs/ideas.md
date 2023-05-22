
## General
+ Git setup 
    - internal sharing quick
    - external github / npm
- Naming consistency!
- bookmarkability!!!    
- versioning

## package name
- reporting
- mining?
- tab
- data
- flow


## Logging
- engine level logging (available as development dataset?)
+ report level logging in dataset
- log to library (pino?)
- error handling? (log and error dataset?)
- Cost & timing logging per user
- user quota, short term quota
- messages? / flash
- Unique request ID?

## performance
- timeout?
- cost quota
- cost, timings & bytes  per user  logging

## ES6 import
+ dual mode library https://blog.logrocket.com/commonjs-vs-es-modules-node-js/
- https://redfin.engineering/node-modules-at-war-why-commonjs-and-es-modules-cant-get-along-9617135eeca1

## Dataset
+ Row - column set of values
    - singleton
    - array
    - Virtual (copy)
    - aggregate 
        - simple
        - combined
        - f()
+ dependencies? (auto?) require()
+ dataset.channel (connection to datasource channel)
+ dataset.done  init promise
+ dataset.init
+ dataset.load 
- dataset preload values?
- load several batches?  (required params multiple values?)
- filter dataset 
 
 
## aggregation
- reduce (and map and filter ....)
- https://jrsinclair.com/articles/2019/five-ways-to-average-with-js-reduce/ 
+ stats object?  Accumulator 
+ correlations?
+ min - max 
+ median, percentile, rank...

## computed columns
- client side computed columns ... 
- same row - same dataset - global
- hbs / combine / concatenate (eg. a href and img)
- predefined vs function
- predefined
    + rowNr
    - runningSum
    + rank
    + percentage         
- function
    Context:
                row : row,
                data : row.getData("raw"),
                dataset:this.ds,
                report:this.report
- script  idem as function but read from file
                

## filter
- server side 
- client side
- simple equal
- between
- combined equal
- f()
  
## Columns
- per dataset, columns geeft aan welke columns getoond worden (en welke volgorde)
- columns can be replaced by new types without really affecting the data 
- per column 
    - type  string(default), date, numbers  (how conversions?) 
    + display (date, number ...)
    + style   class style (css)
    + hidden
    + order (default: 100,110,120,130)
    + required (form)
    + template (default = displayvalue)
     
     
+ copy column
- calculated columns
    - flatten
    - json 
    + concatenate
    + hbs?
    - url / link
    - predefined calculation (percentage, sum, ...)
    - js function (value,columnName,row,dataset,report)=>{ }   vm.script
- tooltip / hover/ ellipsis
- column as parent client side filter criterium?
- labels, icons, https://www.w3schools.com/howto/howto_css_cards.asp

        
## displays
- simple display functions for cell data values
- needed?  or replaced by column types? 

## Sources / channels ?
- external (DB, files, ....)
- internal (copy, filter, merge, union, addfields...)
- subpackages
- http Query en body in dataset (en param)
-- automatic type conversions?
-- intelligent dates?
-- default values
- session, user
- check required fields // else error or args

- export default function
- connect (dataset, options) () can modify dataset.init and dataset.load functions
- external
    - dbs (mysql, bigquery, mongo ...)
    - dir
    - file (csv, json, avro?, ... )
    - API's    
    - report files
- internal 
    - counter
    - datecounter
    - date names (last year,...)
    - random
    + copy dataset
    - filter rows / columns
    - transpose
    - crosstab !!!
    - running sums / totals    
- system
    - process
    - reportengine channels
    - performance & counters        

## conditional sources
- choice between different queries (depending on availability of params)
- intelligent query creation?  select:"   " , from: "  "....
+ Query builder object

## paging
- only 1 paging per report
+ paging as dataset!
- skip
- limit
- pagesize
- pagNr
- nextURL
- previousURL
- maxHint
- Query params prefix? (paging_limit...)
- [url's] 
- pagerOutput to html
- estimate total number of pages (maxHint)

- endless scroll instead of paging??? load more...
- server side paging (a href) <> client side paging (reload list of datasets) 

## caching
- caching on dataset level (dataset cache ID)
- hash on input parameters (sorted)
- cache time
- No cache for user dependent data or time critical

## output format
- String formatting
- Date(time) 
- locale
- hyperlinks
- handlebars
- HTML / csv / JSON / excel/ pdf 
- debug output / all datasets (development)
- Graphs (client / server)  https://observablehq.com/plot/
- dynamic load //  reload single dataset 
- dashboard layouts
- output to express res (hbs?) / file / email / http POST / db insert ...
- server side rendering / client side rendering (same codebase)
- jsx? (react?)
- includes

- html: Whole page, report div, dataset div, anchors 
- content disposition  attachment download
- email / save to file
- excel
- JSON (custom stringify  (date))

## HTML output
- single dataset
- <main> </main>
- position per dataset (main, footer, nav, ....)
- hidden dataset
- stacked datasets  ( achors)
- tabs 
- includes  ? 
- hidden  <template> ? 
- lazy 
- table / li / div
- tabbed view 
- https://uxmovement.medium.com/10-design-tips-for-a-better-data-table-interface-8d6705e56be2
- images and icons  list lookup  // handlebars helper?
- show hide toggle
    https://alvarotrigo.com/blog/toggle-switch-css/
- client side function values
- recalculate function
- data-row=1
- data-value=""
- data-value=(report,ds,row)=>( )
- select box column  (radio column)     

- html tags  
    - address?
    - article
    - main
    - nav
    - canvas
    - colgroup
    - data  (id column)
    - datalist ( argForm )
    - dl  dd dt
    - details
    - meter
    - nav
    - section ?
    - input different types (argform)
    
## handlebars
- geen express-handlebars maar direct handlebars
- dynamic partials  https://handlebarsjs.com/guide/partials.html#dynamic-partials 
- express-handlebars https://www.npmjs.com/package/express-handlebars
- advanced example  https://github.com/express-handlebars/express-handlebars/blob/master/examples/advanced/server.js
- expose templates to client side!

## graph

- Eerst test met zelf gegenereerde grafieken
- Toch eerder Plot gebruiken
- Hover effecten  https://stackoverflow.com/questions/74454315/how-to-highlight-a-line-when-mouse-over-it-in-observable-plot-using-javascript
- https://observablehq.com/@mkfreeman/plot-tooltip
- https://observablehq.com/d/2e1daf099a7aaaea


## testing
- ???
- Mocha?

## reportEngine 
- keep sources, config
- find report syntax
- set up report
- namespaces

## reportsyntax
- JSON
- file system (database?)
- subfolders
- include datasets from other files?
+ include datasets from default

## argumentForm
- html file
- singleton
- auto generate vs custom template
- templating helpers (lookups, select, ..... )
- lookup values (select / radiobuttons ... )
- server side vs client side argform creation
- column option: form? formtype?
- best practice: Directly on query (or body)  or  on a summary intermediate dataset (args)
- client side required fields check
- argument form outside main 
- search as you type with list  // dynamic reload 
- argForm:{ dataset:"args", target:"html" }   
    - target or ext
    - submit or client side handling function? 
    - required fields?
    - hidden fields?
    
 
## security
- ENV?
- secrets 
- roles
- authentication
- passwords and keys in private config file
- Production vs Development  (log en debug only in development mode)
- log and debug in production only for logged in users
- file acces ensure rootDir  ../ injection prevention  (fs.realpath(path[, options], callback)) 
- avoid html injection in server side rendering and {{{ }}}
- auth keys for API use ???

## authentication
- passport demo
- bigquery end user auth token
- API's??
-  

## Frameworks
- express 
- fastify

## middleware
- express
- server/path/reportname.ext?query#hash
let reports = new ReportEngine("/settings/reporting.json")
app.use((req,res,next)=>reports.init(req,res,next));
app.get("/report/:name.:type",(req,res,next)=>reports.express(req,res,next))
app.get("/report/:name",(req,res,next)=>reports.express(req,res,next))

- use hash to specify dataset(s)?
- ext selects output type
- output=type as query param
- dataset=dsName to specify dataset list to render (not hidden)

## Secrethandler
- gitignore
- hashing / salting?
- runtime ENV VARS?
- development vs production 
- tokens (in session?)
- API tokens?

## I18n ?
- date formatting. client side locale?

## Themes ??


## debugging
- report.info 
    - datasets
    - dataset dependencies
    - available plugins
- report and engine statis as dataset
- console log enkel early development


## plugins
- plugin description? 
- channels / sources
- outputs for report / output for dataset
- columns
- displays (number, date, ....)
- images and icons ... 
- formDisplays based on column types
- formDisplay specific (selects, radiobuttons, sliders, calendars )

## testing
- mocha??

## CSS
- sass (less)
- Themes in directories
- Custom file 
- Versions?
- backward compatible custom files?
- dataset id?
- used classes
    - col1 col2 ... 
    - options.style
- general usefull concepts (colors, icons ...)
    - warning
    - ok
    - collapse
    - hide / show
    - ellipse
- hbs generating css ???    

## Client side javascript
- React render table
- Popups client side
- Popups server side data
- Show / hide hidden data
- argumentform onchange refresh 
- dataset filtering
- dataset sorting!
- widgets (show hide buttons, sorting, filtering, popups... )
- reload seconds / polling  vs  continuous update socket.io
+ data- attributes per dataset table (for reloading)
- custom js file includes
- Function location ( Handlebars generating js)
- Recalculate event
-  
 
## dir channel
- file data (file, extension, size ,)
- file content data?  (read report Json (description)  )
- Security

## bucket channel
- AWS
- GCS
- ssh scp

## CSV channel 
- file or bucket
- first row as columns
- skip & limit
- filter


## JSON file channel
- file or bucket
- Array or lines
- skip & limit
- filter

## SQL channel
- dynamic SQL
- Query as array
- slow queries log
- total query time / total # queries

## Dynamic queries

- dynamic SQL, but also mongo find and mongo pipelines compatible



## Mongo Channel
- vm script
- query as array
- find / findOne / aggregate ....

## Reporting info channel

## performance data as channel



## Dependencies
- as low as possible
- date formatting?  
    + Intl.dateFormat https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat
    - Days.js?
- channels specific dependencies in separate sub packages (mysql, mongo,)
 
 ## Public access
 - github
 - npm
 - blog / site 
 - example sites on public data
 - Postgres  RNA https://rnacentral.org/help/public-database
 - MariaDB   https://relational.fit.cvut.cz/search
 - MySQL RNA  https://docs.rfam.org/en/latest/database.html
 - Bigquery https://cloud.google.com/bigquery/public-data
 - Observable https://observablehq.com/@observablehq/sample-datasets#-aapl
 
 ## alternatives
 - https://kanaries.net/home
 