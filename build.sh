#!/bin/bash
FILES_CSS=(
    "bootstrap/dist/css/bootstrap.min.css"
)

FILES_JS=(
    "d3/d3.min.js"
    "jquery/dist/jquery.min.js" 
    "bootstrap/dist/js/bootstrap.min.js"
    "@robertaboukhalil/aioli/aioli.js"
    "pako/dist/pako.min.js"
    "moment/min/moment.min.js"
)

# Move JS files to js/
for file in ${FILES_JS[@]}; do
  cp "node_modules/${file}" js/
done

# Move CSS files to css/
for file in ${FILES_CSS[@]}; do
  cp "node_modules/${file}" css/
done
