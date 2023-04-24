
## General
+ Git setup 
    - internal sharing quick
    - external github / npm
- Naming consistency!
- bookmarkability!!!    

## Logging
- engine level logging (available as development dataset?)
+ report level logging in dataset
- log to library (pino?)
- error handling? (log and error dataset?)
- Cost & timing logging per user
- user quota, short term quota
- messages? / flash

## performance
- timeout?
- cost quota
- cost, timings & bytes  per user  logging

## ES6 import
- dual mode library https://blog.logrocket.com/commonjs-vs-es-modules-node-js/
- https://redfin.engineering/node-modules-at-war-why-commonjs-and-es-modules-cant-get-along-9617135eeca1

## Dataset
- Row - column set of values
- singleton
+ dependencies? (auto?) require()
- dataset.channel (connection to datasource channel)
+ dataset.done  init promise
+ dataset.init
+ dataset.load 
- dataset preload values?
- load several batches?  (required params multiple values?)
- filter dataset  (server side and client side)
  
## Columns
- per dataset, columns geeft aan welke columns getoond worden (en welke volgorde)
- columns can be replaced by new types without really affecting the data 
- per column 
    - type  string(default), date, numbers  (how conversions?) 
    + display (date, number ...)
    + style   class style (css)
    - hide?
    + order 
- copy column
- calculated columns
    - flatten
    - json 
    - concatenate
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
    - copy dataset
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
- Graphs (client / server)
- dynamic load //  reload single dataset 
- dashboard layouts
- output to express res (hbs?) / file / email / http POST / db insert ...
- server side rendering / client side rendering (same codebase)
- jsx? (react?)

- html: Whole page, report div, dataset div, anchors 
- content disposition  attachment download
- email / save to file
- excel


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
- express-handlebars vs express-hbs?
- dynamic partials  https://handlebarsjs.com/guide/partials.html#dynamic-partials 
- express-handlebars https://www.npmjs.com/package/express-handlebars
- advanced example  https://github.com/express-handlebars/express-handlebars/blob/master/examples/advanced/server.js
- expose templates to client side!


## testing
- ???
- Mocha?

## reportEngine 
- keep sources, config
- find report syntax
- set up report


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
 
## dir channel
- file data (file, extension, size ,)
- file content data?  (read report Json (description)  )

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
 
 
 