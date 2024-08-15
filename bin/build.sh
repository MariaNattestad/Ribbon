#!/bin/bash
# Hacky bundler script to generate CSS and JS bundles.

OUTPUT_CSS="css/bundle.css"
OUTPUT_JS="js/bundle.js"

CSS_MODULES=(
    "bootstrap/dist/css/bootstrap.min.css"
    "jquery-ui-dist/jquery-ui.min.css"
)

JS_MODULES=(
    "d3/d3.min.js"
    "jquery/dist/jquery.min.js"
    "bootstrap/dist/js/bootstrap.min.js"
    "@biowasm/aioli/dist/aioli.js"
    "pako/dist/pako.min.js"
    "moment/min/moment.min.js"
    "jquery-ui-dist/jquery-ui.min.js"
    "papaparse/papaparse.min.js"
)

echo -n > "$OUTPUT_CSS"
for file in "${CSS_MODULES[@]}"; do
    cat "node_modules/$file" <(echo) >> "$OUTPUT_CSS"
done

echo -n > "$OUTPUT_JS"
for file in "${JS_MODULES[@]}"; do
    cat "node_modules/$file" <(echo) >> "$OUTPUT_JS"
done
