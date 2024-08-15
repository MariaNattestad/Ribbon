// Node.js script to manually create permalinks

const fs = require('fs');
const pako = require('pako');

if(process.argv.length < 4) {
    console.log('Usage: node create-permalink.js ../path/to/json "Permalink Description"');
    return;
}

// User input
let fp = process.argv[2],
    name = process.argv[3];

// Output compressed JSON
post_data = fs.readFileSync(fp, "utf8");
console.log(
    JSON.stringify({
        name: name,
        ribbon: Buffer.from(
            pako.deflate(
                JSON.stringify(post_data)
            )
        ).toString('base64')
    })
)
