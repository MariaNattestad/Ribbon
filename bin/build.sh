#!/bin/bash

# This script avoids using a bundler :)
# Generate CSS and JS bundles. Note that we use `awk 1` instead of `cat` so we
# append an extra line after each file. Otherwise, this could break if one of
# the modules doesn't have a break line at the end of the min.js files.
awk 1 node_modules/{bootstrap/dist/css/bootstrap.min.css,jquery-ui-dist/jquery-ui.min.css} > css/bundle.css
awk 1 node_modules/{d3/d3.min.js,jquery/dist/jquery.min.js,bootstrap/dist/js/bootstrap.min.js,@biowasm/aioli/dist/aioli.js,pako/dist/pako.min.js,moment/min/moment.min.js,jquery-ui-dist/jquery-ui.min.js,papaparse/papaparse.min.js} > js/bundle.js
